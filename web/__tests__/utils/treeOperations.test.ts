// Test utilities for tree operations
describe('Tree Operations', () => {
  const mockMessages = [
    {
      id: '1',
      parentMessageId: null,
      conversationId: 'conv-1',
      content: 'Root message',
      role: 'user',
      depth: 0,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      parentMessageId: '1',
      conversationId: 'conv-1',
      content: 'First reply',
      role: 'assistant',
      depth: 1,
      createdAt: '2024-01-01T00:00:01Z',
    },
    {
      id: '3',
      parentMessageId: '2',
      conversationId: 'conv-1',
      content: 'Branch from reply',
      role: 'user',
      depth: 2,
      createdAt: '2024-01-01T00:00:02Z',
    },
    {
      id: '4',
      parentMessageId: '1',
      conversationId: 'conv-1',
      content: 'Another branch',
      role: 'user',
      depth: 1,
      createdAt: '2024-01-01T00:00:03Z',
    },
  ];

  describe('Path Building', () => {
    it('builds correct path from leaf to root', () => {
      // Simulate the path building logic from ChatPage
      const buildPath = (messages: typeof mockMessages, currentId: string | null): typeof mockMessages => {
        if (!currentId) return [];

        const messagesMap = new Map(messages.map(msg => [msg.id, msg]));
        const path: typeof mockMessages = [];
        let current = messagesMap.get(currentId);

        while (current) {
          path.unshift(current);
          if (current.parentMessageId) {
            current = messagesMap.get(current.parentMessageId) || undefined;
          } else {
            break;
          }
        }

        return path;
      };

      const pathFrom3 = buildPath(mockMessages, '3');
      expect(pathFrom3).toHaveLength(3);
      expect(pathFrom3[0].id).toBe('1');
      expect(pathFrom3[1].id).toBe('2');
      expect(pathFrom3[2].id).toBe('3');

      const pathFrom4 = buildPath(mockMessages, '4');
      expect(pathFrom4).toHaveLength(2);
      expect(pathFrom4[0].id).toBe('1');
      expect(pathFrom4[1].id).toBe('4');
    });

    it('returns empty path for null currentId', () => {
      const buildPath = (messages: typeof mockMessages, currentId: string | null): typeof mockMessages => {
        if (!currentId) return [];

        const messagesMap = new Map(messages.map(msg => [msg.id, msg]));
        const path: typeof mockMessages = [];
        let current = messagesMap.get(currentId);

        while (current) {
          path.unshift(current);
          if (current.parentMessageId) {
            current = messagesMap.get(current.parentMessageId) || undefined;
          } else {
            break;
          }
        }

        return path;
      };

      const path = buildPath(mockMessages, null);
      expect(path).toHaveLength(0);
    });
  });

  describe('Tree Structure', () => {
    it('maintains message immutability', () => {
      // Messages should not be modified when building trees
      const originalMessages = JSON.parse(JSON.stringify(mockMessages));
      const messagesMap = new Map(mockMessages.map(msg => [msg.id, msg]));

      // Simulate some operations
      const path = [];
      let current = messagesMap.get('3');
      while (current) {
        path.unshift(current);
        current = current.parentMessageId ? messagesMap.get(current.parentMessageId) || undefined : undefined;
      }

      expect(mockMessages).toEqual(originalMessages);
    });

    it('handles branching correctly', () => {
      // Both message 3 and 4 branch from message 1
      const rootMessage = mockMessages.find(msg => msg.id === '1');
      const branches = mockMessages.filter(msg => msg.parentMessageId === '1');

      expect(branches).toHaveLength(2);
      expect(branches.map(b => b.id)).toEqual(['2', '4']);
    });
  });
});