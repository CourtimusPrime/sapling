import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/conversations/[id] - Get conversation with tree structure
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // Get all messages for the conversation, ordered by creation time
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching conversation tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation tree' },
      { status: 500 }
    );
  }
}