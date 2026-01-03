import { jest } from '@jest/globals';

// Mock the AI SDK
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => 'mock-model'),
}));

jest.mock('ai', () => ({
  streamText: jest.fn(() => ({
    toTextStreamResponse: jest.fn(() => new Response('Mock AI response')),
  })),
}));

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    message: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
    },
  },
}));

import { POST as chatHandler } from '../../app/api/chat/route';
import { POST as messageHandler } from '../../app/api/messages/route';
import { GET as contextHandler } from '../../app/api/messages/[id]/context/route';
import { POST as conversationHandler } from '../../app/api/conversations/route';

describe('Chat API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Chat API (/api/chat)', () => {
    it('should handle chat requests with proper streaming response', async () => {
      const mockMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: mockMessages }),
      });

      const response = await chatHandler(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('Message Creation (/api/messages)', () => {
    it('should create a new message', async () => {
      const mockPrisma = require('../../../../lib/prisma').prisma;

      mockPrisma.message.create.mockResolvedValue({
        id: 'msg-123',
        conversationId: 'conv-123',
        content: 'Test message',
        role: 'user',
        parentMessageId: null,
        depth: 0,
        createdAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'conv-123',
          content: 'Test message',
          role: 'user',
          parentMessageId: null,
        }),
      });

      const response = await messageHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id', 'msg-123');
      expect(data).toHaveProperty('content', 'Test message');
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-123',
          content: 'Test message',
          role: 'user',
          parentMessageId: null,
          depth: 0,
        },
      });
    });
  });

  describe('Message Context (/api/messages/[id]/context)', () => {
    it('should build message context chain', async () => {
      const mockPrisma = require('../../../../lib/prisma').prisma;

      // Mock the message chain
      mockPrisma.message.findUnique
        .mockResolvedValueOnce({
          id: 'msg-3',
          parentMessageId: 'msg-2',
          content: 'Third message',
          role: 'user',
        })
        .mockResolvedValueOnce({
          id: 'msg-2',
          parentMessageId: 'msg-1',
          content: 'Second message',
          role: 'assistant',
        })
        .mockResolvedValueOnce({
          id: 'msg-1',
          parentMessageId: null,
          content: 'First message',
          role: 'user',
        })
        .mockResolvedValueOnce(null); // End of chain

      const params = { id: 'msg-3' };
      const request = new Request(`http://localhost:3000/api/messages/${params.id}/context`);
      const response = await contextHandler(request, { params: Promise.resolve(params) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
      expect(data[0]).toHaveProperty('content', 'First message');
      expect(data[1]).toHaveProperty('content', 'Second message');
      expect(data[2]).toHaveProperty('content', 'Third message');
    });
  });

  describe('Conversation Creation (/api/conversations)', () => {
    it('should create a new conversation', async () => {
      const mockPrisma = require('../../../../lib/prisma').prisma;

      mockPrisma.conversation.create.mockResolvedValue({
        id: 'conv-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request('http://localhost:3000/api/conversations', {
        method: 'POST',
      });

      const response = await conversationHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id', 'conv-123');
      expect(mockPrisma.conversation.create).toHaveBeenCalled();
    });
  });
});