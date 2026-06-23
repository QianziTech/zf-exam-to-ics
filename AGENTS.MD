# Repository Guidelines

## Project Structure & Module Organization

This is a Vite + React + TypeScript single-page app for converting exam Excel files into ICS calendar files. Application code lives in `src/`: `components/` contains UI steps such as `FileUploader`, `ColumnMapper`, `ExamInfo`, `ReminderConfig`, and `DownloadButton`; `utils/` contains parsing, validation, error handling, and ICS generation logic; `stores/` holds Zustand state; `types/` defines shared TypeScript models; `constants/` stores field mappings. Static assets belong in `public/` or `src/assets/`. Build output is generated in `dist/` and should not be edited.

## Build, Test, and Development Commands

Use pnpm for dependency management.

- `pnpm install`: install dependencies from `pnpm-lock.yaml`.
- `pnpm dev`: start the local Vite development server.
- `pnpm build`: run TypeScript project checks and create the production bundle.
- `pnpm lint`: run ESLint over the repository.
- `pnpm preview`: serve the built `dist/` output locally.

## Coding Style & Naming Conventions

Write TypeScript and React function components. Match the existing style: semicolons, single quotes, two-space indentation, named exports for components, and `PascalCase` component directories with `index.tsx` entry files. Use `camelCase` for functions, variables, hooks, and store actions. Keep reusable business logic in `src/utils/`; keep UI-specific state and rendering inside components. Prefer clear errors through the existing `src/utils/errors.ts` helpers.

## Testing Guidelines

No test runner is currently configured. Until one is added, validate changes with `pnpm lint` and `pnpm build`, and manually exercise the upload, column mapping, confirmation, reminder, and ICS download flow. When adding tests, colocate them near the code as `*.test.ts` or `*.test.tsx`, prioritize public utilities in `src/utils/`, and cover malformed Excel data, invalid mappings, time parsing edge cases, and empty exam lists.

## Commit & Pull Request Guidelines

The current history uses short Conventional Commit-style subjects such as `feat: 初始化底层逻辑`. Prefer `feat:`, `fix:`, `docs:`, `refactor:`, or `chore:` followed by a concise Chinese or English summary. Pull requests should describe the user-facing change, list validation commands run, link related issues, and include screenshots or screen recordings for UI changes.

## Security & Privacy Notes

The app is intended to process Excel data entirely in the browser. Do not add network uploads, analytics, or logging of exam data without documenting the privacy impact and obtaining explicit project approval.
