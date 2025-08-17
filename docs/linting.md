# Code Quality & Linting Setup

This project uses comprehensive linting and formatting tools to maintain code quality for both TypeScript/Svelte frontend code and Python backend code.

## Frontend (TypeScript/Svelte)

### Tools Used

- **ESLint**: Static analysis and linting for JavaScript/TypeScript/Svelte
- **Prettier**: Code formatting
- **TypeScript Compiler**: Type checking
- **svelte-check**: Svelte-specific type checking

### Configuration Files

- `eslint.config.js` - ESLint configuration with flat config format
- `.prettierrc` (if exists) - Prettier configuration
- `tsconfig.json` - TypeScript configuration

### Available Scripts

```bash
# Run all linting and formatting checks
npm run validate

# Individual checks
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint with auto-fix
npm run format        # Format code with Prettier
npm run format:check  # Check if code is formatted
npm run type-check    # Run TypeScript type checking
npm run check         # Run Svelte type checking
```

## Backend (Python)

The Python code in the `python/` directory uses:

- **Ruff**: Fast Python linter and formatter
- **MyPy**: Static type checking

## Manual Quality Checks

### Running Quality Checks

Before committing code, run the validation script:

```bash
# Run all quality checks
npm run validate

# Or run individual checks
npm run type-check    # TypeScript type checking
npm run check         # Svelte type checking  
npm run lint          # ESLint
npm run format:check  # Prettier formatting check
```

### Fixing Issues

To automatically fix issues where possible:

```bash
# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Recommended Workflow

1. **During development**: Fix issues as they appear in your IDE
2. **Before committing**: Run `npm run validate`
3. **If validation fails**: Run `npm run lint:fix` and `npm run format`
4. **Commit**: Once all checks pass

## GitHub Actions

The project includes automated quality checks via GitHub Actions:

### Code Quality Workflow (`.github/workflows/code-quality.yml`)

Runs on every push and pull request:

1. **TypeScript type checking** - Ensures type safety
2. **Svelte type checking** - Validates Svelte components
3. **ESLint** - Catches code quality issues and bugs
4. **Prettier formatting check** - Ensures consistent formatting

### Integration with Existing Workflows

The quality checks integrate with existing workflows:
- `pr-checks.yml` - Python quality checks
- `app-tests.yml` - Browser and unit tests

## IDE Integration

### VS Code

Recommended extensions for optimal development experience:

```json
{
  "recommendations": [
    "svelte.svelte-vscode",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

Settings for auto-fix on save:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "svelte"
  ]
}
```

## Common Issues & Solutions

### ESLint Parsing Errors

If you see TypeScript parsing errors, ensure:
1. `@typescript-eslint/parser` is installed
2. `tsconfig.json` path is correct in ESLint config
3. Files are included in TypeScript compilation

### Performance Issues

If linting is slow:
- ESLint only processes changed files via `lint-staged`
- Consider excluding large generated files in `.eslintignore`
- Use ESLint cache: `eslint . --cache`

## Customization

### Adding New Rules

Edit `eslint.config.js` to add or modify rules:

```javascript
{
  rules: {
    'your-new-rule': 'error',
    'existing-rule': 'off'
  }
}
```

### File Exclusions

Create `.eslintignore` to exclude files:
```
dist/
build/
coverage/
*.min.js
```

### Prettier Configuration

Create `.prettierrc` for custom formatting:
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2
}
```

## Migration Notes

This setup uses:
- **ESLint Flat Config** (modern format, replaces `.eslintrc`)
- **TypeScript ESLint v7+** (latest TypeScript support)
- **Prettier 3.x** (latest formatting features)

Legacy `.eslintrc.*` files are not used.