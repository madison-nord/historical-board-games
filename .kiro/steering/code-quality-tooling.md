---
title: Code Quality Tooling
inclusion: always
---

# Code Quality Tooling (ESLint + Prettier)

## ESLint (v9+ flat config)
- Config: `eslint.config.js` with `@typescript-eslint/parser` and plugin
- Include DOM globals (window, document, HTMLCanvasElement, requestAnimationFrame, etc.)
- Unused vars: `argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`
- Relax rules for test files: allow `any` and `console`
- Relax rules for enum/animation files: allow unused vars

## Prettier
- Critical: `endOfLine: "lf"` to avoid Windows CRLF issues
- Settings: `singleQuote: true`, `printWidth: 100`, `trailingComma: "es5"`, `semi: true`
- `.gitattributes` enforces LF for `frontend/**/*.ts`, `*.config.js`, `.prettierrc`

## Workflow
- Run `npm run lint:fix` first for bulk formatting fixes
- Run `npm run format:check` in CI
- Run `npm run type-check` (`tsc --noEmit`) separately
- For 3000+ formatting errors, always auto-fix first — manual fixes are impractical

## Common Issues
- `'MouseEvent' is not defined` → add DOM globals to ESLint config
- `Delete ␍` errors → line ending issue, run `lint:fix`
- Git line ending warnings → ensure `.gitattributes` exists
