# Cold-review bundle (sanitized sample)

Fictional, public, sanitized content — a self-contained bundle for exercising the
isolated-bundle reviewer end to end. No proprietary code, no canaries.

## 1. Original request
Add a guard so a discount code can only be applied once per order.

## 2. Invariant
MUST NEVER apply the same discount code to an order more than once. A second
application of an already-applied code must be refused.

## 3. Diff under review
```diff
+export function applyDiscount(order, code) {
+  if (order.appliedCodes.includes(code)) {
+    throw new Error('Discount code already applied')
+  }
+  order.appliedCodes.push(code)
+  order.total = order.total - discountValue(code)
+  return order
+}
```

## 4. Tests / redteam results (actual output)
```
PASS  applies a new code once (total reduced)
PASS  re-applying the same code throws "Discount code already applied"
PASS  total is unchanged when re-application is refused
```

## 5. Rubric / ship gates
- [x] New code reduces total exactly once
- [x] Re-applying the same code is refused (invariant)
- [x] Refused re-application does not change the total
```
