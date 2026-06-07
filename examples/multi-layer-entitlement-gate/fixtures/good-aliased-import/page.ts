import { isUserEntitled as checkEntitlement } from './canonical-entitlement'

// GOOD (aliased): same correct routing, but the canonical decision is imported
// under an alias. AST tracks the local binding name, so the alias still passes.
export async function renderProtectedPage(userId: string): Promise<string> {
  const entitled = await checkEntitlement(userId)
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
