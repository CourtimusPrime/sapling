# Implement Sapling Conversation Tree

## Objective

To implement the Sapling conversation tree system as specified in BUILD.md, creating a web application where messages form an immutable tree structure allowing branching, rewinding, and independent continuation without losing context. This includes backend storage with Postgres adjacency list, frontend tree visualization, and proper context building for LLM prompts.

## Implementation Plan

- [ ] Set up PostgreSQL database with message table schema (id UUID v7, parent_message_id, conversation_id, depth, content, timestamps)
- [ ] Create database indexes on parent_message_id, conversation_id, and depth for efficient tree traversal
- [ ] Implement backend API endpoints for message CRUD operations (create, read by conversation, get tree path)
- [ ] Develop context building function that walks up the tree from current message to root and reverses the list
- [ ] Replace in-memory chat state with database-backed message persistence in API routes
- [ ] Create custom tree view sidebar component with collapsible nodes, branch indicators, and current path highlighting
- [ ] Implement "Continue from here" action on every message to attach new branches to specific nodes
- [ ] Add branch picker UI for navigating between parallel timelines and reverting current position
- [ ] Ensure message immutability - prevent editing of existing messages, only allow branching
- [ ] Integrate tree traversal logic with LLM prompt generation to send only the current path context
- [ ] Implement performance optimizations: cache resolved paths, consider materialized paths for deep trees
- [ ] Add conversation management features: create new conversations, list existing trees
- [ ] Update error handling for tree operations (invalid branches, missing parents, etc.)
- [ ] Add data validation for tree integrity (no cycles, valid parent relationships)

## Verification Criteria

- Messages can be created and stored in a tree structure with proper parent-child relationships
- Tree view sidebar displays collapsible conversation trees with branch indicators
- "Continue from here" actions successfully create new branches from any message
- Context building correctly traverses from current node to root and generates deterministic prompts
- Branch navigation allows switching between parallel timelines without losing history
- Performance benchmarks show efficient tree traversal for conversations with 100+ messages
- Database schema supports all required queries and maintains referential integrity

## Potential Risks and Mitigations

1. **Database Performance with Deep Trees**: Risk of slow recursive queries on large conversation trees. Mitigation: Implement depth limits, add database indexes, and use caching for frequently accessed paths.
2. **UI Complexity with Tree Visualization**: Risk of confusing user experience with complex branching. Mitigation: Follow UX guidelines from BUILD.md, conduct user testing, and provide clear visual indicators for current path.
3. **Context Building Errors**: Risk of incorrect prompt generation leading to lost context. Mitigation: Thoroughly test the context building algorithm with various tree structures and edge cases.
4. **Data Integrity Issues**: Risk of orphaned messages or invalid tree structures. Mitigation: Add database constraints and validation logic to ensure tree integrity.
5. **Frontend-Backend Synchronization**: Risk of state inconsistencies between client and server. Mitigation: Use real-time updates and optimistic UI patterns, implement conflict resolution for concurrent edits.

## Alternative Approaches

1. **Graph Database Instead of Relational**: Use Neo4j or similar for native graph traversal instead of Postgres adjacency list. Trade-off: Better performance for complex queries but increased complexity and cost.
2. **Client-Side Tree Management**: Keep tree logic in frontend with periodic sync to server. Trade-off: Faster UI responsiveness but higher risk of data loss and conflicts.
3. **Pre-computed Context Paths**: Store complete context paths in database rather than computing on-demand. Trade-off: Faster queries but increased storage and complexity maintaining consistency.</content>
<parameter name="plan_name">sapling_implementation