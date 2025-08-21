import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Image,
  Flex,
  Card,
  SimpleGrid,
  Input,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FaShoppingCart, FaTrash, FaMinus, FaPlus } from 'react-icons/fa'
import { toaster } from '@/utils'
import { Badge } from '@/components/ui/badge'
import type { User } from '@supabase/supabase-js'

interface CartItem {
  id: string
  quantity: number
  unit_price: number
  currency: string
  product?: {
    id: string
    name: string
    slug: string
    description: string
    images?: { url: string; alt: string }[]
  }
  variant?: {
    id: string
    name: string
    sku: string
  }
}

interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  amount: number
  starts_at?: string | null
  ends_at?: string | null
}

export function Component() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const loadCart = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      // Get active cart
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (!cart) {
        setCartItems([])
        return
      }

      // Get cart items with product details
      const { data: items, error } = await supabase
        .from('cart_items')
        .select(
          `
          *,
          product:products(
            id,
            name,
            slug,
            description,
            images:product_images(url, alt)
          ),
          variant:product_variants(
            id,
            name,
            sku
          )
        `,
        )
        .eq('cart_id', cart.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCartItems(items || [])
    } catch (error) {
      console.error('Error loading cart:', error)
      toaster.create({
        title: 'Error loading cart',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      navigate('/auth')
      return
    }
    setUser(user)
    loadCart(user.id)
  }, [loadCart, navigate])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
      return
    }

    setUpdating(itemId)
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error

      setCartItems((items) =>
        items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)),
      )
    } catch (error) {
      console.error('Error updating quantity:', error)
      toaster.create({
        title: 'Error updating quantity',
        type: 'error',
      })
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId)

      if (error) throw error

      setCartItems((items) => items.filter((item) => item.id !== itemId))

      toaster.create({
        title: 'Item removed from cart',
        type: 'info',
      })
    } catch (error) {
      console.error('Error removing item:', error)
      toaster.create({
        title: 'Error removing item',
        type: 'error',
      })
    } finally {
      setUpdating(null)
    }
  }

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return

    setLoading(true)
    try {
      // Get cart id
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single()

      if (!cart) return

      // Delete all cart items
      const { error } = await supabase.from('cart_items').delete().eq('cart_id', cart.id)

      if (error) throw error

      setCartItems([])
      toaster.create({
        title: 'Cart cleared',
        type: 'info',
      })
    } catch (error) {
      console.error('Error clearing cart:', error)
      toaster.create({
        title: 'Error clearing cart',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        toaster.create({
          title: 'Invalid coupon code',
          type: 'error',
        })
        return
      }

      // Check if coupon is valid (dates, usage limits, etc.)
      const now = new Date()
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        toaster.create({
          title: 'Coupon not yet active',
          type: 'error',
        })
        return
      }

      if (coupon.ends_at && new Date(coupon.ends_at) < now) {
        toaster.create({
          title: 'Coupon has expired',
          type: 'error',
        })
        return
      }

      setAppliedCoupon(coupon as unknown as Coupon)
      toaster.create({
        title: 'Coupon applied successfully',
        description: `${coupon.type === 'percentage' ? coupon.amount + '%' : '$' + coupon.amount} discount applied`,
        type: 'success',
      })
    } catch (error) {
      console.error('Error applying coupon:', error)
      toaster.create({
        title: 'Error applying coupon',
        type: 'error',
      })
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  }

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0
    const subtotal = calculateSubtotal()

    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.amount) / 100
    } else {
      return Math.min(appliedCoupon.amount, subtotal)
    }
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    return Math.max(0, subtotal - discount)
  }

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toaster.create({
        title: 'Cart is empty',
        description: 'Add some items to your cart before checking out',
        type: 'warning',
      })
      return
    }

    // Store coupon in session storage for checkout
    if (appliedCoupon) {
      sessionStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon))
    }

    navigate('/checkout')
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Card.Root h="400px" />
      </Container>
    )
  }

  return (
    <Box py={8}>
      <Container maxW="container.xl">
        <Heading size="2xl" mb={8}>
          Shopping Cart
        </Heading>

        {cartItems.length === 0 ? (
          <Card.Root p={16}>
            <Card.Body>
              <VStack gap={4}>
                <FaShoppingCart size="60" color="gray" />
                <Heading size="lg">Your cart is empty</Heading>
                <Text color="fg.muted">Add some products to get started!</Text>
                <Button colorPalette="brand" onClick={() => navigate('/products')}>
                  Browse Products
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8}>
            {/* Cart Items */}
            <Box gridColumn={{ base: '1', lg: 'span 2' }}>
              <VStack gap={4} align="stretch">
                {cartItems.map((item) => (
                  <Card.Root key={item.id}>
                    <Card.Body>
                      <HStack gap={4} align="start">
                        {/* Product Image */}
                        <Box w="100px" h="100px" bg="gray.100" borderRadius="md" flexShrink={0}>
                          {item.product?.images?.[0] ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.images[0].alt || item.product.name}
                              w="full"
                              h="full"
                              objectFit="cover"
                              borderRadius="md"
                            />
                          ) : (
                            <Flex h="full" align="center" justify="center">
                              <FaShoppingCart size="30" color="gray" />
                            </Flex>
                          )}
                        </Box>

                        {/* Product Details */}
                        <VStack align="start" flex="1" gap={2}>
                          <Text
                            fontWeight="semibold"
                            cursor="pointer"
                            onClick={() => navigate(`/products/${item.product?.id}`)}
                            _hover={{ textDecoration: 'underline' }}
                          >
                            {item.product?.name}
                          </Text>
                          {item.variant && (
                            <Badge colorPalette="gray" variant="subtle">
                              {item.variant.name}
                            </Badge>
                          )}
                          <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                            {item.product?.description}
                          </Text>
                          <Text fontSize="lg" fontWeight="bold" color="brand.500">
                            ${item.unit_price}
                          </Text>
                        </VStack>

                        {/* Quantity Controls */}
                        <VStack gap={2}>
                          <HStack>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating === item.id}
                            >
                              <FaMinus />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.id, parseInt(e.target.value) || 1)
                              }
                              w="50px"
                              size="sm"
                              textAlign="center"
                              disabled={updating === item.id}
                            />
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id}
                            >
                              <FaPlus />
                            </Button>
                          </HStack>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                          >
                            <HStack gap={1}>
                              <FaTrash />
                              <span>Remove</span>
                            </HStack>
                          </Button>
                        </VStack>
                      </HStack>
                    </Card.Body>
                  </Card.Root>
                ))}

                <Button variant="outline" onClick={clearCart}>
                  <HStack gap={2}>
                    <FaTrash />
                    <span>Clear Cart</span>
                  </HStack>
                </Button>
              </VStack>
            </Box>

            {/* Order Summary */}
            <Box>
              <Card.Root position="sticky" top="80px">
                <Card.Header>
                  <Heading size="lg">Order Summary</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4} align="stretch">
                    {/* Coupon Code */}
                    <Box>
                      <Text fontWeight="semibold" mb={2}>
                        Coupon Code
                      </Text>
                      <HStack>
                        <Input
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          disabled={!!appliedCoupon}
                        />
                        {appliedCoupon ? (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAppliedCoupon(null)
                              setCouponCode('')
                            }}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button onClick={applyCoupon}>Apply</Button>
                        )}
                      </HStack>
                      {appliedCoupon && (
                        <Text fontSize="sm" color="green.500" mt={1}>
                          {appliedCoupon.type === 'percentage'
                            ? `${appliedCoupon.amount}% discount applied`
                            : `$${appliedCoupon.amount} discount applied`}
                        </Text>
                      )}
                    </Box>

                    {/* Price Breakdown */}
                    <VStack align="stretch" gap={2} pt={4} borderTopWidth="1px">
                      <HStack justify="space-between">
                        <Text>Subtotal ({cartItems.length} items)</Text>
                        <Text fontWeight="semibold">${calculateSubtotal().toFixed(2)}</Text>
                      </HStack>

                      {appliedCoupon && (
                        <HStack justify="space-between" color="green.500">
                          <Text>Discount</Text>
                          <Text fontWeight="semibold">-${calculateDiscount().toFixed(2)}</Text>
                        </HStack>
                      )}

                      <HStack justify="space-between">
                        <Text>Shipping</Text>
                        <Text fontWeight="semibold">Calculated at checkout</Text>
                      </HStack>

                      <HStack
                        justify="space-between"
                        fontSize="lg"
                        fontWeight="bold"
                        pt={2}
                        borderTopWidth="1px"
                      >
                        <Text>Total</Text>
                        <Text color="brand.500">${calculateTotal().toFixed(2)}</Text>
                      </HStack>
                    </VStack>

                    {/* Checkout Button */}
                    <Button colorPalette="brand" size="lg" onClick={proceedToCheckout} w="full">
                      Proceed to Checkout
                    </Button>

                    <Button variant="outline" onClick={() => navigate('/products')} w="full">
                      Continue Shopping
                    </Button>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </Box>
          </SimpleGrid>
        )}
      </Container>
    </Box>
  )
}
