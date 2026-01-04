import { buildTree, findNodeById, getPathToNode, getLeafNodes, clearPathCache } from '@/lib/tree'
import { TreeNode } from '@/lib/types'

// Mock messages for testing
const mockMessages = [
  {
    id: 'root',
    conversationId: 'conv1',
    parentMessageId: null,
    role: 'system' as const,
    content: 'You are a helpful assistant.',
    depth: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'user1',
    conversationId: 'conv1',
    parentMessageId: 'root',
    role: 'user' as const,
    content: 'Hello!',
    depth: 1,
    createdAt: new Date('2024-01-01T00:01:00Z'),
  },
  {
    id: 'assistant1',
    conversationId: 'conv1',
    parentMessageId: 'user1',
    role: 'assistant' as const,
    content: 'Hi there!',
    depth: 2,
    createdAt: new Date('2024-01-01T00:02:00Z'),
  },
  {
    id: 'user2',
    conversationId: 'conv1',
    parentMessageId: 'assistant1',
    role: 'user' as const,
    content: 'Tell me a joke.',
    depth: 3,
    createdAt: new Date('2024-01-01T00:03:00Z'),
  },
  {
    id: 'assistant2',
    conversationId: 'conv1',
    parentMessageId: 'user2',
    role: 'assistant' as const,
    content: 'Why did the chicken cross the road?',
    depth: 4,
    createdAt: new Date('2024-01-01T00:04:00Z'),
  },
  // Branch from assistant1
  {
    id: 'user1b',
    conversationId: 'conv1',
    parentMessageId: 'assistant1',
    role: 'user' as const,
    content: 'What\'s the weather?',
    depth: 3,
    createdAt: new Date('2024-01-01T00:05:00Z'),
  },
  {
    id: 'assistant1b',
    conversationId: 'conv1',
    parentMessageId: 'user1b',
    role: 'assistant' as const,
    content: 'I don\'t have access to weather data.',
    depth: 4,
    createdAt: new Date('2024-01-01T00:06:00Z'),
  },
]

describe('Tree Utilities', () => {
  let tree: TreeNode | null

  beforeEach(() => {
    clearPathCache()
    tree = buildTree(mockMessages)
  })

  describe('buildTree', () => {
    it('should build a tree from flat message array', () => {
      expect(tree).toBeTruthy()
      expect(tree!.message.id).toBe('root')
      expect(tree!.children).toHaveLength(1)
    })

    it('should handle branching correctly', () => {
      const assistant1Node = findNodeById(tree!, 'assistant1')!
      expect(assistant1Node.children).toHaveLength(2) // user2 and user1b

      const branchNodes = assistant1Node.children.map(child => child.message.id)
      expect(branchNodes).toContain('user2')
      expect(branchNodes).toContain('user1b')
    })

    it('should maintain correct depth levels', () => {
      const leafNodes = getLeafNodes(tree!)
      leafNodes.forEach(node => {
        expect(node.children).toHaveLength(0)
      })

      // Check specific depths
      expect(findNodeById(tree!, 'root')!.message.depth).toBe(0)
      expect(findNodeById(tree!, 'user1')!.message.depth).toBe(1)
      expect(findNodeById(tree!, 'assistant1')!.message.depth).toBe(2)
    })
  })

  describe('findNodeById', () => {
    it('should find existing nodes', () => {
      const node = findNodeById(tree!, 'assistant2')
      expect(node).toBeTruthy()
      expect(node!.message.content).toBe('Why did the chicken cross the road?')
    })

    it('should return null for non-existent nodes', () => {
      const node = findNodeById(tree!, 'nonexistent')
      expect(node).toBeNull()
    })

    it('should find root node', () => {
      const node = findNodeById(tree!, 'root')
      expect(node).toBe(tree)
    })
  })

  describe('getPathToNode', () => {
    it('should return correct path from root to target node', () => {
      const path = getPathToNode(tree!, 'assistant2')
      expect(path).toHaveLength(5)
      expect(path.map(n => n.message.id)).toEqual(['root', 'user1', 'assistant1', 'user2', 'assistant2'])
    })

    it('should return path for root node', () => {
      const path = getPathToNode(tree!, 'root')
      expect(path).toHaveLength(1)
      expect(path[0].message.id).toBe('root')
    })

    it('should cache path calculations', () => {
      // First call should compute and cache
      const path1 = getPathToNode(tree!, 'assistant2')
      // Second call should use cache
      const path2 = getPathToNode(tree!, 'assistant2')
      expect(path1).toEqual(path2)
    })

    it('should handle branched paths correctly', () => {
      const path = getPathToNode(tree!, 'assistant1b')
      expect(path.map(n => n.message.id)).toEqual(['root', 'user1', 'assistant1', 'user1b', 'assistant1b'])
    })
  })

  describe('getLeafNodes', () => {
    it('should return all leaf nodes', () => {
      const leaves = getLeafNodes(tree!)
      const leafIds = leaves.map(n => n.message.id).sort()
      expect(leafIds).toEqual(['assistant1b', 'assistant2'])
    })

    it('should handle single node tree', () => {
      const singleTree = buildTree([mockMessages[0]])
      const leaves = getLeafNodes(singleTree!)
      expect(leaves).toHaveLength(1)
      expect(leaves[0].message.id).toBe('root')
    })
  })

  describe('Tree Structure Integrity', () => {
    it('should maintain single parent relationship', () => {
      // Each message should appear exactly once in the tree
      const allNodeIds = new Set<string>()

      function collectIds(node: TreeNode) {
        allNodeIds.add(node.message.id)
        node.children.forEach(collectIds)
      }

      collectIds(tree!)
      expect(allNodeIds.size).toBe(mockMessages.length)
    })

    it('should prevent cycles', () => {
      // Ensure no node appears in its own path (would indicate a cycle)
      const allNodes = mockMessages.map(m => m.id)

      allNodes.forEach(nodeId => {
        const path = getPathToNode(tree!, nodeId)
        const pathIds = path.map(n => n.message.id)
        const uniqueIds = new Set(pathIds)
        expect(uniqueIds.size).toBe(pathIds.length) // No duplicates means no cycles
      })
    })

    it('should maintain correct parent-child relationships', () => {
      mockMessages.forEach(message => {
        if (message.parentMessageId) {
          const node = findNodeById(tree!, message.id)!
          const parentNode = findNodeById(tree!, message.parentMessageId)!

          // The parent should have this node as a child
          const isChildOfParent = parentNode.children.some(child => child.message.id === message.id)
          expect(isChildOfParent).toBe(true)

          // The node's parent should match the message's parentMessageId
          expect(node.message.parentMessageId).toBe(message.parentMessageId)
        }
      })
    })
  })
})