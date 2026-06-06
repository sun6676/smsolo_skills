---
name: parallel-code-review-agents
description: Coordinate five focused code-review subagents for deep parallel review across security, code quality, bug hunting, concurrency/performance, and architecture. Use when the user asks for multi-agent review, subagent review, architect-level code review, parallel code review, or wants independent review dimensions with concrete fixes and a final overall assessment.
---

# Parallel Code Review Agents

## Overview

Run an independent, dimension-specific code review using five named review agents. Prefer real subagents when multi-agent tools are available; otherwise perform five clearly separated review passes in the main agent.

## Workflow

1. Identify the review target: changed files, selected paths, a pull request, a diff, or the whole repository if the user asks broadly.
2. Gather only the context needed for review: relevant source files, tests, configuration, framework conventions, and any user-provided requirements.
3. If subagent tools are available, launch five independent subagents in parallel. If no subagent tools are available, simulate the same five roles as separate passes without claiming separate agents were spawned.
4. Require each agent/pass to return concrete findings with file paths, line numbers when possible, severity, impact, and actionable fixes.
5. Merge duplicate findings, resolve disagreements, and write a final overall assessment from the main agent.

## Review Agents

Use these five review dimensions in this order:

1. Security Agent: authentication, authorization, injection, secrets, unsafe deserialization, dependency risk, transport/storage exposure, and data leakage.
2. Quality Agent: readability, maintainability, typing, naming, modularity, local conventions, testability, and unnecessary complexity.
3. Bug Hunter Agent: logic errors, edge cases, incorrect state transitions, race-prone assumptions, null/undefined handling, boundary conditions, and failing user flows.
4. Concurrency and Performance Agent: async correctness, locking, shared mutable state, resource leaks, query efficiency, rendering cost, memory pressure, and scalability bottlenecks.
5. Architecture Agent: module boundaries, coupling, cohesion, API contracts, data flow, layering, migration risk, and whether the design fits the product/system constraints.

## Subagent Prompt Template

When spawning a subagent, give it the target files/diff and one role only:

```text
You are the {ROLE}. Review the provided code only from your dimension.
Return findings ordered by severity. For each finding include:
- severity
- file and line, if available
- problem
- why it matters
- concrete fix or code-level recommendation
If no meaningful issue is found, reply: "该维度未发现明显异常".
```

## Output Format

Write the final answer in Chinese unless the user asked otherwise.

Use this structure:

```text
1. Security Agent
<findings or 该维度未发现明显异常>

2. Quality Agent
<findings or 该维度未发现明显异常>

3. Bug Hunter Agent
<findings or 该维度未发现明显异常>

4. Concurrency & Perf Agent
<findings or 该维度未发现明显异常>

5. Architecture Agent
<findings or 该维度未发现明显异常>

Overall Assessment
<main-agent synthesis, highest risks, recommended next steps>
```

## Review Standards

- Lead with findings, ordered by severity.
- Avoid vague advice. Every issue must include a concrete fix or modification direction.
- Do not invent line numbers or files. If line numbers are unavailable, cite the closest function/component/module.
- Distinguish confirmed issues from hypotheses.
- If the review target is too large, review the highest-risk entry points first and state the coverage limits.
- If tests are missing for risky behavior, include the specific missing test case.
