import { AbsoluteCenter } from '@chakra-ui/react'
import { ColorModeToggleGroup } from './components/ui/color-mode'

function App() {
  return (
    <>
      <header>
        <ColorModeToggleGroup />
      </header>
      <AbsoluteCenter>Hello world!!!!</AbsoluteCenter>
    </>
  )
}

export default App
