import { useEffect, useRef, useState } from 'react'

function formatTime(s) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r < 10 ? '0' : ''}${r}`
}

// Opens the real camera/mic (getUserMedia), records with MediaRecorder, and hands
// the finished clip back as an object URL — nothing is uploaded, it's kept in memory.
export default function CameraRecorder({ onClose, onPost }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const [status, setStatus] = useState('requesting') // requesting | live | recording | preview | error
  const [errorMsg, setErrorMsg] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [stance, setStance] = useState(null) // 'bullish' | 'bearish' | null
  const [comment, setComment] = useState('')

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setStatus('live')
      })
      .catch((err) => {
        setErrorMsg(err.name === 'NotAllowedError' ? 'Camera access was denied.' : 'Could not access the camera.')
        setStatus('error')
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      clearInterval(timerRef.current)
    }
  }, [])

  function startRecording() {
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current)
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setPreviewUrl(URL.createObjectURL(blob))
      setStatus('preview')
    }
    recorder.start()
    recorderRef.current = recorder
    setSeconds(0)
    setStatus('recording')
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-lg" onClick={onClose}>
      <div
        className="bg-surface-container-lowest border border-outline-variant rounded-lg w-full max-w-sm overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-black aspect-[9/16]">
          {status !== 'preview' && <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />}
          {status === 'preview' && previewUrl && (
            <video src={previewUrl} controls autoPlay loop className="w-full h-full object-cover" />
          )}
          {status === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-body-sm px-lg text-center">
              Requesting camera access…
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-sm text-white text-body-sm px-lg text-center">
              <span className="material-symbols-outlined text-[32px]">videocam_off</span>
              {errorMsg}
            </div>
          )}
          {status === 'recording' && (
            <div className="absolute top-md left-md flex items-center gap-xs bg-black/50 text-white text-label-caps px-sm py-xs rounded-full">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" /> {formatTime(seconds)}
            </div>
          )}
        </div>

        {status === 'preview' && (
          <div className="px-md pt-md flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <button
                onClick={() => setStance((s) => (s === 'bullish' ? null : 'bullish'))}
                className={`flex-1 flex items-center justify-center gap-xs text-label-caps py-sm rounded border transition-colors ${
                  stance === 'bullish'
                    ? 'bg-secondary text-on-secondary border-secondary'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">trending_up</span> Bullish
              </button>
              <button
                onClick={() => setStance((s) => (s === 'bearish' ? null : 'bearish'))}
                className={`flex-1 flex items-center justify-center gap-xs text-label-caps py-sm rounded border transition-colors ${
                  stance === 'bearish'
                    ? 'bg-tertiary text-on-tertiary border-tertiary'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">trending_down</span> Bearish
              </button>
            </div>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)…"
              className="w-full bg-surface-container border border-outline-variant rounded px-sm py-sm text-body-sm text-on-surface placeholder:text-on-surface-variant"
            />
          </div>
        )}

        <div className="p-md flex items-center justify-center gap-md">
          {status === 'live' && (
            <>
              <button onClick={onClose} className="text-label-caps px-md py-sm text-on-surface-variant hover:bg-surface-container rounded transition-colors">
                CANCEL
              </button>
              <button onClick={startRecording} aria-label="Start recording" className="w-14 h-14 rounded-full bg-error border-4 border-surface-container-lowest shadow" />
            </>
          )}
          {status === 'recording' && (
            <button onClick={stopRecording} aria-label="Stop recording" className="w-14 h-14 rounded-full bg-error flex items-center justify-center">
              <span className="w-5 h-5 rounded-sm bg-on-error" />
            </button>
          )}
          {status === 'preview' && (
            <>
              <button onClick={onClose} className="text-label-caps px-md py-sm text-on-surface-variant hover:bg-surface-container rounded transition-colors">
                DISCARD
              </button>
              <button
                onClick={() => onPost(previewUrl, { stance, comment: comment.trim() })}
                className="text-label-caps px-lg py-sm bg-primary text-on-primary rounded hover:bg-opacity-90 transition-all"
              >
                POST REACTION
              </button>
            </>
          )}
          {status === 'error' && (
            <button onClick={onClose} className="text-label-caps px-md py-sm bg-primary text-on-primary rounded hover:bg-opacity-90 transition-all">
              CLOSE
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
