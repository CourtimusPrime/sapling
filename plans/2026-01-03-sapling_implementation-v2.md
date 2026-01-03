# Sapling Implementation Plan

## Objective

Implement the Sapling conversation tree system as specified in BUILD.md, creating a web application where users can have branching conversations with AI, maintaining full context through tree navigation. The system should support message immutability, branching, and context-aware prompt building.

## Implementation Plan

- [x] **Database Design**: Set up PostgreSQL schema with messages table using adjacency list structure (id, parent_message_id, conversation_id, content, role, depth, created_at). Use UUID v7 for time-ordered IDs.
- [x] **Backend API**: Create REST endpoints for CRUD operations on messages and conversations, including tree traversal and context building.
- [x] **Tree Traversal Logic**: Implement functions to walk up the tree from any node to root and build context arrays for LLM prompts.
- [x] **Frontend Tree Visualization**: Build a collapsible sidebar component showing the conversation tree with branch indicators and current path highlighting.
- [x] **Message Management**: Create UI for displaying messages with "Continue from here" actions on each message.
- [x] **Branching Functionality**: Implement logic to create new branches by attaching messages to any existing node without affecting other branches.
- [x] **Context-Aware Prompting**: Integrate with AI SDK to send only the relevant conversation path when continuing from any node.
- [x] **Database Indexes**: Add indexes on parent_message_id, conversation_id, and depth for efficient tree operations.
- [x] **Caching Strategy**: Implement caching for resolved paths and frequently accessed conversation trees.
- [x] **UI State Management**: Manage current conversation position and tree state in the frontend.
- [x] **Testing**: Add comprehensive tests for tree operations, context building, and branching logic.
- [x] **Performance Optimization**: Monitor and optimize recursive queries and tree rendering for large conversation trees.

## Verification Criteria

- Conversation tree displays correctly with proper parent-child relationships
- Users can branch from any message without losing existing branches
- Context building sends only the correct path from selected node to root
- Tree visualization shows collapsible sidebar with branch indicators
- "Continue from here" actions work from any message in the tree
- Database queries handle large trees efficiently
- Message immutability is maintained across all operations

## Potential Risks and Mitigations

1. **Performance Issues with Deep Trees**
   Mitigation: Implement depth limits, pagination for large trees, and optimize recursive CTEs

2. **Complex State Management**
   Mitigation: Use robust state management libraries and thorough testing of tree operations

3. **Database Lock Contention**
   Mitigation: Design schema to minimize locks and use optimistic concurrency where appropriate

4. **UI Complexity**
   Mitigation: Start with simple tree visualization and iteratively add features

## Alternative Approaches

1. **Graph Database**: Use Neo4j instead of PostgreSQL for potentially better tree query performance, but adds complexity and cost
2. **Client-Side Tree Management**: Store tree state entirely in frontend with periodic sync, reducing server load but increasing complexity
3. **Linear Chat with Branch Metadata**: Implement as linear chat with hidden branch data, but violates the "users must see the tree" requirement