// Canonical decision point for the "protected page" invariant.
//
// The enforcement-path checker proves that entry points ROUTE THROUGH this
// function. It does NOT prove this function's logic is correct — that is a
// separate node on the enforcement path and must be verified on its own.
export async function isUserEntitled(userId: string): Promise<boolean> {
  // Stand-in for the real decision (subscription check, ACL lookup, etc.).
  return userId.length > 0
}
