#!/usr/bin/env node

/**
 * Chat Interface Test Script
 * Tests the complete chat flow: conversation creation, message sending, context building, and AI response
 */

const baseUrl = 'http://localhost:3001';

async function testChatInterface() {
  console.log('🧪 Testing Sapling Chat Interface...\n');

  try {
    // Test 1: Create conversation
    console.log('1. Creating new conversation...');
    const convResponse = await fetch(`${baseUrl}/api/conversations`, {
      method: 'POST',
    });

    if (!convResponse.ok) {
      throw new Error(`Failed to create conversation: ${convResponse.status}`);
    }

    const conversation = await convResponse.json();
    console.log('✅ Conversation created:', conversation.id);

    // Test 2: Send user message
    console.log('\n2. Sending user message...');
    const messageResponse = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversation.id,
        content: 'Hello! Can you tell me a joke?',
        role: 'user',
        parentMessageId: null,
      }),
    });

    if (!messageResponse.ok) {
      throw new Error(`Failed to create message: ${messageResponse.status}`);
    }

    const userMessage = await messageResponse.json();
    console.log('✅ User message created:', userMessage.id);

    // Test 3: Get message context
    console.log('\n3. Building message context...');
    const contextResponse = await fetch(`${baseUrl}/api/messages/${userMessage.id}/context`);

    if (!contextResponse.ok) {
      throw new Error(`Failed to get context: ${contextResponse.status}`);
    }

    const context = await contextResponse.json();
    console.log('✅ Context retrieved:', context.length, 'messages');

    // Test 4: Send to AI
    console.log('\n4. Sending to AI for response...');
    const chatResponse = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: context.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
      }),
    });

    if (chatResponse.ok) {
      console.log('✅ AI response initiated successfully');
      console.log('Response headers:', Object.fromEntries(chatResponse.headers.entries()));

      // Try to read a bit of the response
      const reader = chatResponse.body?.getReader();
      if (reader) {
        const { value, done } = await reader.read();
        if (!done && value) {
          const chunk = new TextDecoder().decode(value.slice(0, 100));
          console.log('Sample AI response:', chunk + (value.length > 100 ? '...' : ''));
        }
        reader.releaseLock();
      }
    } else {
      const errorText = await chatResponse.text();
      console.log('❌ AI response failed:', chatResponse.status, errorText);
      // This might be expected if OpenAI key is not configured
      console.log('ℹ️  This could be normal if OPENAI_API_KEY is not set or invalid');
    }

    // Test 5: List conversations
    console.log('\n5. Testing conversation listing...');
    const listResponse = await fetch(`${baseUrl}/api/conversations`);
    if (listResponse.ok) {
      const conversations = await listResponse.json();
      console.log('✅ Conversations listed:', conversations.length, 'conversations');
    } else {
      throw new Error(`Failed to list conversations: ${listResponse.status}`);
    }

    // Test 6: Get conversation messages
    console.log('\n6. Testing conversation message retrieval...');
    const convMessagesResponse = await fetch(`${baseUrl}/api/conversations/${conversation.id}`);
    if (convMessagesResponse.ok) {
      const messages = await convMessagesResponse.json();
      console.log('✅ Conversation messages retrieved:', messages.length, 'messages');
    } else {
      throw new Error(`Failed to get conversation messages: ${convMessagesResponse.status}`);
    }

    console.log('\n🎉 All basic functionality tests passed!');
    console.log('✅ Conversation creation');
    console.log('✅ Message creation');
    console.log('✅ Context building');
    console.log('✅ Conversation listing');
    console.log('✅ Message retrieval');

    if (chatResponse.ok) {
      console.log('✅ AI chat endpoint');
    } else {
      console.log('⚠️  AI chat endpoint responded but may need valid OpenAI key');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${baseUrl}/api/conversations`, { method: 'HEAD' });
    return response.status < 500; // Any response means server is running
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if development server is running...');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Development server is not running on', baseUrl);
    console.log('Please start it with: cd web && pnpm dev');
    process.exit(1);
  }

  console.log('✅ Development server is running\n');

  await testChatInterface();
}

main().catch(console.error);