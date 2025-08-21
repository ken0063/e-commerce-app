import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Box, Container, Heading, Text, Button, VStack } from '@chakra-ui/react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)

    // You can log the error to an error reporting service here
    // Example: Sentry.captureException(error)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxW="container.md" py={16}>
          <VStack gap={6} textAlign="center">
            <Box>
              <Heading size="2xl" mb={4}>
                Oops! Something went wrong
              </Heading>
              <Text color="fg.muted" fontSize="lg">
                We're sorry for the inconvenience. The error has been logged and we'll look into it.
              </Text>
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box w="full" p={4} bg="red.50" borderRadius="md" textAlign="left">
                <Text fontFamily="mono" fontSize="sm" color="red.700">
                  {this.state.error.toString()}
                </Text>
                {this.state.error.stack && (
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    color="red.600"
                    mt={2}
                    whiteSpace="pre-wrap"
                  >
                    {this.state.error.stack}
                  </Text>
                )}
              </Box>
            )}

            <VStack gap={3}>
              <Button colorPalette="brand" onClick={this.handleReset}>
                Go to Homepage
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </VStack>
          </VStack>
        </Container>
      )
    }

    return this.props.children
  }
}
