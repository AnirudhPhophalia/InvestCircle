import { useRef, useState } from 'react'
import { api } from '../../shared/lib/api.js'
import { useAuth } from '../../shared/context/AuthContext.jsx'
import Avatar from '../../shared/components/Avatar.jsx'

const SIZE = 256 // stored photo is a SIZE×SIZE JPEG, ~20–40 KB
const MAX_LENGTH = 90_000 // server accepts up to 95,000 characters

// Center-crops the picked image to a square and shrinks it, so the upload is
// small enough to store directly on the user row.
async function toSquareJpeg(file) {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas
    .getContext('2d')
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  // Very detailed photos can exceed the limit at high quality — step down until it fits.
  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrl.length <= MAX_LENGTH) return dataUrl
  }
  throw new Error('That photo is too detailed to upload — try a different one.')
}

export default function ProfilePhoto() {
  const { user, updateUser } = useAuth()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const label = user.avatar ? 'Edit photo' : 'Add photo'

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again later
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > 15 * 1024 * 1024) return setError('That image is too large (max 15 MB).')

    setError('')
    setUploading(true)
    try {
      updateUser(await api.patch('/users/me', { avatar: await toSquareJpeg(file) }))
    } catch (err) {
      setError(err.message || "Couldn't upload that photo.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-xs shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        disabled={uploading}
        aria-label={label}
        className="group relative w-24 h-24 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Avatar user={user} className="w-24 h-24 text-display" />
        <span
          className={`absolute inset-0 rounded bg-black/55 text-white flex flex-col items-center justify-center gap-[2px] transition-opacity ${
            uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
          }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${uploading ? 'animate-pulse' : ''}`}>
            {uploading ? 'cloud_upload' : 'photo_camera'}
          </span>
          <span className="text-label-caps uppercase">{uploading ? 'Uploading…' : label}</span>
        </span>
        {/* Touch screens have no hover — keep a small camera badge visible there. */}
        <span className="md:hidden absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center border-2 border-background">
          <span className="material-symbols-outlined text-[16px]">photo_camera</span>
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
      {error && <p className="text-body-sm text-error max-w-[160px] text-center">{error}</p>}
    </div>
  )
}
