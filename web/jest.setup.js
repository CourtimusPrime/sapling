import '@testing-library/jest-dom'

// Mock Next.js Request and Response
global.Request = jest.fn()
global.Response = jest.fn().mockImplementation((body, options) => ({
  json: () => Promise.resolve(body),
  status: options?.status || 200,
}))

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    conversation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}))