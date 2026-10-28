# Neon Dodge

Experimental browsergame proof of concept at `/neon-dodge/`.

- Move with Left/Right arrows or A/D; on touchscreens, drag on the playfield.
- Avoid pink blocks. Surviving longer increases the score and difficulty.
- Use Pause or Escape to pause. Leaving the tab also pauses the game.
- Restart after a collision. The best score is saved in browser local storage when available.

From the repository root, run `npm run verify` to test the Worker and build all projects. Serve the generated assets using the repository's local Wrangler startup instructions. Public previews use the existing Cloudflare Workers Builds workflow; this prototype does not introduce a deployment service or require a backend.

This is an exploratory prototype, not a finished game. Browser checks during creation covered starting, scoring, keyboard input, pause/resume, collision, restarting, record persistence, and a mobile touch viewport.
