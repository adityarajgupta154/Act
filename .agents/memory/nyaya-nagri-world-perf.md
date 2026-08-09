---
name: Nyaya Nagri world perf budget
description: Rendering rules that keep the 3D world inside the low-end shadow/draw budget
---
Rule: repeated world decor (trees, bushes, rocks, flowers) must render through drei `<Instances>` batches — unit geometry, per-instance scale/color — and `castShadow` stays restricted to main hulls only (monument body, player torso/head/backpack, well base/roof). Every spread-out Instances batch needs `frustumCulled={false}`.

**Why:** architect review failed the world redesign at ~150 individual shadow casters (~60 of them vegetation meshes) against the PRD low-end perf budget; instancing plus hull-only casting brought the 1024 shadow pass down to ~26 draws with no visible change. InstancedMesh culls by a single origin bounding sphere, so spread-out instances pop out of view when the camera looks away from the origin unless culling is disabled.

**How to apply:** any new decor variant gets its own `<Instances>` batch rather than per-plant meshes; new marker or decor meshes default to `castShadow` OFF unless they are the main silhouette mass.
