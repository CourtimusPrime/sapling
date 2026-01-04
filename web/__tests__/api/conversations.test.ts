import { GET as getConversations, POST as createConversation } from '@/app/api/conversations/route'
import { GET as getConversation, PATCH as updateConversation, DELETE as deleteConversation } from '@/app/api/conversations/[id]/route'
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
    conversation: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}))

const mockRandomUUID = jest.mocked(require('crypto').randomUUID)

describe('Conversations API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/conversations', () => {
    it('should return list of conversations with message counts', async () => {
      const mockConversations = [
        {
          id: 'conv1',
          title: 'Test Conversation 1',
          createdAt: new Date('2024-01-01'),
          _count: { messages: 5 },
        },
        {
          id: 'conv2',
          title: null,
          createdAt: new Date('2024-01-02'),
          _count: { messages: 3 },
        },
      ]

      mockPrisma.conversation.findMany.mockResolvedValueOnce(mockConversations)

      const response = await getConversations()
      const result = await response.json()

      expect(response.status).toBe(200) // NextResponse has status
      expect(result).toEqual(mockConversations)
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should handle database errors', async () => {
      mockPrisma.conversation.findMany.mockRejectedValueOnce(new Error('Database error'))

      const response = await getConversations()
      const result = await response.json()

      expect(result.error).toBe('Failed to fetch conversations')
    })
  })

  describe('POST /api/conversations', () => {
    it('should create new conversation with system message', async () => {
      const conversationId = 'conv-123'
      const systemMessageId = 'msg-456'

      mockRandomUUID.mockReturnValueOnce(conversationId)
      mockRandomUUID.mockReturnValueOnce(systemMessageId)

      const mockConversation = {
        id: conversationId,
      }

      mockPrisma.conversation.create.mockResolvedValueOnce(mockConversation)
      mockPrisma.message.create.mockResolvedValueOnce({} as any)

      const mockRequest = {}

      const response = await createConversation(mockRequest as any)
      const result = await response.json()

      expect(result.conversationId).toBe(conversationId)
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: { id: conversationId },
      })
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          id: systemMessageId,
          conversationId,
          role: 'system',
          content: 'You are a helpful AI assistant. Engage in natural conversation and provide useful responses.',
          depth: 0,
        },
      })
    })

    it('should handle creation errors', async () => {
      mockRandomUUID.mockReturnValueOnce('conv-123')
      mockPrisma.conversation.create.mockRejectedValueOnce(new Error('Creation failed'))

      const mockRequest = {}

      const response = await createConversation(mockRequest as any)
      const result = await response.json()

      expect(result.error).toBe('Failed to create conversation')
    })
  })

  describe('PATCH /api/conversations/[id]', () => {
    it('should update conversation title', async () => {
      const conversationId = 'conv-123'
      const newTitle = 'Updated Title'

      const mockUpdatedConversation = {
        id: conversationId,
        title: newTitle,
        createdAt: new Date(),
        _count: { messages: 5 },
      }

      mockPrisma.conversation.update.mockResolvedValueOnce(mockUpdatedConversation)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ title: newTitle }),
      }

      const response = await updateConversation(mockRequest as any, { params: { id: conversationId } })
      const result = await response.json()

      expect(result).toEqual(mockUpdatedConversation)
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { title: newTitle },
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: {
            select: { messages: true }
          }
        }
      })
    })

    it('should handle update errors', async () => {
      mockPrisma.conversation.update.mockRejectedValueOnce(new Error('Update failed'))

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ title: 'New Title' }),
      }

      const response = await updateConversation(mockRequest as any, { params: { id: 'conv-123' } })
      const result = await response.json()

      expect(result.error).toBe('Failed to update conversation')
    })
  })

  describe('DELETE /api/conversations/[id]', () => {
    it('should delete conversation successfully', async () => {
      mockPrisma.conversation.delete.mockResolvedValueOnce({} as any)

      const mockRequest = {}

      const response = await deleteConversation(mockRequest as any, { params: { id: 'conv-123' } })
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(mockPrisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: 'conv-123' }
      })
    })

    it('should handle deletion errors', async () => {
      mockPrisma.conversation.delete.mockRejectedValueOnce(new Error('Deletion failed'))

      const mockRequest = {}

      const response = await deleteConversation(mockRequest as any, { params: { id: 'conv-123' } })
      const result = await response.json()

      expect(result.error).toBe('Failed to delete conversation')
    })
  })
})