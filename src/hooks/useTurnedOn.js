import { useEffect, useRef } from 'react'

// Calls onTurnedOn when `flag` goes from false to true — a setting being
// switched on, not one that was already on when the component mounted.
export function useTurnedOn(flag, onTurnedOn) {
  const prevRef = useRef(flag)
  useEffect(() => {
    const was = prevRef.current
    prevRef.current = flag
    if (flag && !was) onTurnedOn()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag])
}
