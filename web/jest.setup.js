import '@testing-library/jest-dom'

// Mock Next.js Request and Response
global.Request = jest.fn()
global.Response = jest.fn().mockImplementation((body, options) => ({
  json: () => Promise.resolve(body),
  status: options?.status || 200,
}))