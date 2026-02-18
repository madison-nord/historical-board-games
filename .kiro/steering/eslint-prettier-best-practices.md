# ESLint and Prettier Best Practices

## Configuration Strategy

### Modern ESLint Configuration (v9+)
- Use **flat config format** (`eslint.config.js`) instead of legacy `.eslintrc` files
- ESLint v9+ requires the new configuration format for optimal compatibility
- Import plugins and parsers as ES modules for better tree-shaking

### Prettier Integration
- Use `eslint-plugin-prettier` to run Prettier as an ESLint rule
- Configure `prettier/prettier` as an error to enforce consistent formatting
- Use `eslint-config-prettier` to disable conflicting ESLint formatting rules

## Windows Development Considerations

### Line Ending Issues
- **Critical**: Set `endOfLine: "lf"` in `.prettierrc` to avoid Windows CRLF issues
- Windows systems often create files with CRLF line endings by default
- This can cause thousands of formatting errors when Prettier expects LF endings
- Auto-fix resolves most of these issues: `npm run lint:fix`

### File Encoding
- Ensure all files use UTF-8 encoding
- Configure editors to use LF line endings for consistency across platforms

## ESLint Configuration Best Practices

### TypeScript Integration
```javascript
// Use @typescript-eslint parser and plugin
import typescriptParser from '@typescript-eslint/parser';
import typescript from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
  }
];
```

### DOM Globals for Frontend Projects
- Always include necessary DOM globals to prevent `no-undef` errors:
```javascript
globals: {
  console: 'readonly',
  window: 'readonly',
  document: 'readonly',
  HTMLElement: 'readonly',
  HTMLCanvasElement: 'readonly',
  CanvasRenderingContext2D: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  performance: 'readonly',
  MouseEvent: 'readonly',
  TouchEvent: 'readonly',
  global: 'readonly',
  setTimeout: 'readonly',
}
```

### Unused Variables Configuration
```javascript
'@typescript-eslint/no-unused-vars': ['error', { 
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  ignoreRestSiblings: true,
  args: 'all',
  vars: 'all',
  caughtErrors: 'all',
  caughtErrorsIgnorePattern: '^_'
}]
```

### File-Specific Rule Overrides
```javascript
// Allow unused variables in enum definitions and animation stubs
{
  files: ['src/models/*.ts', 'src/rendering/*Animation.ts'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
  },
},
// Relax rules for test files
{
  files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
  },
}
```

## Prettier Configuration

### Recommended Settings
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "bracketSameLine": false
}
```

### Key Settings Explained
- `endOfLine: "lf"` - **Critical for Windows compatibility**
- `printWidth: 100` - Good balance between readability and line length
- `singleQuote: true` - Consistent with TypeScript conventions
- `trailingComma: "es5"` - Safe for older browsers, cleaner diffs

## NPM Scripts Setup

### Essential Scripts
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,json}",
    "format:check": "prettier --check src/**/*.{ts,tsx,json}",
    "type-check": "tsc --noEmit"
  }
}
```

### Development Workflow
1. **Always run `lint:fix` first** - Resolves most formatting issues automatically
2. **Use `format:check` in CI** - Ensures consistent formatting without changes
3. **Run `type-check` separately** - Catches TypeScript errors without compilation

## Common Issues and Solutions

### Callback Parameter Warnings
For unused parameters in callback types, use ESLint disable comments:
```typescript
// eslint-disable-next-line no-unused-vars
private onPositionClick: ((position: number) => void) | null = null;
```

### Large File Formatting
- When dealing with 3000+ formatting errors, always use `lint:fix` first
- Manual fixes are impractical for line ending issues
- Auto-fix resolves 95%+ of formatting problems

### Console Statement Warnings
- Keep `no-console: 'warn'` for development code
- Use `no-console: 'off'` in test file overrides
- Consider using proper logging libraries for production

## Integration with Development Workflow

### Pre-commit Hooks (Recommended)
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint:fix && npm run format && npm run type-check"
    }
  }
}
```

### CI/CD Integration
```bash
# In CI pipeline
npm run lint
npm run format:check
npm run type-check
npm test -- --silent
```

## Performance Considerations

### File Patterns
- Use specific file patterns to avoid linting unnecessary files
- Exclude `dist/`, `node_modules/`, `coverage/` in ignore patterns
- Use `**/*.{ts,tsx}` for recursive TypeScript file matching

### Parallel Execution
- ESLint and Prettier can run in parallel with other checks
- Separate linting from type checking for faster feedback
- Use `--cache` flag for ESLint in large projects

## Troubleshooting

### Common Error Patterns
1. **"'MouseEvent' is not defined"** - Add DOM globals to ESLint config
2. **"Delete ␍" errors** - Line ending issue, run `lint:fix`
3. **"Unused eslint-disable directive"** - Wrong rule name, use `no-unused-vars` not `@typescript-eslint/no-unused-vars` for disable comments

### Debugging Configuration
- Use `--print-config` to see effective ESLint configuration
- Check Prettier config with `--find-config-path`
- Verify file patterns with `--debug` flag

## Best Practices Summary

1. **Use modern flat config** for ESLint v9+
2. **Set `endOfLine: "lf"`** in Prettier for Windows compatibility
3. **Run `lint:fix` first** when dealing with many formatting errors
4. **Configure DOM globals** for frontend projects
5. **Use file-specific overrides** for different code types
6. **Separate linting, formatting, and type checking** in scripts
7. **Test configuration** with small changes before applying broadly
8. **Document any project-specific rules** in README or comments

These practices ensure consistent code quality, reduce developer friction, and maintain compatibility across different development environments.