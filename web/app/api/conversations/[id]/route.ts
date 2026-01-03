import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/conversations/[id] - Get conversation with tree structure
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // Use a recursive CTE to build the tree structure
    const messages = await prisma.$queryRaw`
      WITH RECURSIVE message_tree AS (
        SELECT
          id,
          parent_message_id,
          conversation_id,
          content,
          role,
          depth,
          created_at,
          ARRAY[id] as path
        FROM messages
        WHERE conversation_id = ${conversationId} AND parent_message_id IS NULL

        UNION ALL

        SELECT
          m.id,
          m.parent_message_id,
          m.conversation_id,
          m.content,
          m.role,
          m.depth,
          m.created_at,
          mt.path || m.id
        FROM messages m
        INNER JOIN message_tree mt ON m.parent_message_id = mt.id
      )
      SELECT * FROM message_tree
      ORDER BY path, created_at;
    `;

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching conversation tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation tree' },
      { status: 500 }
    );
  }
}