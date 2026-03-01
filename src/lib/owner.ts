export const OWNER_EMAILS = ['millerdjonathan@proton.me']

export function isOwner(email: string | undefined | null): boolean {
  return !!email && OWNER_EMAILS.includes(email)
}
