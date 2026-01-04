"use client";

import { useState } from "react";
import { TreeNode } from "@/lib/types";
import { buildTree, getPathToNode, getLeafNodes } from "@/lib/tree";
import { ChevronRightIcon, ChevronDownIcon, MessageSquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TreeNodeComponentProps {
  node: TreeNode;
  activeNodeId: string;
  activePathIds: string[];
  onNodeClick: (nodeId: string) => void;
  onContinueFromHere: (nodeId: string) => void;
  depth?: number;
}

const TreeNodeComponent = ({
  node,
  activeNodeId,
  activePathIds,
  onNodeClick,
  onContinueFromHere,
  depth = 0,
}: TreeNodeComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.message.id === activeNodeId;
  const isInActivePath = activePathIds.includes(node.message.id);
  const hasBranches = node.children.length > 1;

  const indentClass = `ml-${Math.min(depth * 4, 16)}`; // Max indent

  return (
    <div className={cn("select-none", indentClass)}>
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary",
          isActive && "bg-accent font-medium ring-2 ring-primary",
          isInActivePath && !isActive && "bg-accent/50 border-l-2 border-primary"
        )}
        onClick={() => onNodeClick(node.message.id)}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isActive}
        aria-label={`${node.message.role === 'user' ? 'User' : 'Assistant'} message: ${node.message.content.slice(0, 50)}...`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNodeClick(node.message.id);
          }
        }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronRightIcon className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-4" />
        )}

        <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />

        <span className="text-sm truncate flex-1">
          {node.message.role === 'user' ? 'You' : 'Assistant'}: {node.message.content.slice(0, 50)}...
        </span>

        {hasBranches && (
          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Has branches" />
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onContinueFromHere(node.message.id);
          }}
        >
          Continue
        </Button>
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-4">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.message.id}
              node={child}
              activeNodeId={activeNodeId}
              activePathIds={activePathIds}
              onNodeClick={onNodeClick}
              onContinueFromHere={onContinueFromHere}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeSidebarProps {
  tree: TreeNode | null;
  activeNodeId: string;
  activePathIds: string[];
  onNodeClick: (nodeId: string) => void;
  onContinueFromHere: (nodeId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TreeSidebar = ({
  tree,
  activeNodeId,
  activePathIds,
  onNodeClick,
  onContinueFromHere,
  isOpen,
  onToggle,
}: TreeSidebarProps) => {
  if (!tree) return null;

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-background border-r border-border transition-all duration-300 z-50",
        isOpen ? "w-80 md:w-96" : "w-0"
      )}
      role="tree"
      aria-label="Conversation tree navigation"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Conversation Tree</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ✕
          </Button>
        </div>
      </div>

      {/* Branch Navigation */}
      <div className="p-4 border-b border-border bg-muted/50">
        <h4 className="text-sm font-medium mb-2">Branch Heads</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {getLeafNodes(tree).map((leaf) => (
            <Button
              key={leaf.message.id}
              variant={leaf.message.id === activeNodeId ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => onNodeClick(leaf.message.id)}
            >
              <MessageSquareIcon className="h-3 w-3 mr-1" />
              {leaf.message.role === 'user' ? 'You' : 'Assistant'}: {leaf.message.content.slice(0, 30)}...
            </Button>
          ))}
        </div>
      </div>

      <div className="p-2 overflow-y-auto h-full">
        <TreeNodeComponent
          node={tree}
          activeNodeId={activeNodeId}
          activePathIds={activePathIds}
          onNodeClick={onNodeClick}
          onContinueFromHere={onContinueFromHere}
        />
      </div>
    </div>
  );
};