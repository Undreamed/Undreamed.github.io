# Cloud Playground

Source of truth: [Undreamed/Undreamed.github.io](https://github.com/Undreamed/Undreamed.github.io)

Production host: `https://codex-cloud-test.undreamed-games.workers.dev`

## Projects

Each folder under `projects/` is published at the same path:

- `projects/ok` → `/ok`
- `projects/pong` → `/pong`
- `projects/simulation` → `/simulation`

Create a project at `projects/<slug>` with a `package.json`, an `index.html`, its source, and a build script. The workspace package needs a unique name and a `build` script. Use lowercase letters, numbers, and hyphens for the slug. Configure Vite with `base: "/<slug>/"` and `build.outDir: "../../dist/<slug>"`; keep `emptyOutDir: false` so other project outputs survive. The shared build discovers every project folder and requires its output to contain `dist/<slug>/index.html`.

The root npm workspace supplies Vite and Wrangler. Add any project-specific dependencies to that project's package file, run `npm install` in Codex Cloud, and commit the updated `package-lock.json`. TypeScript, Canvas, WebGL, and WebAssembly files are handled as normal project sources and static assets.

Use `packages/*` for code shared by projects. Keep backend code in the Worker and add API routes under `worker/routes/<slug>` only when needed. Add Cloudflare bindings to `wrangler.jsonc` and set matching preview/production values in Cloudflare; do not store secrets in GitHub.

## Build and publish

Cloudflare Workers Builds installs dependencies and runs `npm run verify` for branch previews and production commits. A pull request gets a preview URL. Merging to `master` triggers the production deployment. No per-project Cloudflare setup is required.

The Worker health routes `/ok` and `/_health` return plain-text `OK`.

For Codex Cloud, create and publish one cloud environment for this repository and use `scripts/codex-cloud-setup.sh` as its install script. The script installs dependencies and runs the same tests and build used by Cloudflare Builds. No Cloudflare credential is needed in that environment.

## Free-tier limits

Cloudflare's current Workers Free limits include 3,000 Workers Build minutes per month, one concurrent build, 20,000 static asset files per Worker version, and 25 MiB per asset. Static asset requests are free and unlimited; requests that execute Worker code share the 100,000-per-day limit. These are platform limits, so the repository can hold as many projects as fit within the account's build and asset quotas.
