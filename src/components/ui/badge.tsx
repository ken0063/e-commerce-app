import { Badge as ChakraBadge, type BadgeProps as ChakraBadgeProps } from '@chakra-ui/react'
import { forwardRef } from 'react'

export interface BadgeProps extends ChakraBadgeProps {
  children?: React.ReactNode
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>((props, ref) => {
  return <ChakraBadge ref={ref} {...props} />
})

Badge.displayName = 'Badge'
