import { useEffect, useState } from 'react'

// Types out each phrase, pauses, deletes it, then moves to the next — loops forever.
export function useTypewriter(phrases, { typeMs = 45, deleteMs = 25, pauseMs = 1600 } = {}) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex % phrases.length]
    if (!deleting && text === current) {
      const pause = setTimeout(() => setDeleting(true), pauseMs)
      return () => clearTimeout(pause)
    }
    if (deleting && text === '') {
      setDeleting(false)
      setPhraseIndex((i) => i + 1)
      return
    }
    const step = setTimeout(
      () => setText(current.slice(0, deleting ? text.length - 1 : text.length + 1)),
      deleting ? deleteMs : typeMs
    )
    return () => clearTimeout(step)
  }, [text, deleting, phraseIndex, phrases, typeMs, deleteMs, pauseMs])

  return text
}
