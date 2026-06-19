import { useEffect, useState } from 'react'

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    const currentBuildId = document.querySelector('meta[name="build-id"]')?.content

    async function checkForUpdate() {
      try {
        const res = await fetch('/index.html', { cache: 'no-store' })
        const html = await res.text()
        const match = html.match(/<meta name="build-id" content="([^"]+)"/)
        if (match && currentBuildId && match[1] !== currentBuildId) {
          setUpdateAvailable(true)
        }
      } catch {
        // network hiccup, ignore and try again later
      }
    }

    const interval = setInterval(checkForUpdate, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return updateAvailable
}
