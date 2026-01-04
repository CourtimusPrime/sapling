import { Message, Conversation } from './generated/prisma'

export type { Message, Conversation }

export interface TreeNode {
  message: Message
  children: TreeNode[]
  parent?: TreeNode
}

export interface ConversationTree {
  conversation: Conversation
  root: TreeNode
  activeNode: TreeNode
}

export interface FlatMessage extends Message {
  // Additional fields if needed
}

export type ActivePath = Message[]