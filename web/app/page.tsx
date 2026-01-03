"use client";

import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { useState } from "react";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');

  const handleSubmit = async (message: { text: string; files: any[] }) => {
    if (!message.text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.text,
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      setStatus('streaming');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: assistantContent }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Sapling Chat</h1>
      </header>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask me anything to begin our chat"
            />
          ) : (
            messages.map((message) => (
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
  );
}