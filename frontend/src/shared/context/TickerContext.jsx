import { createContext, useContext, useState } from 'react'

// Lets whatever page is showing a specific company (a news item, a post) tell the
// Company Fundamentals panel in the shared layout which ticker to follow.
const TickerContext = createContext(null)

export function TickerProvider({ children }) {
  const [activeTicker, setActiveTicker] = useState(null)
  return <TickerContext.Provider value={{ activeTicker, setActiveTicker }}>{children}</TickerContext.Provider>
}

export function useActiveTicker() {
  return useContext(TickerContext)
}
