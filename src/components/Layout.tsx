import {
  Box,
  Container,
  Flex,
  IconButton,
  Text,
  HStack,
  Button,
  Spacer,
  useDisclosure,
  Drawer,
  Stack,
  Separator,
} from '@chakra-ui/react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { FaShoppingCart, FaSearch, FaHeart } from 'react-icons/fa'
import { IoMenu } from 'react-icons/io5'
import { ColorModeToggleGroup } from './ui/color-mode'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from './ui/menu'
import { Avatar } from './ui/avatar'
import { Badge } from './ui/badge'

export function Layout() {
  const [user, setUser] = useState<User | null>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  const navigate = useNavigate()
  const mobileNav = useDisclosure()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadCartItemCount(user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadCartItemCount(session.user.id)
      } else {
        setCartItemCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadCartItemCount = async (userId: string) => {
    try {
      // Get the user's active cart
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (!cart) {
        setCartItemCount(0)
        return
      }

      const { data: items, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('cart_id', cart.id)

      if (!error && items) {
        const total = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
        setCartItemCount(total)
      } else {
        setCartItemCount(0)
      }
    } catch (e) {
      console.error('Failed to load cart count', e)
      setCartItemCount(0)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <Flex direction="column" minH="100vh">
      {/* Navigation Header */}
      <Box
        as="header"
        borderBottomWidth="1px"
        position="sticky"
        top="0"
        zIndex="sticky"
        bg="bg/80"
        backdropFilter="blur(10px)"
      >
        <Container maxW={{ base: 'full', xl: 'container.xl' }} py={4}>
          <Flex align="center" gap={4}>
            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                ShopHub
              </Text>
            </Link>

            {/* Desktop Navigation */}
            <HStack display={{ base: 'none', md: 'flex' }} gap={6} ml={8}>
              <Link to="/products">Products</Link>
              <Link to="/categories">Categories</Link>
              <Link to="/deals">Deals</Link>
              <Link to="/new-arrivals">New Arrivals</Link>
            </HStack>

            <Spacer />

            {/* Actions */}
            <HStack gap={2}>
              <IconButton aria-label="Search" variant="ghost" onClick={() => navigate('/search')}>
                <FaSearch />
              </IconButton>

              {user && (
                <IconButton
                  aria-label="Wishlist"
                  variant="ghost"
                  onClick={() => navigate('/wishlist')}
                >
                  <FaHeart />
                </IconButton>
              )}

              <Box position="relative">
                <IconButton aria-label="Cart" variant="ghost" onClick={() => navigate('/cart')}>
                  <FaShoppingCart />
                </IconButton>
                {cartItemCount > 0 && (
                  <Badge
                    colorPalette="brand"
                    size="xs"
                    position="absolute"
                    top="-1"
                    right="-1"
                    borderRadius="full"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Box>

              {user ? (
                <MenuRoot>
                  <MenuTrigger asChild>
                    <Button variant="ghost" size="sm" p={1}>
                      <Avatar size="sm" name={user.email} />
                    </Button>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem value="account" onClick={() => navigate('/account')}>
                      My Account
                    </MenuItem>
                    <MenuItem value="orders" onClick={() => navigate('/orders')}>
                      Orders
                    </MenuItem>
                    <MenuItem value="addresses" onClick={() => navigate('/addresses')}>
                      Addresses
                    </MenuItem>
                    <MenuItem value="signout" onClick={handleSignOut} color="fg.error">
                      Sign Out
                    </MenuItem>
                  </MenuContent>
                </MenuRoot>
              ) : (
                <Button
                  variant="solid"
                  colorPalette="brand"
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              )}

              {/* Show color mode buttons inline only on xl+ */}
              <HStack display={{ base: 'none', lg: 'none', xl: 'flex' }}>
                <ColorModeToggleGroup />
              </HStack>

              {/* Mobile Menu */}
              <IconButton
                aria-label="Menu"
                variant="ghost"
                display={{ base: 'flex', md: 'none' }}
                onClick={mobileNav.onOpen}
              >
                <IoMenu />
              </IconButton>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Nav Drawer */}
      <Drawer.Root
        open={mobileNav.open}
        onOpenChange={({ open }) => (open ? mobileNav.onOpen() : mobileNav.onClose())}
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger />
            <Drawer.Header>Menu</Drawer.Header>
            <Drawer.Body>
              <Stack gap={4}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    mobileNav.onClose()
                    navigate('/products')
                  }}
                >
                  Products
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    mobileNav.onClose()
                    navigate('/categories')
                  }}
                >
                  Categories
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    mobileNav.onClose()
                    navigate('/deals')
                  }}
                >
                  Deals
                </Button>
                <Separator />
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        mobileNav.onClose()
                        navigate('/account')
                      }}
                    >
                      My Account
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        mobileNav.onClose()
                        navigate('/orders')
                      }}
                    >
                      Orders
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        mobileNav.onClose()
                        navigate('/addresses')
                      }}
                    >
                      Addresses
                    </Button>
                    <Button variant="outline" colorPalette="brand" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    colorPalette="brand"
                    onClick={() => {
                      mobileNav.onClose()
                      navigate('/auth')
                    }}
                  >
                    Sign In
                  </Button>
                )}
                <Separator />
                <Button
                  variant="ghost"
                  onClick={() => {
                    mobileNav.onClose()
                    navigate('/cart')
                  }}
                >
                  <HStack gap={2}>
                    <FaShoppingCart />
                    <span>Cart</span>
                    {cartItemCount > 0 && (
                      <Badge colorPalette="brand" size="xs">
                        {cartItemCount}
                      </Badge>
                    )}
                  </HStack>
                </Button>

                {/* Appearance controls for mobile/tablet */}
                <Separator />
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Appearance
                  </Text>
                  <ColorModeToggleGroup />
                </Box>
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      {/* Main Content */}
      <Box flex="1">
        <Outlet />
      </Box>

      {/* Footer */}
      <Box as="footer" bg="bg.subtle" borderTopWidth="1px" mt={16}>
        <Container maxW={{ base: 'full', xl: 'container.xl' }} py={8}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
            <Box flex="1">
              <Text fontSize="xl" fontWeight="bold" color="brand.500" mb={2}>
                ShopHub
              </Text>
              <Text color="fg.muted" fontSize="sm">
                Your one-stop shop for everything you need
              </Text>
            </Box>

            <HStack gap={8} align="start">
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Shop
                </Text>
                <Flex direction="column" gap={1}>
                  <Link to="/products">All Products</Link>
                  <Link to="/categories">Categories</Link>
                  <Link to="/deals">Deals</Link>
                </Flex>
              </Box>

              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Support
                </Text>
                <Flex direction="column" gap={1}>
                  <Link to="/contact">Contact Us</Link>
                  <Link to="/shipping">Shipping Info</Link>
                  <Link to="/returns">Returns</Link>
                </Flex>
              </Box>

              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Account
                </Text>
                <Flex direction="column" gap={1}>
                  <Link to="/account">My Account</Link>
                  <Link to="/orders">Order History</Link>
                  <Link to="/wishlist">Wishlist</Link>
                </Flex>
              </Box>
            </HStack>
          </Flex>

          <Box mt={8} pt={8} borderTopWidth="1px">
            <Text fontSize="sm" color="fg.muted" textAlign="center">
              © 2025 ShopHub. All rights reserved.
            </Text>
          </Box>
        </Container>
      </Box>
    </Flex>
  )
}
