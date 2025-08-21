import * as React from 'react'
import { Button, type ButtonProps } from '@chakra-ui/react'
import { useColorModeValue } from '@/utils'

export interface ThemedButtonProps extends ButtonProps {
  highContrast?: boolean
}

/**
 * ThemedButton
 * - Uses Chakra v3 Button
 * - Defaults to colorPalette="brand"
 * - Reacts to color mode changes without overriding recipes via css prop
 * - Can boost contrast in dark mode with `highContrast`
 */
export const ThemedButton = React.forwardRef<HTMLButtonElement, ThemedButtonProps>(
  function ThemedButton(props, ref) {
    const {
      colorPalette = 'brand',
      variant: variantProp,
      highContrast = false,
      _hover: hoverProp,
      color: colorProp,
      children,
      ...rest
    } = props

    const defaultVariant = useColorModeValue<'solid' | 'solid'>('solid', 'solid')
    const variant = variantProp ?? defaultVariant

    // Precompute color-mode dependent values unconditionally to satisfy hooks rules
    const computedDarkHoverBg = useColorModeValue<string | undefined>(undefined, 'brand.400')
    const computedDarkTextColor = useColorModeValue<string | undefined>(undefined, 'white')

    const darkHoverBg = highContrast ? computedDarkHoverBg : undefined
    const darkTextColor = highContrast ? computedDarkTextColor : undefined

    const mergedHover = highContrast
      ? (hoverProp ?? (darkHoverBg ? { bg: darkHoverBg } : undefined))
      : hoverProp
    const mergedColor = highContrast ? (colorProp ?? darkTextColor) : colorProp

    return (
      <Button
        ref={ref}
        colorPalette={colorPalette}
        variant={variant}
        _hover={mergedHover}
        color={mergedColor}
        {...rest}
      >
        {children}
      </Button>
    )
  },
)

export default ThemedButton
