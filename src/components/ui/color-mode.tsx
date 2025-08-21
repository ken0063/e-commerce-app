'use client'

import { useColorMode } from '@/utils'
import type { IconButtonProps, SpanProps } from '@chakra-ui/react'
import { ClientOnly, HStack, IconButton, Skeleton, Span, VisuallyHidden } from '@chakra-ui/react'
import { ThemeProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'
import * as React from 'react'
import { LuMoon, LuSun, LuLaptop } from 'react-icons/lu'

export type ColorModeProviderProps = ThemeProviderProps

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    />
  )
}

export type ColorMode = 'light' | 'dark' | 'system'

export interface UseColorModeReturn {
  // The configured mode (can be 'system')
  colorMode: ColorMode
  // The actual, resolved mode ('light' | 'dark') based on system when applicable
  resolvedColorMode: Exclude<ColorMode, 'system'>
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
  setSystem: () => void
}

export function ColorModeIcon() {
  const { resolvedColorMode } = useColorMode()
  return resolvedColorMode === 'dark' ? <LuMoon /> : <LuSun />
}

type ColorModeButtonProps = Omit<IconButtonProps, 'aria-label'>

export const ColorModeButton = React.forwardRef<HTMLButtonElement, ColorModeButtonProps>(
  function ColorModeButton(props, ref) {
    const { toggleColorMode } = useColorMode()
    return (
      <ClientOnly fallback={<Skeleton boxSize="8" />}>
        <IconButton
          onClick={toggleColorMode}
          variant="ghost"
          aria-label="Toggle color mode"
          size="sm"
          color="text"
          ref={ref}
          {...props}
          css={{
            _icon: {
              width: '5',
              height: '5',
            },
          }}
        >
          <ColorModeIcon />
        </IconButton>
      </ClientOnly>
    )
  },
)

// A compact three-option toggle: Light, Dark, System
export function ColorModeToggleGroup() {
  const { colorMode, setColorMode, resolvedColorMode } = useColorMode()
  const isActive = (mode: 'light' | 'dark' | 'system') => colorMode === mode

  return (
    <ClientOnly fallback={<Skeleton height="8" width="28" />}>
      <HStack gap="1">
        <IconButton
          aria-label="Use light mode"
          variant={isActive('light') ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => setColorMode('light')}
          color="text"
        >
          <LuSun />
          <VisuallyHidden>Light</VisuallyHidden>
        </IconButton>
        <IconButton
          aria-label="Use dark mode"
          variant={isActive('dark') ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => setColorMode('dark')}
          color="text"
        >
          <LuMoon />
          <VisuallyHidden>Dark</VisuallyHidden>
        </IconButton>
        <IconButton
          aria-label="Use system theme"
          variant={isActive('system') ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => setColorMode('system')}
          title={`System (${resolvedColorMode})`}
          color="text"
        >
          <LuLaptop />
          <VisuallyHidden>System</VisuallyHidden>
        </IconButton>
      </HStack>
    </ClientOnly>
  )
}

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function LightMode(props, ref) {
    return (
      <Span
        color="text"
        display="contents"
        className="chakra-theme light"
        colorPalette="gray"
        ref={ref}
        {...props}
      />
    )
  },
)

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(function DarkMode(props, ref) {
  return (
    <Span
      color="text"
      display="contents"
      className="chakra-theme dark"
      colorPalette="gray"
      ref={ref}
      {...props}
    />
  )
})
