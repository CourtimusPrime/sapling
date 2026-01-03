import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        id: randomUUID(), // Use randomUUID for now, can change to v7 later
      },
    })

    // Create root system message
    const rootMessage = await prisma.message.create({
      data: {
        id: randomUUID(),
        conversationId: conversation.id,
        role: 'system',
        content: 'You are a helpful AI assistant. Engage in natural conversation and provide useful responses.',
        depth: 0,
      },
    })

    return NextResponse.json({ conversationId: conversation.id })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}