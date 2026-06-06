---
name: ai-development-standards
description: AI-assisted development standards for Codex or other coding agents. Use when creating or updating project development rules, AGENTS.md, coding guidelines, AI collaboration workflows, repository contribution standards, or when a coding task needs strict communication, security, TDD, validation, and commit discipline.
---

# AI Development Standards

## Core Rule

Apply these standards before and during AI-assisted development. Treat them as operating constraints, not optional style advice. If they conflict with a repository's existing instructions, follow the stricter rule unless the user explicitly overrides it.

## Dual-Channel Communication

Use Chinese for intent and collaboration:

- Discuss requirements, tradeoffs, decisions, product preferences, project priorities, and user-facing summaries in Chinese.
- Keep confirmations short and avoid repeated questions when a reasonable assumption is safe.
- State assumptions clearly before implementation when they affect behavior or scope.

Use English for technical retrieval and diagnosis:

- Preserve exact English error messages, stack traces, package names, API names, identifiers, and search keywords.
- Search technical issues with English keywords first, especially API errors, framework bugs, compiler messages, and dependency problems.
- Separate communication cost from troubleshooting cost: explain the idea in Chinese, investigate technical facts with precise English terms.

## Safety Red Lines

Never hardcode secrets:

- Do not place passwords, tokens, API keys, private keys, cookies, or personal credentials in source code, examples, tests, logs, or generated docs.
- Route secrets through environment variables, secret managers, local ignored config, or explicit secure configuration channels.
- If a secret appears in chat, code, logs, or git diff, treat it as leaked and recommend rotation.

Keep environment files out of commits:

- Ensure `.env`, `.env.*`, local config, generated credentials, and machine-specific state files are ignored unless the repository intentionally tracks a safe template such as `.env.example`.
- Store only placeholder variable names in examples.
- Before committing, inspect `git status`, staged files, and relevant diffs for accidental secret or config inclusion.

Avoid unsafe side effects:

- Do not delete data, rewrite history, reset user work, or modify unrelated files without explicit need and user consent.
- Do not hide, truncate, or paraphrase critical failure details while debugging. Redact secrets, but expose the full actionable error.

## TDD Feedback Loop

Prefer test-first development when behavior is being added or changed:

1. Define the verification target: acceptance criteria, expected output, failing test, reproduction command, or concrete manual check.
2. Add or update the smallest meaningful test before implementation when the codebase supports it.
3. Implement around the verification target rather than around a guess.
4. Run the real command. Do not claim success from reasoning alone.
5. Use failures as feedback. Preserve the important error text, fix the cause, and run verification again.
6. Finish only after the relevant tests, build, lint, typecheck, or manual check passes, or clearly report what could not be run.

Do not mask AI uncertainty:

- Do not invent APIs, files, paths, test results, or runtime behavior.
- Inspect the repository before choosing patterns.
- Prefer existing project helpers, frameworks, and conventions over new abstractions.
- When information may be stale or external, verify from primary sources.

## Coding Standards

Match the local codebase:

- Follow existing naming, formatting, file layout, error handling, dependency choices, and test style.
- Keep changes scoped to the user's request and the affected behavior.
- Add abstractions only when they reduce real complexity or match an established pattern.
- Keep interfaces explicit: clear function names, clear inputs and outputs, and no hidden global assumptions unless the project already uses them.

Keep code reviewable:

- Prefer small cohesive files and functions over large mixed-purpose blocks.
- Use comments only to explain non-obvious intent, invariants, or edge cases.
- Avoid broad refactors mixed with feature work unless required for correctness.
- Update docs or examples when behavior, setup, environment variables, or commands change.

## Commit Discipline

Before committing:

- Run `git status --short` and inspect relevant diffs.
- Confirm no unrelated user changes are staged.
- Confirm no secrets, `.env` files, build artifacts, local caches, or generated noise are staged.
- Run the relevant validation commands and record failures honestly.

Commit style:

- Use clear, action-oriented commit messages.
- Prefer conventional prefixes when the repository already uses them, such as `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- Keep each commit about one coherent change.

## User Collaboration Habits

Optimize for useful results:

- Start from the user's actual goal, not a broad lecture.
- Ask fewer questions; ask only when the answer is necessary and cannot be safely inferred.
- Respect user preferences, project constraints, and existing conventions.
- Report progress in concise Chinese during longer work.
- Final responses should include what changed, where it changed, and what validation ran.

Use this quick checklist during implementation:

- Requirement understood and assumptions stated.
- Existing project context inspected.
- Security red lines checked.
- Test or verification target defined.
- Implementation completed within scope.
- Real feedback command run.
- Diff reviewed before commit.
- Final result explained clearly.
