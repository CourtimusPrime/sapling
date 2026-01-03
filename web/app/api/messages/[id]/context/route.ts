import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// GET /api/messages/[id]/context - Build context from message to root
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;

    // Build context by walking up the tree to root
    const contextMessages: any[] = [];
    let currentId: string | null = messageId;

    while (currentId) {
      const message: any = await prisma.message.findUnique({
        where: { id: currentId }
      });

      if (!message) break;

      contextMessages.unshift(message); // Add to beginning to maintain order
      currentId = message.parentMessageId;
    }

    return NextResponse.json(contextMessages);
  } catch (error) {
    console.error('Error building message context:', error);
    return NextResponse.json(
      { error: 'Failed to build message context' },
      { status: 500 }
    );
  }
}