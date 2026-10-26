# Repository guidance

- Use the published Codex Cloud environment for development and verification. Do not require the user's PC, a tunnel, a local service, or a self-hosted runner.
- Never commit API tokens, account IDs used as secrets, environment files, or decrypted credentials.
- Keep projects independent under `projects/<slug>`; share code only through `packages/*`.
- Project slugs use lowercase letters, numbers, and hyphens. Every project is an npm workspace with a build script that emits `dist/<slug>/index.html`.
- Root commands are `npm run test`, `npm run build`, and `npm run verify`. Update `package-lock.json` with `npm install` when changing workspace manifests or dependencies.
- Deployments, previews, and build-time tests run through Cloudflare Workers Builds. Do not add a second deployment workflow.
- Add Cloudflare APIs, database bindings, or multiplayer services only when a project needs them. Keep project-specific API code under `worker/routes/<slug>` and record required preview/production bindings in the README.
