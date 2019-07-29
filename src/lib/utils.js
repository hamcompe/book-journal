import {useState, useEffect} from 'react'

export const useDebounce = (callback, waiting) => {
  const [queue, setQueue] = useState(0)

  useEffect(() => {
    if (queue > 0) {
      const timeout = setTimeout(() => {
        callback()
        setQueue(0)
      }, waiting)

      return () => clearTimeout(timeout)
    }
  }, [queue])

  return () => {
    setQueue(queue + 1)
  }
}
