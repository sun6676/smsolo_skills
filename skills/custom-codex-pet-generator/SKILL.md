---
name: custom-codex-pet-generator
description: Use when the user wants to create, package, or install a custom Codex pet, especially from a name, mascot idea, brand cue, character inspiration, reference image, or request to make a pet usable through Codex Appearance / Pets.
---

# Custom Codex Pet Generator

## Overview

Create a reusable Codex pet workflow from a short user concept. The expected output is a packaged pet directory under `${CODEX_HOME:-$HOME/.codex}/pets/<pet-id>/` containing `pet.json` and `spritesheet.webp`, plus a run folder with QA artifacts.

Use the installed `hatch-pet` skill as the production pipeline whenever it is available. If `hatch-pet` is missing, install it from `openai/skills` first or clearly report that the dependency is unavailable.

## Inputs To Capture

Infer reasonable defaults instead of over-questioning. Capture:

- `pet_id`: lowercase hyphen-case or compact lowercase, for example `cutepet`.
- `display_name`: user-facing pet name.
- `visual_seed`: the mascot idea, character cue, brand cue, or reference source.
- `style`: default to cute chibi sticker mascot unless the user specifies another pet-safe style.
- `output`: default package path `${CODEX_HOME:-$HOME/.codex}/pets/<pet-id>/`.

When the user references a real person, public character, or brand, treat it as loose inspiration only. Create an original, non-identifiable, mascot-safe design. Do not copy exact facial likeness, logos, readable text, slogans, screenshots, or protected marks.

## Core Workflow

1. Verify or install the `hatch-pet` skill.
2. Prepare a run folder using `hatch-pet/scripts/prepare_pet_run.py`.
3. Generate the base pet image first. It becomes the canonical identity reference.
4. Generate every required animation state:
   - `idle`
   - `running-right`
   - `running-left`
   - `waving`
   - `jumping`
   - `failed`
   - `waiting`
   - `running`
   - `review`
5. Use subagents for image rows when the user allows them or says to complete the pet with retries. Keep at most two generation workers active at once unless the user explicitly asks for more.
6. If one row fails, retry that row once with its retry prompt. Repair the smallest failing scope; do not regenerate the whole pet unless identity is broken globally.
7. Run the deterministic hatch-pet scripts for frame extraction, inspection, atlas composition, validation, contact sheet, and GIF previews.
8. Inspect the contact sheet and previews. Fix visible identity drift, detached fragments, wrong direction, bad chroma cleanup, clipped frames, or state mismatch.
9. Package to `${CODEX_HOME:-$HOME/.codex}/pets/<pet-id>/`.

## Prompt Pattern

For text-only pet requests, shape the concept like this:

```text
Create an original Codex digital pet named <pet_id>.

Visual seed: <user idea or reference cue>.
Mascot interpretation: original, non-identifiable, pet-safe chibi companion inspired by the cue, not a direct copy.
Style: cute chibi sticker mascot, crisp outline, flat cel shading, compact full-body silhouette, readable at 192x208.
Identity locks: <stable face, colors, body shape, outfit, prop, motif>.
Avoid: exact likeness, logos, readable text, scenery, shadows, detached effects, chroma-key-like colors inside the pet.
Package target: ${CODEX_HOME:-$HOME/.codex}/pets/<pet_id>/.
```

If the user needs a ready-to-send prompt, use `references/pet-request-template.md` and fill in the placeholders.

## Quality Checks

Before accepting the pet:

- `spritesheet.webp` should validate as `1536x1872` RGBA-capable atlas.
- `pet.json` and `spritesheet.webp` must be staged together under the final pet directory.
- All 9 animation states must be present and readable.
- `qa/review.json` and `final/validation.json` must have no blocking errors.
- Contact sheet must show one consistent pet identity across rows.
- Directional rows must face the correct direction.
- No row should contain guide marks, text, white backgrounds, shadows, detached fragments, or visible chroma artifacts.

## Final Response

Tell the user:

- final package path
- key files: `pet.json`, `spritesheet.webp`
- QA/run folder path
- how to enable the pet:

```text
Open Codex Settings -> Appearance / Pets -> select <display_name>.
Use /pet to wake it.
```

If packaging or push is blocked, include the exact blocker and the last verified artifact path.
