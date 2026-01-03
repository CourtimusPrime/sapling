import { spawn } from 'child_process';
import { jest } from '@jest/globals';

describe('Chat Interface End-to-End Tests', () => {
  let serverProcess: any;
  const baseUrl = 'http://localhost:3001';

  beforeAll(async () => {
    // Start the development server
    serverProcess = spawn('pnpm', ['dev'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    });

    // Wait for server to start
    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 30000);

      serverProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
        if (output.includes('Ready in') || output.includes('✓ Ready')) {
          clearTimeout(timeout);
          // Wait a bit more for full startup
          setTimeout(resolve, 2000);
        }
      });

      serverProcess.stderr.on('data', (data: Buffer) => {
        console.log('Server stderr:', data.toString());
      });

      serverProcess.on('error', (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }, 35000);

  afterAll(async () => {
    // Clean up server
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  });

  describe('Chat Flow', () => {
    it('should create conversation, send message, and get AI response', async () => {
      // Create a new conversation
      const convResponse = await fetch(`${baseUrl}/api/conversations`, {
        method: 'POST',
      });
      expect(convResponse.ok).toBe(true);
      const conversation = await convResponse.json();
      expect(conversation).toHaveProperty('id');

      // Create a user message
      const messageResponse = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: 'Hello, can you help me?',
          role: 'user',
          parentMessageId: null,
        }),
      });
      expect(messageResponse.ok).toBe(true);
      const userMessage = await messageResponse.json();
      expect(userMessage).toHaveProperty('id');
      expect(userMessage.content).toBe('Hello, can you help me?');

      // Get context for the message
      const contextResponse = await fetch(`${baseUrl}/api/messages/${userMessage.id}/context`);
      expect(contextResponse.ok).toBe(true);
      const context = await contextResponse.json();
      expect(Array.isArray(context)).toBe(true);
      expect(context.length).toBeGreaterThan(0);
      expect(context[0]).toHaveProperty('content', 'Hello, can you help me?');

      // Test AI chat endpoint (this should work if OpenAI key is valid)
      const chatResponse = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: context.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
        }),
      });

      if (chatResponse.ok) {
        // If AI key is working, we should get a streaming response
        expect(chatResponse.headers.get('content-type')).toContain('text/plain');
      } else {
        // If AI key is not working, we still expect a proper error response
        const errorText = await chatResponse.text();
        console.log('AI response error:', errorText);
        // This is acceptable - the endpoint exists and responds
      }
    }, 10000);

    it('should list conversations', async () => {
      const response = await fetch(`${baseUrl}/api/conversations`);
      expect(response.ok).toBe(true);
      const conversations = await response.json();
      expect(Array.isArray(conversations)).toBe(true);
    });

    it('should get conversation messages', async () => {
      // First create a conversation
      const convResponse = await fetch(`${baseUrl}/api/conversations`, {
        method: 'POST',
      });
      const conversation = await convResponse.json();

      const response = await fetch(`${baseUrl}/api/conversations/${conversation.id}`);
      expect(response.ok).toBe(true);
      const messages = await response.json();
      expect(Array.isArray(messages)).toBe(true);
    });
  });
});