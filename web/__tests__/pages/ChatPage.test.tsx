import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPage from '@/app/page';
import '@testing-library/jest-dom';

// Mock the components
jest.mock('@/components/ai-elements/conversation', () => ({
  Conversation: ({ children }: { children: React.ReactNode }) => <div data-testid="conversation">{children}</div>,
  ConversationContent: ({ children }: { children: React.ReactNode }) => <div data-testid="conversation-content">{children}</div>,
  ConversationEmptyState: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
  ConversationScrollButton: () => <button data-testid="scroll-button">Scroll</button>,
}));

jest.mock('@/components/ai-elements/message', () => ({
  Message: ({ children, from }: { children: React.ReactNode; from: string }) => (
    <div data-testid={`message-${from}`}>{children}</div>
  ),
  MessageContent: ({ children }: { children: React.ReactNode }) => <div data-testid="message-content">{children}</div>,
  MessageResponse: ({ children }: { children: React.ReactNode }) => <div data-testid="message-response">{children}</div>,
}));

jest.mock('@/components/ai-elements/prompt-input', () => ({
  PromptInput: ({ children, onSubmit }: { children: React.ReactNode; onSubmit: (data: any) => void }) => (
    <form data-testid="prompt-input" onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ text: 'test message', files: [] });
    }}>
      {children}
    </form>
  ),
  PromptInputBody: ({ children }: { children: React.ReactNode }) => <div data-testid="prompt-input-body">{children}</div>,
  PromptInputTextarea: ({ placeholder }: { placeholder: string }) => (
    <textarea data-testid="prompt-textarea" placeholder={placeholder} />
  ),
  PromptInputSubmit: ({ status }: { status?: string }) => (
    <button data-testid="prompt-submit" data-status={status}>Submit</button>
  ),
}));

jest.mock('@/components/conversation-tree', () => ({
  ConversationTree: ({ messages, currentMessageId, onNodeClick }: any) => (
    <div data-testid="conversation-tree">
      {messages.map((msg: any, index: number) => (
        <div key={msg.id || index} onClick={() => onNodeClick(msg.id)} data-testid={`tree-node-${msg.id}`}>
          {msg.content}
        </div>
      ))}
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  it('renders the chat page with empty state', async () => {
    render(<ChatPage />);

    await waitFor(() => {
      expect(screen.getByText('Sapling Chat')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('loads conversations on mount', async () => {
    const mockConversations = [
      { id: '1', createdAt: '2024-01-01', updatedAt: '2024-01-01' }
    ];

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockConversations),
      })
    );

    render(<ChatPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations');
    });
  });

  it('creates new conversation when button is clicked', async () => {
    const user = userEvent.setup();
    const mockNewConversation = { id: 'new-conv', createdAt: '2024-01-01', updatedAt: '2024-01-01' };

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockNewConversation) }));

    render(<ChatPage />);

    await waitFor(() => {
      expect(screen.getByText('New Conversation')).toBeInTheDocument();
    });

    const newConvButton = screen.getByText('New Conversation');
    await user.click(newConvButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/conversations', { method: 'POST' });
  });

  it('handles message submission', async () => {
    const user = userEvent.setup();
    const mockConversation = { id: 'conv-1', createdAt: '2024-01-01', updatedAt: '2024-01-01', messages: [] };
    const mockUserMessage = { id: 'msg-1', conversationId: 'conv-1', content: 'test message', role: 'user', parentMessageId: null, depth: 0, createdAt: '2024-01-01' };
    const mockAIMessage = { id: 'msg-2', conversationId: 'conv-1', content: 'AI response', role: 'assistant', parentMessageId: 'msg-1', depth: 1, createdAt: '2024-01-01' };

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([mockConversation]) }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockConversation.messages) }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockUserMessage) }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([mockUserMessage]) })) // context API
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAIMessage),
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: new Uint8Array() }),
          }),
        },
      }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockAIMessage) }));

    render(<ChatPage />);

    await waitFor(() => {
      expect(screen.getByTestId('prompt-input')).toBeInTheDocument();
    });

    const form = screen.getByTestId('prompt-input');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/messages', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('test message'),
      }));
    });
  });
});