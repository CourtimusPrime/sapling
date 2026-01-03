import { prisma } from './prisma'
import { Message } from './generated/prisma'

export async function buildContext(messageId: string): Promise<Message[]> {
  const messages: Message[] = []
  let currentId: string | null = messageId

  while (currentId) {
    const message = await prisma.message.findUnique({
      where: { id: currentId },
    })

    if (!message) break

    messages.push(message)
    currentId = message.parentMessageId
  }

  return messages.reverse()
}