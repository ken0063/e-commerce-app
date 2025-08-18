import type { ColorMode, UseColorModeReturn } from '@/components/ui/color-mode'
import { createToaster } from '@chakra-ui/react'
import { useTheme } from 'next-themes'

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme, forcedTheme, theme } = useTheme()
  const colorMode = (forcedTheme || theme || 'system') as ColorMode

  const toggleColorMode = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const setSystem = () => setTheme('system')

  return {
    colorMode,
    resolvedColorMode: (resolvedTheme as 'light' | 'dark') || 'light',
    setColorMode: setTheme,
    toggleColorMode,
    setSystem,
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { resolvedColorMode } = useColorMode()
  return resolvedColorMode === 'dark' ? dark : light
}

export const toaster = createToaster({
  placement: 'bottom-end',
  pauseOnPageIdle: true,
})
