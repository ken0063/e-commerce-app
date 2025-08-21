import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react'
import { signInWithOAuth } from '@/lib/supabase/auth'

export function AuthPage() {
  const startOAuth = async (provider: 'google' | 'github' | 'apple') => {
    await signInWithOAuth(provider, { redirectPath: '/auth/callback' })
  }

  return (
    <Box p={8} maxW="md" mx="auto" color="text">
      <Stack textAlign="center" gap={6}>
        <Heading size="lg">Sign in or Sign up</Heading>
        <Text color="text">Continue with a provider:</Text>
        <Stack direction="column" gap={3}>
          <Button colorPalette="brand" variant="solid" onClick={() => startOAuth('google')}>
            Continue with Google
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

// React Router v7 lazy route module support
export { AuthPage as Component }
