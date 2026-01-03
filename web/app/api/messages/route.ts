import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, parentMessageId, role, content } = await request.json()

    if (!conversationId || !parentMessageId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate parent message exists and belongs to the conversation
    const parentMessage = await prisma.message.findUnique({
      where: { id: parentMessageId },
      select: { conversationId: true, depth: true },
    })

    if (!parentMessage || parentMessage.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Invalid parent message' }, { status: 400 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        id: randomUUID(),
        conversationId,
        parentMessageId,
        role,
        content,
        depth: parentMessage.depth + 1,
      },
    })

    return NextResponse.json({ messageId: message.id })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}