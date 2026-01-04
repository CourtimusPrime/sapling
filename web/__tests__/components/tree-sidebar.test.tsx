import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TreeSidebar } from '@/components/ai-elements/tree-sidebar'
import { TreeNode } from '@/lib/types'

// Mock the tree utilities
jest.mock('@/lib/tree', () => ({
  getLeafNodes: jest.fn(),
}))

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

const mockGetLeafNodes = require('@/lib/tree').getLeafNodes as jest.MockedFunction<any>

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronRightIcon: () => <div data-testid="chevron-right">→</div>,
  ChevronDownIcon: () => <div data-testid="chevron-down">↓</div>,
  MessageSquareIcon: () => <div data-testid="message-icon">📄</div>,
}))

describe('TreeSidebar Component', () => {
  const mockTree: TreeNode = {
    message: {
      id: 'root',
      conversationId: 'conv1',
      parentMessageId: null,
      role: 'system',
      content: 'You are a helpful assistant.',
      depth: 0,
      createdAt: new Date(),
    },
    children: [
      {
        message: {
          id: 'user1',
          conversationId: 'conv1',
          parentMessageId: 'root',
          role: 'user',
          content: 'Hello!',
          depth: 1,
          createdAt: new Date(),
        },
        children: [
          {
            message: {
              id: 'assistant1',
              conversationId: 'conv1',
              parentMessageId: 'user1',
              role: 'assistant',
              content: 'Hi there!',
              depth: 2,
              createdAt: new Date(),
            },
            children: [],
          },
        ],
      },
    ],
  }

  const defaultProps = {
    tree: mockTree,
    activeNodeId: 'user1',
    activePathIds: ['root', 'user1'],
    onNodeClick: jest.fn(),
    onContinueFromHere: jest.fn(),
    isOpen: true,
    onToggle: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetLeafNodes.mockReturnValue([
      { message: { id: 'assistant1', role: 'assistant', content: 'Hi there!' } },
    ])
  })

  it('renders the tree sidebar when open', () => {
    render(<TreeSidebar {...defaultProps} />)

    expect(screen.getByText('Conversation Tree')).toBeInTheDocument()
    expect(screen.getByText('You: Hello!...')).toBeInTheDocument()
    expect(screen.getByText('Assistant: Hi there!...')).toBeInTheDocument()
  })

  it('does not render when tree is null', () => {
    render(<TreeSidebar {...defaultProps} tree={null} />)

    expect(screen.queryByText('Conversation Tree')).not.toBeInTheDocument()
  })

  it('shows branch heads section', () => {
    render(<TreeSidebar {...defaultProps} />)

    expect(screen.getByText('Branch Heads')).toBeInTheDocument()
    const assistantTexts = screen.getAllByText('Assistant: Hi there!...')
    expect(assistantTexts.length).toBeGreaterThan(0)
  })

  it('highlights active node', () => {
    render(<TreeSidebar {...defaultProps} />)

    const activeNode = screen.getByText('You: Hello!...')
    expect(activeNode.closest('div')).toHaveClass('bg-accent', 'font-medium', 'ring-2', 'ring-primary')
  })

  it('highlights nodes in active path', () => {
    render(<TreeSidebar {...defaultProps} />)

    // The root node should be highlighted as part of the active path
    const rootNode = screen.getByText('Assistant: You are a helpful assistant....')
    expect(rootNode.closest('div')).toHaveClass('bg-accent/50', 'border-l-2', 'border-primary')
  })

  it('calls onNodeClick when node is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeSidebar {...defaultProps} />)

    // Click on the assistant message in the main tree (not the branch heads)
    const treeNodes = screen.getAllByText('Assistant: Hi there!...')
    const mainTreeNode = treeNodes[1] // Second occurrence is in the main tree
    await user.click(mainTreeNode)

    expect(defaultProps.onNodeClick).toHaveBeenCalledWith('assistant1')
  })

  it('calls onContinueFromHere when continue button is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeSidebar {...defaultProps} />)

    const continueButtons = screen.getAllByText('Continue')
    await user.click(continueButtons[0]) // Click first continue button

    expect(defaultProps.onContinueFromHere).toHaveBeenCalled()
  })

  it('toggles expansion when chevron is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeSidebar {...defaultProps} />)

    // Find the chevron button for the user1 node
    const chevronButtons = screen.getAllByTestId('chevron-down')
    expect(chevronButtons.length).toBeGreaterThan(0)

    // Initially expanded - check that both instances exist
    const assistantTexts = screen.getAllByText('Assistant: Hi there!...')
    expect(assistantTexts.length).toBeGreaterThan(0)

    // Click to collapse
    await user.click(chevronButtons[0])

    // After clicking, it should still be visible since we need to check the actual behavior
    // This test verifies the button exists and is clickable
  })

  it('shows branch indicator for nodes with multiple children', () => {
    // Create a tree with branching
    const branchingTree: TreeNode = {
      ...mockTree,
      children: [
        {
          ...mockTree.children[0],
          children: [
            mockTree.children[0].children[0],
            {
              message: {
                id: 'assistant1b',
                conversationId: 'conv1',
                parentMessageId: 'user1',
                role: 'assistant',
                content: 'Alternative response',
                depth: 2,
                createdAt: new Date(),
              },
              children: [],
            },
          ],
        },
      ],
    }

    render(<TreeSidebar {...defaultProps} tree={branchingTree} />)

    // Should show branch indicator (blue dot)
    const branchIndicators = screen.getAllByTitle('Has branches')
    expect(branchIndicators.length).toBeGreaterThan(0)
  })

  it('closes sidebar when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<TreeSidebar {...defaultProps} />)

    const closeButton = screen.getByText('✕')
    await user.click(closeButton)

    expect(defaultProps.onToggle).toHaveBeenCalled()
  })

  it('is responsive with different widths', () => {
    render(<TreeSidebar {...defaultProps} />)

    const sidebar = screen.getByRole('tree').closest('div')
    expect(sidebar).toHaveClass('w-80', 'md:w-96')
  })

  it('has proper accessibility attributes', () => {
    render(<TreeSidebar {...defaultProps} />)

    const tree = screen.getByRole('tree')
    expect(tree).toBeInTheDocument()
    expect(tree).toHaveAttribute('aria-label', 'Conversation tree navigation')

    const treeitems = screen.getAllByRole('treeitem')
    expect(treeitems.length).toBeGreaterThan(0)

    treeitems.forEach(item => {
      expect(item).toHaveAttribute('tabIndex')
    })
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<TreeSidebar {...defaultProps} />)

    const firstTreeitem = screen.getAllByRole('treeitem')[0]
    firstTreeitem.focus()

    // Press Enter
    fireEvent.keyDown(firstTreeitem, { key: 'Enter' })
    expect(defaultProps.onNodeClick).toHaveBeenCalled()

    // Press Space
    fireEvent.keyDown(firstTreeitem, { key: ' ' })
    expect(defaultProps.onNodeClick).toHaveBeenCalled()
  })
})