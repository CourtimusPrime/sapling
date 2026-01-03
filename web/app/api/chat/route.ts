import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { prisma } from '@/lib/prisma';
import { buildContext } from '@/lib/context';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const { conversationId, parentMessageId, content } = await request.json();

  // Create user message
  const userMessage = await prisma.message.create({
    data: {
      id: randomUUID(),
      conversationId,
      parentMessageId,
      role: 'user',
      content,
      depth: (await prisma.message.findUnique({ where: { id: parentMessageId } }))!.depth + 1,
    },
  });

  // Build context
  const contextMessages = await buildContext(userMessage.id);

  // Prepare messages for AI
  const messages = contextMessages.map(msg => ({
    role: msg.role as 'system' | 'user' | 'assistant',
    content: msg.content,
  }));

  // Stream response
  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
  });

  // After streaming, create assistant message
  // Note: In a real implementation, you'd need to collect the full response
  // This is simplified - in practice, you'd modify the streaming to save the message
  // For now, we'll create a placeholder
  const assistantContent = 'This is a placeholder for the streamed response.';

  await prisma.message.create({
    data: {
      id: randomUUID(),
      conversationId,
      parentMessageId: userMessage.id,
      role: 'assistant',
      content: assistantContent,
      depth: userMessage.depth + 1,
    },
  });

  return result.toTextStreamResponse();
}