import { isUserEntitled } from './canonical-entitlement'

// BAD (dead branch): the access decision is made and returned on a shortcut
// BEFORE the canonical check. The canonical call and its guard sit in code that
// runs after an unconditional return — unreachable, so it cannot gate access.
//
// The checker does NOT attempt full reachability analysis. It detects the dumb,
// honest fact that the canonical call appears only after an unconditional return,
// and reports that it cannot verify the canonical decision gates access.
export async function renderProtectedPage(userId: string): Promise<string> {
  if (!isFeatureEnabled()) {
    return denyAccess()
  }
  return renderContent()

  const entitled = await isUserEntitled(userId)
  if (!entitled) {
    return denyAccess()
  }
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
