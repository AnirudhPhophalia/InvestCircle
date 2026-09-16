// Postgres timestamps come through the API as proper ISO 8601 strings (via JSON
// serialization of the driver's Date objects), so no reformatting is needed.
export function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
