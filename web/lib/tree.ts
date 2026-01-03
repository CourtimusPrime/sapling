import { Message } from './generated/prisma'
import { TreeNode } from './types'

// Simple cache for path calculations
const pathCache = new Map<string, TreeNode[]>()

export function clearPathCache() {
  pathCache.clear()
}

export function buildTree(messages: Message[]): TreeNode | null {
  // Clear path cache when rebuilding tree
  clearPathCache()
  
  const messageMap = new Map<string, Message>()
  const childrenMap = new Map<string | null, Message[]>()

  // Build maps
  for (const message of messages) {
    messageMap.set(message.id, message)
    const parentId = message.parentMessageId
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, [])
    }
    childrenMap.get(parentId)!.push(message)
  }

  // Find root (message with no parent)
  const rootMessages = childrenMap.get(null) || []
  if (rootMessages.length === 0) return null

  const rootMessage = rootMessages[0] // Assuming one root

  function buildNode(message: Message): TreeNode {
    const children = childrenMap.get(message.id) || []
    return {
      message,
      children: children.map(buildNode),
    }
  }

  return buildNode(rootMessage)
}
export function findNodeById(tree: TreeNode, id: string): TreeNode | null {
  if (tree.message.id === id) return tree
  for (const child of tree.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

export function getPathToNode(tree: TreeNode, targetId: string): TreeNode[] {
  // Check cache first
  if (pathCache.has(targetId)) {
    return pathCache.get(targetId)!
  }
  
  const path: TreeNode[] = []
  
  function traverse(node: TreeNode): boolean {
    path.push(node)
    if (node.message.id === targetId) return true
    for (const child of node.children) {
      if (traverse(child)) return true
    }
    path.pop()
    return false
  }
  
  traverse(tree)
  
  // Cache the result
  pathCache.set(targetId, [...path])
  return path
}

export function getSiblings(node: TreeNode, tree: TreeNode): TreeNode[] {
  if (!node.parent) return []
  return node.parent.children.filter(child => child !== node)
}

export function getDescendants(node: TreeNode): TreeNode[] {
  const descendants: TreeNode[] = []
  function collect(node: TreeNode) {
    for (const child of node.children) {
      descendants.push(child)
      collect(child)
    }
  }
  collect(node)
  return descendants
}

export function getLeafNodes(tree: TreeNode): TreeNode[] {
  const leaves: TreeNode[] = []
  function collect(node: TreeNode) {
    if (node.children.length === 0) {
      leaves.push(node)
    } else {
      for (const child of node.children) {
        collect(child)
      }
    }
  }
  collect(tree)
  return leaves
}