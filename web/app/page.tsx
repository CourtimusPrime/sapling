"use client";

import { useState, useEffect } from "react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { TreeSidebar } from "@/components/ai-elements/tree-sidebar";
import { TreeNode, Message as DBMessage } from "@/lib/types";
import { buildTree, getPathToNode } from "@/lib/tree";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string>("");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load or create conversation on mount
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        // Create new conversation
        const response = await fetch('/api/conversations', { method: 'POST' });
        const { conversationId: newId } = await response.json();
        setConversationId(newId);

        // Load messages
        const messagesResponse = await fetch(`/api/conversations/${newId}/messages`);
        const loadedMessages: DBMessage[] = await messagesResponse.json();

        // Build tree
        const builtTree = buildTree(loadedMessages);
        setTree(builtTree);
        if (builtTree) {
          setActiveNodeId(builtTree.message.id);
        }

        // Set active path messages
        updateActiveMessages(builtTree, builtTree?.message.id || "");
      } catch (error) {
        console.error('Error initializing conversation:', error);
      }
    };

    initializeConversation();
  }, []);

  // Keyboard shortcuts for tree navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when sidebar is open
      if (!isSidebarOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsSidebarOpen(false);
          break;
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleContinueFromHere(activeNodeId);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, activeNodeId, handleContinueFromHere]);

  const updateActiveMessages = (currentTree: TreeNode | null, nodeId: string) => {
    if (!currentTree) return;
    const path = getPathToNode(currentTree, nodeId);
    const activeMessages = path.map(node => node.message);
    setMessages(activeMessages);
  };

  const handleNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId);
    updateActiveMessages(tree, nodeId);
  };

  const handleContinueFromHere = (nodeId: string) => {
    setActiveNodeId(nodeId);
    updateActiveMessages(tree, nodeId);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const handleSubmit = async (message: { text: string; files: any[] }) => {
    if (!message.text.trim() || !conversationId || !activeNodeId) return;

    setStatus('streaming');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          parentMessageId: activeNodeId,
          content: message.text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Reload tree and messages after submission
      const messagesResponse = await fetch(`/api/conversations/${conversationId}/messages`);
      const loadedMessages: DBMessage[] = await messagesResponse.json();
      const builtTree = buildTree(loadedMessages);
      setTree(builtTree);

      // Update to the new head (last assistant message)
      const lastMessage = loadedMessages[loadedMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        setActiveNodeId(lastMessage.id);
        updateActiveMessages(builtTree, lastMessage.id);
      }

    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Tree Sidebar Toggle */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Sapling Chat</h1>
        <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <MenuIcon className="h-4 w-4 mr-2" />
          Tree
        </Button>
      </div>

      {/* Tree Sidebar */}
      <TreeSidebar
        tree={tree}
        activeNodeId={activeNodeId}
        activePathIds={tree ? getPathToNode(tree, activeNodeId).map(node => node.message.id) : []}
        onNodeClick={handleNodeClick}
        onContinueFromHere={handleContinueFromHere}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(false)}
      />

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