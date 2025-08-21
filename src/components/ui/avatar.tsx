import { Avatar as ChakraAvatar } from '@chakra-ui/react'
import { forwardRef } from 'react'

export interface AvatarProps extends Omit<ChakraAvatar.RootProps, 'asChild'> {
  name?: string
  src?: string
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>((props, ref) => {
  const { name, src, ...rest } = props
  return (
    <ChakraAvatar.Root ref={ref} {...rest}>
      <ChakraAvatar.Fallback>{name?.charAt(0).toUpperCase()}</ChakraAvatar.Fallback>
      <ChakraAvatar.Image src={src} />
    </ChakraAvatar.Root>
  )
})

Avatar.displayName = 'Avatar'
