import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      breakpoints: {
        sm: { value: '320px' },
        md: { value: '768px' },
        lg: { value: '960px' },
        xl: { value: '1200px' },
      },

      // Using Chakra UI's built-in color palettes for a minimalist design
      colors: {
        // Primary brand color palette - Blue (professional, trustworthy)
        primary: {
          50: { value: '#eff6ff' },
          100: { value: '#dbeafe' },
          200: { value: '#bfdbfe' },
          300: { value: '#93c5fd' },
          400: { value: '#60a5fa' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
          800: { value: '#1e40af' },
          900: { value: '#1e3a8a' },
        },
        // Secondary accent palette - Green (success, positive actions)
        secondary: {
          50: { value: '#f0fdf4' },
          100: { value: '#dcfce7' },
          200: { value: '#bbf7d0' },
          300: { value: '#86efac' },
          400: { value: '#4ade80' },
          500: { value: '#22c55e' },
          600: { value: '#16a34a' },
          700: { value: '#15803d' },
          800: { value: '#166534' },
          900: { value: '#14532d' },
        },
        // Neutral grays for text and backgrounds
        neutral: {
          50: { value: '#f9fafb' },
          100: { value: '#f3f4f6' },
          200: { value: '#e5e7eb' },
          300: { value: '#d1d5db' },
          400: { value: '#9ca3af' },
          500: { value: '#6b7280' },
          600: { value: '#4b5563' },
          700: { value: '#374151' },
          800: { value: '#1f2937' },
          900: { value: '#111827' },
        },
      },
      fonts: {
        heading: { value: "'Poppins', sans-serif" },
        body: { value: "'Inter', sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        // Background colors for light and dark modes
        bg: {
          default: { value: { base: 'white', _dark: '{colors.neutral.900}' } },
          subtle: { value: { base: '{colors.neutral.50}', _dark: '{colors.neutral.800}' } },
          muted: { value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.700}' } },
        },
        // Text colors
        text: {
          default: { value: { base: '{colors.neutral.900}', _dark: '{colors.neutral.50}' } },
          muted: { value: { base: '{colors.neutral.600}', _dark: '{colors.neutral.400}' } },
          subtle: { value: { base: '{colors.neutral.500}', _dark: '{colors.neutral.500}' } },
        },
        // Primary brand color
        brand: {
          default: { value: { base: '{colors.primary.600}', _dark: '{colors.primary.400}' } },
          emphasis: { value: { base: '{colors.primary.700}', _dark: '{colors.primary.300}' } },
          subtle: { value: { base: '{colors.primary.50}', _dark: '{colors.primary.900}' } },
        },
        // Secondary accent color
        accent: {
          default: { value: { base: '{colors.secondary.600}', _dark: '{colors.secondary.400}' } },
          emphasis: { value: { base: '{colors.secondary.700}', _dark: '{colors.secondary.300}' } },
          subtle: { value: { base: '{colors.secondary.50}', _dark: '{colors.secondary.900}' } },
        },
        // Border colors
        border: {
          default: { value: { base: '{colors.neutral.200}', _dark: '{colors.neutral.600}' } },
          muted: { value: { base: '{colors.neutral.100}', _dark: '{colors.neutral.700}' } },
        },
      },
    },
    keyframes: {
      spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
    },
  },
  globalCss: {
    'html, body': {
      fontFamily: 'body',
    },
    'h1, h2, h3, h4, h5, h6': {
      fontFamily: 'heading',
    },
  },
})

export const system = createSystem(defaultConfig, config)
