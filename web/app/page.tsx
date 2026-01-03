"use client";

import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { ConversationTree } from "@/components/conversation-tree";
import { useState, useEffect } from "react";

type Message = {
  id: string;
  parentMessageId: string | null;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  depth: number;
  createdAt: string;
};

type Conversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load current conversation tree when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadConversationTree(currentConversation.id);
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (data.length > 0 && !currentConversation) {
          setCurrentConversation(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversationTree = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const messages = await response.json();
        setCurrentConversation(prev => prev ? { ...prev, messages } : null);
      }
    } catch (error) {
      console.error('Failed to load conversation tree:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', { method: 'POST' });
      if (response.ok) {
        const newConv = await response.json();
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversation(newConv);
        setCurrentMessageId(null);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setCurrentMessageId(nodeId);
  };

  const handleSubmit = async (message: { text: string; files: any[] }) => {
    if (!message.text.trim() || !currentConversation) return;

    try {
      // Create user message
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          content: message.text,
          role: 'user',
          parentMessageId: currentMessageId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create message');

      const userMessage = await response.json();

      // Update local state
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMessage]
      } : null);

      setCurrentMessageId(userMessage.id);
      setStatus('streaming');

      // Get context for AI
      const contextResponse = await fetch(`/api/messages/${userMessage.id}/context`);
      if (!contextResponse.ok) throw new Error('Failed to get context');

      const contextMessages = await contextResponse.json();

      // Send to AI
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: contextMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
        }),
      });

      if (!aiResponse.ok) throw new Error('Failed to get AI response');

      // Handle streaming response
      const reader = aiResponse.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';

      // Create assistant message placeholder
      const assistantResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          content: '',
          role: 'assistant',
          parentMessageId: userMessage.id,
        }),
      });

      if (!assistantResponse.ok) throw new Error('Failed to create assistant message');

      const assistantMessage = await assistantResponse.json();

      // Update local state
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, assistantMessage]
      } : null);

      // Stream content
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        // Update message content
        await fetch(`/api/messages/${assistantMessage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: assistantContent }),
        });

        // Update local state
        setCurrentConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: assistantContent }
              : msg
          )
        } : null);
      }

      setCurrentMessageId(assistantMessage.id);
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  };

  const getCurrentPathMessages = (): Message[] => {
    if (!currentConversation || !currentMessageId) return [];

    // Find the current message and walk up to root
    const messages: Message[] = [];
    let currentId: string | null = currentMessageId;

    while (currentId) {
      const current = currentConversation.messages.find(m => m.id === currentId);
      if (!current) break;

      messages.unshift(current);
      currentId = current.parentMessageId;
    }

    return messages;
  };

  return (
    <div className="flex h-screen bg-background">
      <ConversationTree
        messages={currentConversation?.messages || []}
        currentMessageId={currentMessageId || undefined}
        onNodeClick={handleNodeClick}
      />
      <div className="flex flex-col flex-1">
        <header className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Sapling Chat</h1>
            <button
              onClick={createNewConversation}
              className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
            >
              New Conversation
            </button>
          </div>
        </header>

        <Conversation className="flex-1">
          <ConversationContent>
            {getCurrentPathMessages().length === 0 ? (
              <ConversationEmptyState
                title="Start a conversation"
                description="Ask me anything to begin our chat"
              />
            ) : (
              getCurrentPathMessages().map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    <MessageResponse>{message.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  placeholder="Type your message..."
                />
                <PromptInputSubmit status={status === 'streaming' ? 'streaming' : status === 'error' ? 'error' : undefined} />
              </PromptInputBody>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}