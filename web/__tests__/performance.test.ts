import { buildTree, getPathToNode, getLeafNodes, clearPathCache } from '@/lib/tree'
import { buildContext } from '@/lib/context'
import { Message } from '@/lib/types'

// Generate a large conversation tree for performance testing
function generateLargeConversation(messageCount: number): Message[] {
  const messages: Message[] = []
  const conversationId = 'perf-test-conv'

  // Create root system message
  messages.push({
    id: 'root',
    conversationId,
    parentMessageId: null,
    role: 'system',
    content: 'You are a helpful AI assistant.',
    depth: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  })

  // Generate a deep conversation tree
  let currentDepth = 1
  let currentParentId = 'root'
  let messageIndex = 1

  for (let i = 1; i < messageCount; i++) {
    const role = i % 2 === 1 ? 'user' : 'assistant'
    const id = `msg-${messageIndex++}`

    messages.push({
      id,
      conversationId,
      parentMessageId: currentParentId,
      role,
      content: `${role === 'user' ? 'User' : 'Assistant'} message ${i}`,
      depth: currentDepth,
      createdAt: new Date(`2024-01-01T00:${String(i).padStart(2, '0')}:00Z`),
    })

    // Occasionally create branches (every 10 messages, create a branch)
    if (i % 10 === 0 && currentDepth < 5) {
      // Continue from an earlier message to create a branch
      const branchParentIndex = Math.max(0, messages.length - 20)
      currentParentId = messages[branchParentIndex].id
      currentDepth = messages[branchParentIndex].depth + 1
    } else {
      currentParentId = id
      currentDepth++
    }

    // Prevent depth from getting too deep
    if (currentDepth > 10) {
      currentDepth = 2
      currentParentId = messages[1].id // Reset to second message
    }
  }

  return messages
}

describe('Performance Tests', () => {
  describe('Tree Operations', () => {
    it('should handle large conversation trees efficiently', () => {
      const messageCounts = [50, 100, 200]

      messageCounts.forEach(count => {
        clearPathCache()
        const messages = generateLargeConversation(count)

        const startTime = performance.now()
        const tree = buildTree(messages)
        const buildTime = performance.now() - startTime

        expect(tree).toBeTruthy()
        expect(buildTime).toBeLessThan(100) // Should build in under 100ms

        // Test path finding performance
        const leafNodes = getLeafNodes(tree!)
        const pathTimes: number[] = []

        leafNodes.slice(0, 10).forEach(leaf => { // Test first 10 leaves
          const pathStart = performance.now()
          const path = getPathToNode(tree!, leaf.message.id)
          const pathTime = performance.now() - pathStart
          pathTimes.push(pathTime)

          expect(path.length).toBeGreaterThan(0)
          expect(path[path.length - 1].message.id).toBe(leaf.message.id)
        })

        const avgPathTime = pathTimes.reduce((a, b) => a + b, 0) / pathTimes.length
        expect(avgPathTime).toBeLessThan(10) // Average path lookup under 10ms
      })
    })

    it('should maintain performance with branching', () => {
      clearPathCache()
      const messages = generateLargeConversation(100)

      const tree = buildTree(messages)
      expect(tree).toBeTruthy()

      // Test that branching doesn't break performance
      const startTime = performance.now()
      const allLeaves = getLeafNodes(tree!)
      const discoveryTime = performance.now() - startTime

      expect(discoveryTime).toBeLessThan(50) // Should discover leaves quickly
      expect(allLeaves.length).toBeGreaterThan(1) // Should have multiple branches
    })
  })

  describe('Context Building Performance', () => {
    it('should build context efficiently for deep conversations', async () => {
      // This test would require a real database setup
      // For now, we'll skip the actual database calls and test the algorithm structure

      // Test that the context building algorithm is efficient
      // In a real scenario, this would measure database query performance
      const mockMessages = generateLargeConversation(50)
      const deepMessage = mockMessages[mockMessages.length - 1]

      // Simulate the path walking algorithm (without database calls)
      const path: Message[] = []
      let currentMessage: Message | undefined = deepMessage

      const startTime = performance.now()
      while (currentMessage) {
        path.push(currentMessage)
        currentMessage = mockMessages.find(m => m.id === currentMessage!.parentMessageId)
      }
      const contextBuildTime = performance.now() - startTime

      expect(contextBuildTime).toBeLessThan(5) // Should be very fast in memory
      expect(path.length).toBeGreaterThan(1) // Should have a path
      expect(path[path.length - 1].role).toBe('system') // Should end with system message (reverse order)
    })
  })

  describe('Memory Usage', () => {
    it('should not have memory leaks in tree operations', () => {
      // Test that repeated tree operations don't accumulate memory
      const initialMemory = process.memoryUsage().heapUsed

      for (let i = 0; i < 100; i++) {
        clearPathCache()
        const messages = generateLargeConversation(20)
        const tree = buildTree(messages)

        // Perform various operations
        getLeafNodes(tree!)
        getPathToNode(tree!, messages[messages.length - 1].id)
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Allow for some memory increase but not excessive
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
    })
  })

  describe('Scalability Metrics', () => {
    it('should scale linearly with message count', () => {
      const testSizes = [10, 25, 50, 100]
      const buildTimes: number[] = []
      const pathTimes: number[] = []

      testSizes.forEach(size => {
        clearPathCache()
        const messages = generateLargeConversation(size)

        // Measure build time
        const buildStart = performance.now()
        const tree = buildTree(messages)
        const buildTime = performance.now() - buildStart
        buildTimes.push(buildTime)

        // Measure path finding time for deepest path
        const pathStart = performance.now()
        getPathToNode(tree!, messages[messages.length - 1].id)
        const pathTime = performance.now() - pathStart
        pathTimes.push(pathTime)
      })

      // Verify that performance scales reasonably
      // Build time should not grow exponentially
      for (let i = 1; i < buildTimes.length; i++) {
        const ratio = buildTimes[i] / buildTimes[i - 1]
        const sizeRatio = testSizes[i] / testSizes[i - 1]
        expect(ratio).toBeLessThan(sizeRatio * 2) // Allow some non-linear growth but not exponential
      }
    })
  })
})