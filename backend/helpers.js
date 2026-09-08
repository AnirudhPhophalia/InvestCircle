export function toPublicUser(row) {
  if (!row) return null
  const { password_hash, ...rest } = row
  return rest
}
