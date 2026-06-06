---
name: experience-distiller
description: Distill repeated Codex work experience into durable memory assets. Use when a task produces reusable lessons, recurring preferences, repeated workflows, project state, failure cases, permission boundaries, validation logic, or when the user asks Codex to evolve, improve itself, summarize lessons, update AGENTS.md, create a skill, maintain a vault, add evals, write rules, or add hooks.
---

# Experience Distiller

## Purpose

Turn useful experience from a task into the right durable asset. Treat this skill as a router and promotion workflow, not as a single memory bucket.

Use the smallest durable form that will improve future runs without polluting context.

## Memory Routing

Classify each lesson before writing anything:

| Experience | Target | Use when |
| --- | --- | --- |
| Stable user preference, collaboration style, output taste | `AGENTS.md` | The preference is likely to apply across many future tasks. |
| Repeated procedure, workflow, checklist, tool pattern | `Skill` | Codex should execute the same process again in a recognizable situation. |
| Current project facts, decisions, status, environment notes | `vault` or project log | The information is useful for this project but not universal. |
| Failure case, regression, bad output, missed requirement | `eval` | Future agents should be tested against the mistake. |
| Permission, security, safety, irreversible operation boundary | `.rules` or policy file | The rule is a hard constraint, not a preference. |
| Deterministic check, formatting gate, validation command | `hooks`, CI, or scripts | A machine can check it more reliably than a reminder can. |

If one lesson fits multiple targets, split it. Example: a failed deployment can produce a project-state note, an eval, and a hook.

## Workflow

1. Gather evidence from the completed task: user request, files changed, commands run, failures, repeated decisions, and final verification.
2. Extract only lessons that are likely to matter again. Ignore one-off narration, temporary paths, and obvious facts Codex already knows.
3. Route each lesson with the memory routing table.
4. Decide the update mode:
   - **Apply directly** when the user explicitly asked for updates, the target file is clear, and the change is low risk.
   - **Propose first** when touching global instructions, rules, hooks, eval suites, security boundaries, or unfamiliar repository conventions.
5. Keep each memory concise, actionable, and easy to delete later.
6. Verify any created or edited skill with the skill validation workflow when available.

## Promotion Rules

Use these thresholds unless the user or repository gives stricter rules:

- Promote a user preference to `AGENTS.md` after it appears 2-3 times or the user states it as a standing preference.
- Promote a workflow to a skill after it is repeated twice, is easy to trigger by scenario, and contains non-obvious steps.
- Promote a failure to an eval immediately when the cost was high, the mistake is likely to recur, or the expected behavior is easy to assert.
- Promote a boundary to `.rules` immediately when it protects secrets, user data, credentials, destructive operations, or external systems.
- Promote a reminder to a hook when it can be checked deterministically by a command.

## Writing Guidelines

Write memory as instructions, not diary entries.

Prefer:

```text
When finishing frontend work, open the local app in the browser and verify desktop and mobile screenshots before final response.
```

Avoid:

```text
Today we learned that screenshots are useful.
```

Keep entries:

- Short enough to scan.
- Specific enough to act on.
- Scoped to the right level: global, repo, project, or task.
- Free of secrets, tokens, cookies, private URLs, and unnecessary personal data.
- Dated only when the fact is time-sensitive or project-state related.

## Skill Creation Guidance

Create or update a skill when the lesson is procedural.

A good skill candidate has:

- A clear trigger phrase or scenario.
- A repeatable workflow.
- Domain-specific judgment that is not obvious from the current prompt.
- Optional scripts, references, or templates that reduce future work.
- A validation step.

Do not create a skill for a single preference, a one-time project fact, or a rule that belongs in policy.

## Output Format

When distilling experience, produce this compact report:

```markdown
**Experience Distillation**
- `AGENTS.md`: ...
- `Skill`: ...
- `vault`: ...
- `eval`: ...
- `.rules`: ...
- `hooks`: ...

**Recommended Changes**
- Apply now: ...
- Propose first: ...
- Skip: ...

**Patch Plan**
- File: ...
- Change: ...
- Reason: ...
```

If no durable lesson is worth saving, say so and do not create memory clutter.
