# Exercise images — brief

The app shows a demo image at the top of each exercise's Focus view (tap an
exercise name while logging). Any exercise without an image just skips it,
so this can be filled in gradually.

## What to deliver

- **One PNG per exercise**, named exactly as the `filename` column in
  [`manifest.csv`](./manifest.csv) (e.g. `barbell-bench-press-flat.png`).
  The name is how the app finds the image — a typo means it won't show.
- **336 exercises** in the manifest (cardio is excluded). Do them in any
  order; the ones you actually log are the best place to start.
- Put finished files in `public/exercise-images/` (or anywhere, and point
  Claude at the folder). Claude converts them to small WebP files, checks
  every name against the manifest, and ships them.

## Image spec

| | |
|---|---|
| Size | **1536 × 1024** (landscape 3:2) — ChatGPT's native landscape size |
| Background | Solid **#171717** (near-black, matches the app) — no gradients, no floor texture |
| Figure | One gender-neutral athletic figure, light gray **#D4D4D4**, simple flat shading |
| Equipment | Drawn simply in mid gray **#737373** |
| Accent | None — muscle highlighting is already done by the app's muscle map |
| Text | **None** — no labels, arrows with words, logos or watermarks |
| View | Side view unless a front view shows the movement better (e.g. lateral raises, wide-stance squats) |
| Panels | **Lifts: 2 panels side by side** — start position on the left, end position on the right, same figure, same camera. **Holds (Mobility/Yoga/Pilates): 1 panel**, figure centered. The `panels` column says which. |

Keep the **same figure, style, camera distance and background for every
image** — consistency matters more than detail.

## Prompt to paste into ChatGPT (once, at the start of a chat)

> I need a consistent set of exercise demonstration illustrations for a
> fitness app. Use this exact style for every image I ask for:
>
> - 1536×1024 landscape, solid #171717 background, nothing else in the scene
> - one gender-neutral athletic figure in flat light gray (#D4D4D4) with
>   minimal shading, simple mid-gray (#737373) equipment
> - clean, modern, minimal vector-illustration look; correct anatomy and
>   joint angles; realistic proportions
> - no text, labels, arrows, logos or watermarks
> - side view unless I say otherwise
> - for "2 panels": show the start position on the left and the end position
>   on the right, same figure and camera, a little space between them
> - for "1 panel": the held position, figure centered
>
> I'll send exercises one at a time as: *name — panels — position notes*.
> Reply with only the image. Confirm you understand, then wait.

Then for each row of the manifest, send one line built from its columns:

> **Barbell Bench Press (Flat)** — 2 panels — Shoulder blades pinched and
> down, slight arch, feet planted / Lower to mid-chest with elbows ~45°

Save each image with its `filename`.

## Tips

- Generate ~10–15 per chat, then start a new chat with the same style
  prompt — long chats drift in style.
- Reject images with wrong form (rounded back on a deadlift, knees caving
  on a squat, bar path off). The position notes are there to catch these.
- If a figure's style drifts, re-attach one of your best earlier images and
  say "match this style exactly".
