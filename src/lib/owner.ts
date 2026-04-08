const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || ''

export function isOwner(email: string | undefined | null): boolean {
  return !!email && !!OWNER_EMAIL && email === OWNER_EMAIL
}
