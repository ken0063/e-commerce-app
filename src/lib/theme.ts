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
      colors: {
        brand: {
          '50': { value: '#f5faff' },
          '100': { value: '#dceeff' },
          '200': { value: '#b5dbff' },
          '300': { value: '#8ac7ff' },
          '400': { value: '#5ab3f7' },
          '500': { value: '#3498db' },
          '600': { value: '#2779bd' },
          '700': { value: '#1b5b9a' },
          '800': { value: '#124275' },
          '900': { value: '#0b2a4f' },
        },
        accent: {
          '50': { value: '#fff5f7' },
          '100': { value: '#fed7e2' },
          '200': { value: '#fbb6ce' },
          '300': { value: '#f687b3' },
          '400': { value: '#ed64a6' },
          '500': { value: '#d53f8c' },
          '600': { value: '#b83280' },
          '700': { value: '#97266d' },
          '800': { value: '#702459' },
          '900': { value: '#521b41' },
        },
        neutral: {
          '50': { value: '#fafafa' },
          '100': { value: '#f4f4f5' },
          '200': { value: '#e4e4e7' },
          '300': { value: '#d4d4d8' },
          '400': { value: '#a1a1aa' },
          '500': { value: '#71717a' },
          '600': { value: '#52525b' },
          '700': { value: '#3f3f46' },
          '800': { value: '#27272a' },
          '900': { value: '#18181b' },
        },
      },
      fonts: {
        heading: { value: "'Poppins', sans-serif" },
        body: { value: "'Inter', sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          value: { base: '{colors.neutral.50}', _dark: '{colors.neutral.900}' },
        },
        text: {
          value: { base: '{colors.neutral.800}', _dark: '{colors.neutral.100}' },
        },
        brandColor: {
          value: { base: '{colors.brand.500}', _dark: '{colors.brand.300}' },
        },
        accentColor: {
          value: { base: '{colors.accent.500}', _dark: '{colors.accent.300}' },
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
})

export const system = createSystem(defaultConfig, config)
