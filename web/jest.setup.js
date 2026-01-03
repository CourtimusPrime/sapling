import '@testing-library/jest-dom'

// Polyfill for TextEncoder
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder