import assert from 'node:assert'
import test from 'node:test'
import { parseMermaidFlowchart } from './parser.ts'

test('parses a Mermaid flowchart fenced in Markdown', () => {
  const result = parseMermaidFlowchart(`
# Payment cancellation journey

This document describes the expected journey.

\`\`\`mermaid
flowchart TD
  classDef decision fill:#fef9c3
  Start([Start]) --> Question{Has payment been made?}
  Question -->|Yes| Escalate([Escalate])
  class Question decision
\`\`\`
`)

  assert.equal(result.error, null)
  assert.equal(result.nodes.length, 3)
  assert.equal(result.edges.length, 2)
  assert.deepEqual(result.nodes.map((node) => node.id).sort(), ['Escalate', 'Question', 'Start'])
})