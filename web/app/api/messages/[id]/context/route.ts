import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/messages/[id]/context - Build context from message to root
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;

    // Build context by walking up the tree to root and reversing
    const contextMessages = await prisma.$queryRaw`
      WITH RECURSIVE message_path AS (
        SELECT
          id,
          parent_message_id,
          conversation_id,
          content,
          role,
          created_at
        FROM messages
        WHERE id = ${messageId}

        UNION ALL

        SELECT
          m.id,
          m.parent_message_id,
          m.conversation_id,
          m.content,
          m.role,
          m.created_at
        FROM messages m
        INNER JOIN message_path mp ON m.id = mp.parent_message_id
      )
      SELECT * FROM message_path
      ORDER BY created_at ASC;
    `;

    return NextResponse.json(contextMessages);
  } catch (error) {
    console.error('Error building message context:', error);
    return NextResponse.json(
      { error: 'Failed to build message context' },
      { status: 500 }
    );
  }
}