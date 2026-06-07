// BAD (missing import): the canonical decision exists in this folder, but the
// page never imports it. It gates on a shortcut instead. The entry point does
// not route through the canonical decision at all.
export async function renderProtectedPage(userId: string): Promise<string> {
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
