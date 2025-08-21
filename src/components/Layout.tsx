import { Box, Container, Flex, IconButton, Text, HStack, Button, Spacer } from '@chakra-ui/react'
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
import { Toaster } from './ui/toaster'

export function Layout() {
  const [user, setUser] = useState<User | null>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  const navigate = useNavigate()

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
    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity', { count: 'exact' })
      .eq('cart_id', userId)

    if (!error && data) {
      const total = data.reduce((sum, item) => sum + item.quantity, 0)
      setCartItemCount(total)
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
        <Container maxW="container.xl" py={4}>
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

              <ColorModeToggleGroup />

              {/* Mobile Menu */}
              <IconButton aria-label="Menu" variant="ghost" display={{ base: 'flex', md: 'none' }}>
                <IoMenu />
              </IconButton>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box flex="1">
        <Outlet />
        {/* Global toaster for consistent feedback */}
        <Toaster />
      </Box>

      {/* Footer */}
      <Box as="footer" bg="bg.subtle" borderTopWidth="1px" mt={16}>
        <Container maxW="container.xl" py={8}>
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
