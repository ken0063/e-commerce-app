import { Menu as ChakraMenu, Portal } from '@chakra-ui/react'
import { forwardRef } from 'react'

export interface MenuContentProps extends ChakraMenu.ContentProps {
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
}

export const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>((props, ref) => {
  const { portalled = true, portalRef, ...rest } = props
  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraMenu.Positioner>
        <ChakraMenu.Content ref={ref} {...rest} />
      </ChakraMenu.Positioner>
    </Portal>
  )
})

MenuContent.displayName = 'MenuContent'

export const MenuArrow = ChakraMenu.Arrow
export const MenuArrowTip = ChakraMenu.ArrowTip
export const MenuCheckboxItem = ChakraMenu.CheckboxItem
export const MenuContextTrigger = ChakraMenu.ContextTrigger
export const MenuIndicator = ChakraMenu.Indicator
export const MenuItem = ChakraMenu.Item
export const MenuItemCommand = ChakraMenu.ItemCommand
export const MenuItemGroup = ChakraMenu.ItemGroup
export const MenuItemGroupLabel = ChakraMenu.ItemGroupLabel
export const MenuItemIndicator = ChakraMenu.ItemIndicator
export const MenuItemText = ChakraMenu.ItemText
export const MenuRadioItem = ChakraMenu.RadioItem
export const MenuRadioItemGroup = ChakraMenu.RadioItemGroup
export const MenuRoot = ChakraMenu.Root
export const MenuSeparator = ChakraMenu.Separator
export const MenuTrigger = ChakraMenu.Trigger
export const MenuTriggerItem = ChakraMenu.TriggerItem
