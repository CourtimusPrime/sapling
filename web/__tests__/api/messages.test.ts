import { POST as createMessage } from '@/app/api/messages/route'
import { GET as getConversationMessages } from '@/app/api/conversations/[id]/messages/route'
import { prisma } from '@/lib/prisma'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
  NextRequest: jest.fn(),
}))

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}))

const mockRandomUUID = jest.mocked(require('crypto').randomUUID)

describe('Messages API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/messages', () => {
    it('should create a message and return messageId', async () => {
      const messageId = 'msg-123'
      const conversationId = 'conv-789'
      const parentId = 'parent-msg'
      const userContent = 'Hello, AI!'

      mockRandomUUID.mockReturnValueOnce(messageId)

      const mockParentMessage = {
        conversationId,
        depth: 2,
      }

      mockPrisma.message.findUnique.mockResolvedValueOnce(mockParentMessage as any)
      mockPrisma.message.create.mockResolvedValueOnce({
        id: messageId,
        conversationId,
        parentMessageId: parentId,
        role: 'user',
        content: userContent,
        depth: 3,
        createdAt: new Date(),
      })

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          conversationId,
          parentMessageId: parentId,
          role: 'user',
          content: userContent,
        }),
      }

      const response = await createMessage(mockRequest as any)
      const result = await response.json()

      expect(result.messageId).toBe(messageId)
      expect(mockPrisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: parentId },
        select: { conversationId: true, depth: true },
      })
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          id: messageId,
          conversationId,
          parentMessageId: parentId,
          role: 'user',
          content: userContent,
          depth: 3, // parent depth + 1
        },
      })
    })

    it('should handle creation errors', async () => {
      mockRandomUUID.mockReturnValueOnce('msg-123')
      mockPrisma.message.create.mockRejectedValueOnce(new Error('Creation failed'))

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          conversationId: 'conv-123',
          parentMessageId: 'parent-123',
          content: 'Test message',
        }),
      }

      const response = await createMessage(mockRequest as any)
      const result = await response.json()

      expect(result.error).toBe('Missing required fields')
    })
  })

  describe('GET /api/conversations/[id]/messages', () => {
    it('should return paginated messages for conversation', async () => {
      const conversationId = 'conv-123'
      const mockMessages = [
        {
          id: 'msg1',
          conversationId,
          parentMessageId: null,
          role: 'system',
          content: 'System message',
          depth: 0,
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 'msg2',
          conversationId,
          parentMessageId: 'msg1',
          role: 'user',
          content: 'User message',
          depth: 1,
          createdAt: new Date('2024-01-01T00:01:00Z'),
        },
      ]

      mockPrisma.message.findMany.mockResolvedValueOnce(mockMessages)

      const mockRequest = {
        url: 'http://localhost:3000/api/conversations/conv-123/messages?limit=10&offset=0',
      }

      const response = await getConversationMessages(mockRequest as any, { params: Promise.resolve({ id: conversationId }) })
      const result = await response.json()

      expect(result).toEqual(mockMessages)
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 10,
        skip: 0,
      })
    })

    it('should use default pagination values', async () => {
      const conversationId = 'conv-123'
      mockPrisma.message.findMany.mockResolvedValueOnce([])

      const mockRequest = {
        url: 'http://localhost:3000/api/conversations/conv-123/messages',
      }

      const response = await getConversationMessages(mockRequest as any, { params: Promise.resolve({ id: conversationId }) })

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 50, // default limit
        skip: 0,  // default offset
      })
    })

    it('should handle database errors', async () => {
      mockPrisma.message.findMany.mockRejectedValueOnce(new Error('Database error'))

      const mockRequest = {
        url: 'http://localhost:3000/api/conversations/conv-123/messages',
      }

      const response = await getConversationMessages(mockRequest as any, { params: Promise.resolve({ id: 'conv-123' }) })
      const result = await response.json()

      expect(result.error).toBe('Failed to fetch messages')
    })
  })
})