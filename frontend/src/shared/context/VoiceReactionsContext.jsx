import { createContext, useCallback, useContext, useState } from 'react'
import { demoReactionsFor } from '../lib/voiceReactions.js'

// Lives above the router (see App.jsx) so recorded voice reactions — including the
// actual video object URL — survive navigating away and back, instead of resetting
// with whichever page's local state used to hold them.
const VoiceReactionsContext = createContext(null)

export function VoiceReactionsProvider({ children }) {
  const [byNewsId, setByNewsId] = useState({})

  const seedIfNeeded = useCallback((newsId, seedIndex) => {
    setByNewsId((prev) => (prev[newsId] ? prev : { ...prev, [newsId]: demoReactionsFor(newsId, seedIndex) }))
  }, [])

  const addReaction = useCallback((newsId, reaction) => {
    setByNewsId((prev) => ({ ...prev, [newsId]: [reaction, ...(prev[newsId] || [])] }))
  }, [])

  return (
    <VoiceReactionsContext.Provider value={{ byNewsId, seedIfNeeded, addReaction }}>
      {children}
    </VoiceReactionsContext.Provider>
  )
}

export function useVoiceReactions() {
  return useContext(VoiceReactionsContext)
}
