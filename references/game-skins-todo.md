# Game Skins To-Do

Persistent memory for `@skin-designer`. Tracks skin implementation status per game.

## Asteroids — implemented 2026-09-11

| Skin    | Status  | Notes                                                        |
| ------- | ------- | ------------------------------------------------------------ |
| classic | ✅ done | White-on-black, original arcade feel, starfield              |
| neon    | ✅ done | Cyan ship / magenta asteroids / yellow bullets, glow effects |
| retro   | ✅ done | Amber ship / green asteroids, CRT scanlines, no starfield    |

**Files modified:**

- `app/games/asteroids/AsteroidsGame.tsx` — `SkinId` type, `Skin` interface, `SKINS` map, skin prop threaded through all draw calls
- `app/games/asteroids/page.tsx` — skin selector (3 buttons in HUD bar), localStorage key `arcade:skin:asteroids`, accent color propagated to HUD/modal

## Tetris — implemented 2026-09-11

| Skin    | Status  | Notes                                                                     |
| ------- | ------- | ------------------------------------------------------------------------- |
| classic | ✅ done | Original Tetris piece colors on black, white grid, highlight sheen        |
| neon    | ✅ done | Cyan/magenta/violet pieces on near-black, canvas shadow glow per block    |
| retro   | ✅ done | Amber + phosphor-green pieces on dark brown #0d0a00, CRT scanline overlay |

**Files modified:**

- `app/games/tetris/TetrisGame.tsx` — `SkinId` type, `Skin` interface, `SKINS` map, `skinRef` threaded through all draw calls; retro CRT scanlines in `draw()`; neon shadow glow in `drawBlock()`; skin selector (3 buttons in HUD); localStorage key `arcade:skin:tetris`

## Arkanoid — implemented 2026-09-11

| Skin    | Status  | Notes                                                                              |
| ------- | ------- | ---------------------------------------------------------------------------------- |
| classic | ✅ done | Original spritesheet used for paddle/ball/bricks, black bg, preserves arcade look  |
| neon    | ✅ done | Cyan/magenta/violet bricks on #05050f, canvas glow (shadowBlur), grid overlay      |
| retro   | ✅ done | Amber #ffb000 / phosphor-green #39ff14 bricks on #0d0a00, CRT scanlines, warm glow |

**Files modified:**

- `app/games/arkanoid/ArkanoidGame.tsx` — `SkinId` type, `Skin` interface, `SKINS` map, `skinRef` for live prop updates; skinned draw paths for bricks/paddle/ball/explosions/pause overlay; neon grid bg; retro scanlines
- `app/games/arkanoid/page.tsx` — skin state + `handleSkinChange`, localStorage key `arcade:skin:arkanoid`, 3-button selector in HUD bar, `skin` prop passed to `ArkanoidGame`

## Snake — implemented 2026-09-11

| Skin    | Status  | Notes                                                               |
| ------- | ------- | ------------------------------------------------------------------- |
| classic | ✅ done | Green-on-black (#22c55e head / #16a34a body), original Snake feel   |
| neon    | ✅ done | Cyan head / violet body (#7b2fff), glow on head, magenta accent     |
| retro   | ✅ done | Amber head (#ffb000) / green body (#39ff14), CRT scanlines, dark bg |

**Files modified:**

- `app/games/snake/SnakeGame.tsx` — `SkinId` type, `Skin` interface, `SKINS` map, `skinRef` threaded through all canvas draw calls; skin selector (3 buttons in HUD bar); localStorage key `arcade:skin:snake`
