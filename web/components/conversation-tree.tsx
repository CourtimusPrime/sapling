"use client";

import { ChevronRight, ChevronDown, GitBranch } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  parentMessageId: string | null;
  conversationId: string;
  content: string;
  role: string;
  depth: number;
  createdAt: string;
};

type TreeNode = Message & {
  children: TreeNode[];
  isCurrent?: boolean;
};

type ConversationTreeProps = {
  messages: Message[];
  currentMessageId?: string;
  onNodeClick: (nodeId: string) => void;
  className?: string;
};

function TreeNodeComponent({
  node,
  onNodeClick,
  isExpanded = true,
  onToggle
}: {
  node: TreeNode;
  onNodeClick: (nodeId: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const isLeaf = !hasChildren;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded hover:bg-accent cursor-pointer text-sm",
          node.isCurrent && "bg-accent border border-border"
        )}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
        onClick={() => onNodeClick(node.id)}
      >
        {!isLeaf && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {isLeaf && <div className="w-4" />}
        {hasChildren && <GitBranch className="h-3 w-3 text-muted-foreground" />}
        <div className="flex-1 truncate">
          <span className="font-medium">{node.role === 'user' ? 'You' : 'AI'}</span>
          <span className="text-muted-foreground ml-2">
            {node.content.slice(0, 50)}...
          </span>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              onNodeClick={onNodeClick}
              isExpanded={true}
              onToggle={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ConversationTree({
  messages,
  currentMessageId,
  onNodeClick,
  className
}: ConversationTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure from flat array
  const buildTree = (msgs: Message[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create node map
    msgs.forEach(msg => {
      nodeMap.set(msg.id, { 
        ...msg, 
        children: [], 
        isCurrent: msg.id === currentMessageId 
      });
    });

    // Second pass: build tree
    msgs.forEach(msg => {
      if (msg.parentMessageId) {
        const parent = nodeMap.get(msg.parentMessageId);
        if (parent) {
          parent.children.push(nodeMap.get(msg.id)!);
        }
      } else {
        rootNodes.push(nodeMap.get(msg.id)!);
      }
    });

    return rootNodes;
  };

  const treeStructure = buildTree(messages);

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  return (
    <div className={cn("w-80 border-r border-border bg-card", className)}>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Conversation Tree</h3>
      </div>
      <div className="p-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {treeStructure.map((rootNode) => (
          <TreeNodeComponent
            key={rootNode.id}
            node={rootNode}
            onNodeClick={onNodeClick}
            isExpanded={expandedNodes.has(rootNode.id)}
            onToggle={() => toggleExpanded(rootNode.id)}
          />
        ))}
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No messages yet
          </div>
        )}
      </div>
    </div>
  );
}