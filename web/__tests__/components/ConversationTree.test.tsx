import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationTree } from '@/components/conversation-tree';
import '@testing-library/jest-dom';

const mockMessages = [
  {
    id: '1',
    parentMessageId: null,
    conversationId: 'conv-1',
    content: 'Hello',
    role: 'user',
    depth: 0,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    parentMessageId: '1',
    conversationId: 'conv-1',
    content: 'Hi there!',
    role: 'assistant',
    depth: 1,
    createdAt: '2024-01-01T00:00:01Z',
  },
  {
    id: '3',
    parentMessageId: '2',
    conversationId: 'conv-1',
    content: 'How are you?',
    role: 'user',
    depth: 2,
    createdAt: '2024-01-01T00:00:02Z',
  },
];

describe('ConversationTree', () => {
  const mockOnNodeClick = jest.fn();

  beforeEach(() => {
    mockOnNodeClick.mockClear();
  });

  it('renders conversation tree with messages', () => {
    render(
      <ConversationTree
        messages={mockMessages}
        currentMessageId="2"
        onNodeClick={mockOnNodeClick}
      />
    );

    expect(screen.getByText('Conversation Tree')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello...')).toBeInTheDocument();
  });

  it('calls onNodeClick when a message is clicked', () => {
    render(
      <ConversationTree
        messages={mockMessages}
        currentMessageId="2"
        onNodeClick={mockOnNodeClick}
      />
    );

    const messageElement = screen.getByText('Hello...');
    fireEvent.click(messageElement);

    expect(mockOnNodeClick).toHaveBeenCalledWith('1');
  });

  it('shows empty state when no messages', () => {
    render(
      <ConversationTree
        messages={[]}
        onNodeClick={mockOnNodeClick}
      />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('builds tree structure correctly', () => {
    const { container } = render(
      <ConversationTree
        messages={mockMessages}
        onNodeClick={mockOnNodeClick}
      />
    );

    // Check that messages are rendered with proper indentation
    const messageElements = container.querySelectorAll('[style*="padding-left"]');
    expect(messageElements.length).toBeGreaterThan(0);
  });
});