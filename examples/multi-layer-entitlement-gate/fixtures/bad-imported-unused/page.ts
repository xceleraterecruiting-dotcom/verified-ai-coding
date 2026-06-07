import { isUserEntitled } from './canonical-entitlement'

// BAD (imported, called, but unused in the gate) — the PRIMARY fixture.
//
// This file imports AND calls the canonical decision, so a grep/string check
// for `isUserEntitled` (even `isUserEntitled(`) PASSES. But the computed result
// is never used to gate access — the gate falls back to a shortcut. The AST
// checker fails it because the entitlement value never reaches a guard.
export async function renderProtectedPage(userId: string): Promise<string> {
  const entitled = await isUserEntitled(userId)
  console.log('entitlement computed:', entitled)

  if (!isFeatureEnabled()) {
    return denyAccess()
  }
  return renderContent()
}

function isFeatureEnabled(): boolean {
  return true
}
function denyAccess(): string {
  return 'denied'
}
function renderContent(): string {
  return 'protected content'
}
