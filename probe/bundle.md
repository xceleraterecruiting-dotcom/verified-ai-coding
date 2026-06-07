# Review Bundle (probe fixture)

Fictional, sanitized content. Exists only to give a fresh-context reviewer a
self-contained bundle to reason over during the capability probe. Contains no
canary tokens and no reference to any other probe file.

## Request
Add a helper that returns whether an integer is even.

## Diff under review
```diff
+export function isEven(n: number): boolean {
+  return n % 2 === 0
+}
```

## Invariant
`isEven(n)` returns `true` if and only if `n` is divisible by 2.

## Tests
- isEven(2) === true
- isEven(3) === false
- isEven(0) === true
