export default function Avatar({ user, className = 'w-8 h-8' }) {
  const name = user?.display_name || user?.displayName || '?'
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()

  if (user?.avatar) {
    return <img src={user.avatar} alt={name} className={`${className} rounded object-cover border border-outline-variant`} />
  }
  return (
    <div className={`${className} rounded bg-primary-container text-on-primary-container flex items-center justify-center text-label-caps shrink-0`}>
      {initials}
    </div>
  )
}
