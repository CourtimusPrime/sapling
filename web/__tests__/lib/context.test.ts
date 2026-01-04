import { buildContext } from '@/lib/context'
import { prisma } from '@/lib/prisma'

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    message: {
      findUnique: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Context Building', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should build context from leaf to root', async () => {
    const mockMessages = [
      {
        id: 'root',
        conversationId: 'conv1',
        parentMessageId: null,
        role: 'system',
        content: 'System message',
        depth: 0,
        createdAt: new Date(),
      },
      {
        id: 'user1',
        conversationId: 'conv1',
        parentMessageId: 'root',
        role: 'user',
        content: 'User message 1',
        depth: 1,
        createdAt: new Date(),
      },
      {
        id: 'assistant1',
        conversationId: 'conv1',
        parentMessageId: 'user1',
        role: 'assistant',
        content: 'Assistant message 1',
        depth: 2,
        createdAt: new Date(),
      },
    ]

    // Mock the database calls - the function walks from leaf to root
    mockPrisma.message.findUnique.mockImplementation((args: any) => {
      const message = mockMessages.find(m => m.id === args.where.id)
      return Promise.resolve(message || null)
    })

    const context = await buildContext('assistant1')

    expect(context).toHaveLength(3)
    expect(context[0].id).toBe('root')
    expect(context[1].id).toBe('user1')
    expect(context[2].id).toBe('assistant1')

    expect(mockPrisma.message.findUnique).toHaveBeenCalledTimes(3) // 3 messages found
  })

  it('should handle non-existent message', async () => {
    mockPrisma.message.findUnique.mockResolvedValueOnce(null)

    const context = await buildContext('nonexistent')

    expect(context).toHaveLength(0)
    expect(mockPrisma.message.findUnique).toHaveBeenCalledTimes(1)
  })

  it('should handle single message context', async () => {
    const mockMessage = {
      id: 'root',
      conversationId: 'conv1',
      parentMessageId: null,
      role: 'system',
      content: 'System message',
      depth: 0,
      createdAt: new Date(),
    }

    mockPrisma.message.findUnique.mockImplementation((args: any) => {
      return Promise.resolve(args.where.id === 'root' ? mockMessage : null)
    })

    const context = await buildContext('root')

    expect(context).toHaveLength(1)
    expect(context[0].id).toBe('root')
  })

  it('should handle database errors gracefully', async () => {
    mockPrisma.message.findUnique.mockRejectedValueOnce(new Error('Database error'))

    await expect(buildContext('someId')).rejects.toThrow('Database error')
  })

  it('should build context in correct order (root to leaf)', async () => {
    const mockMessages = [
      {
        id: 'root',
        conversationId: 'conv1',
        parentMessageId: null,
        role: 'system',
        content: 'System prompt',
        depth: 0,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'msg1',
        conversationId: 'conv1',
        parentMessageId: 'root',
        role: 'user',
        content: 'First user message',
        depth: 1,
        createdAt: new Date('2024-01-01T00:01:00Z'),
      },
      {
        id: 'msg2',
        conversationId: 'conv1',
        parentMessageId: 'msg1',
        role: 'assistant',
        content: 'First assistant response',
        depth: 2,
        createdAt: new Date('2024-01-01T00:02:00Z'),
      },
      {
        id: 'msg3',
        conversationId: 'conv1',
        parentMessageId: 'msg2',
        role: 'user',
        content: 'Second user message',
        depth: 3,
        createdAt: new Date('2024-01-01T00:03:00Z'),
      },
    ]

    // Mock the chain
    mockPrisma.message.findUnique
      .mockResolvedValueOnce(mockMessages[3]) // msg3
      .mockResolvedValueOnce(mockMessages[2]) // msg2
      .mockResolvedValueOnce(mockMessages[1]) // msg1
      .mockResolvedValueOnce(mockMessages[0]) // root
      .mockResolvedValueOnce(null)

    const context = await buildContext('msg3')

    // Should be in chronological order: root -> msg1 -> msg2 -> msg3
    expect(context).toHaveLength(4)
    expect(context.map(m => m.id)).toEqual(['root', 'msg1', 'msg2', 'msg3'])
    expect(context.map(m => m.role)).toEqual(['system', 'user', 'assistant', 'user'])
  })
})