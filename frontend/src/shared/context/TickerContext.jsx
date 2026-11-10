import { createContext, useCallback, useContext, useState } from 'react'

// Lets whatever page is showing a specific company (a news item, a post) tell the
// Company Fundamentals panel in the shared layout which ticker to follow.
// aiCompanies holds companies an LLM matched to live news, keyed by ticker, with
// the same shape as the static FUNDAMENTALS entries so the panel can show either.
const TickerContext = createContext(null)

export function TickerProvider({ children }) {
  const [activeTicker, setActiveTicker] = useState(null)
  const [aiCompanies, setAiCompanies] = useState({})
  const addAiCompany = useCallback((ticker, data) => {
    setAiCompanies((prev) => ({ ...prev, [ticker]: data }))
  }, [])
  return (
    <TickerContext.Provider value={{ activeTicker, setActiveTicker, aiCompanies, addAiCompany }}>
      {children}
    </TickerContext.Provider>
  )
}

export function useActiveTicker() {
  return useContext(TickerContext)
}
