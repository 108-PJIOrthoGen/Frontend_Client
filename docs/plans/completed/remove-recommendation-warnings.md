# Remove recommendation warning contract

## Objective

Remove obsolete recommendation warning fields from the frontend backend-type contract.

## Plan

1. Remove `warningsJson` declarations.
2. Validate the TypeScript project.

## Result

- Removed obsolete warning type declarations.
- `npx tsc --noEmit --ignoreDeprecations 5.0` passed.
