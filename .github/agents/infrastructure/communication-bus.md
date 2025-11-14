# Agent Communication Bus

**Version:** 1.0  
**Created:** 2025-11-14  
**Status:** Specification

## Overview

The Agent Communication Bus provides a centralized message passing system for inter-agent coordination. It enables agents to discover, communicate with, and coordinate work with other agents in real-time.

## Architecture

### Message Format

Based on `.github/agents/protocols/agent-messaging.protocol.yaml`, all messages follow this structure:

```yaml
message:
  id: "uuid"
  from: "agent-name"
  to: "agent-name" | "broadcast"
  type: "REQUEST" | "RESPONSE" | "STATUS" | "ERROR" | "HANDOFF" | "QUERY"
  timestamp: "ISO8601"
  payload: {object}
  correlationId: "parent-message-id"  # for responses
```

### Message Types

1. **REQUEST**: Ask for information or action
2. **RESPONSE**: Provide requested information
3. **STATUS**: Progress updates
4. **ERROR**: Report failures
5. **HANDOFF**: Pass control to next agent
6. **QUERY**: Ask for clarification

## Implementation

### Storage

Messages are stored in `reports/agent-bus/messages/{date}/{message-id}.yaml`

### Message Bus API

```javascript
// Send message
AgentBus.send({
  from: "constructor",
  to: "insect-enthusiast",
  type: "REQUEST",
  payload: {action: "fix-test-failure", testId: "test-123"}
})

// Subscribe to messages
AgentBus.subscribe("constructor", (message) => {
  // Handle incoming messages
})

// Query message history
AgentBus.getHistory({
  agent: "constructor",
  since: "2025-11-14T00:00:00Z"
})

// Broadcast status
AgentBus.broadcast({
  type: "STATUS",
  payload: {phase: "testing", progress: 75}
})
```

## Benefits

1. **Visibility**: All agent activity is logged and traceable
2. **Coordination**: Agents avoid conflicting work
3. **Dependency Management**: Automatic dependency checking
4. **Error Handling**: Early detection and escalation
5. **Audit Trail**: Complete history of agent interactions

---

**Status:** Specification complete - Ready for implementation
