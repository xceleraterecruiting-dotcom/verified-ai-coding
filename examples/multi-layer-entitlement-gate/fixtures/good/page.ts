import { isUserEntitled } from './canonical-entitlement'

// GOOD: imports the canonical decision, calls it before the gate, and uses the
// result to allow/deny. The entry point routes through the canonical decision.
export async function renderProtectedPage(userId: string): Promise<string> {
  const entitled = await isUserEntitled(userId)
  if (!entitled) {
    return denyAccess()
  }
  return renderContent()
}

function denyAccess(): string {
  return 'denied'
}
function renderContent(): string {
  return 'protected content'
}
