import { useEffect, useState } from 'react'
import { getPlatform, type PlatformAdapter } from '@/core/platform/adapter'

export function usePlatform(): PlatformAdapter | null {
  const [adapter, setAdapter] = useState<PlatformAdapter | null>(null)
  useEffect(() => {
    let mounted = true
    void getPlatform().then((a) => {
      if (mounted) setAdapter(a)
    })
    return () => {
      mounted = false
    }
  }, [])
  return adapter
}
