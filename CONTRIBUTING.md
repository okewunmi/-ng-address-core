# Contributing

## Principles

1. Nigerian address behavior should be represented by tests before parser logic is changed.
2. Prefer deterministic, explainable rules over opaque AI output in `@ng-address/core`.
3. Do not add private personal data to fixtures.
4. Do not make network requests from the core package.
5. Preserve backwards compatibility whenever possible.

## Local development

```bash
npm install
npm run check
```

## Adding a parser rule

1. Add a failing regression test.
2. Implement the smallest deterministic rule.
3. Run the full suite.
4. Add a changelog entry if the public behavior changes.
5. Explain confidence or matching implications in the PR.


## Development

Use Node 22.6+ (tests are TypeScript run via `--experimental-strip-types`). `npm install && npm run check`. Every parser change needs a regression test with *exact* expected fields; never assert only that "some street" exists.
