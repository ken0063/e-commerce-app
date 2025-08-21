import { AbsoluteCenter, Spinner } from '@chakra-ui/react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { handlePostAuth } from '@/lib/supabase/auth'
import { toaster } from '@/utils'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        await handlePostAuth()
        navigate('/', { replace: true })
      } catch (e) {
        console.error(e)

        toaster.create({
          type: 'error',
          title: 'Authentication failed',
          description: e,
          closable: true,
        })
        navigate('/auth', { replace: true })
      }
    })()
  }, [navigate])

  return (
    <AbsoluteCenter color="text">
      <Spinner size="lg" />
    </AbsoluteCenter>
  )
}

// React Router v7 lazy route module support
export { AuthCallbackPage as Component }
