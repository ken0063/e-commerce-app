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
  Tabs,
  SimpleGrid,
  Badge,
  Input,
  Textarea,
  Stack,
} from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FaShoppingCart, FaHeart, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { toaster } from '@/utils'
import { Avatar } from '@/components/ui/avatar'
import type { User } from '@supabase/supabase-js'

interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  attributes: Record<string, unknown>
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  base_price: number
  currency: string
  metadata: Record<string, unknown>
  images?: { url: string; alt: string; position: number }[]
  category?: { id: string; name: string; slug: string }
  variants?: ProductVariant[]
}

interface Review {
  id: string
  rating: number
  title: string
  content: string
  created_at: string
  user?: { full_name: string; email: string }
}

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')

  const checkWishlist = useCallback(
    async (userId: string) => {
      if (!id) return

      try {
        const { data } = await supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', id)
          .single()

        setIsWishlisted(!!data)
      } catch (error) {
        console.error(error)
      }
    },
    [id],
  )

  const checkAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      checkWishlist(user.id)
    }
  }, [checkWishlist])

  const loadProduct = useCallback(async () => {
    if (!id) return

    setLoading(true)
    try {
      const { data: productData, error } = await supabase
        .from('products')
        .select(
          `
          *,
          images:product_images(url, alt, position),
          category:categories(id, name, slug),
          variants:product_variants(*)
        `,
        )
        .eq('id', id)
        .single()

      if (error) throw error

      setProduct(productData as unknown as Product)

      // Sort images by position
      if (productData?.images) {
        ;(productData.images as { url: string; alt: string; position: number }[]).sort(
          (a, b) => a.position - b.position,
        )
      }

      // Set default variant if available
      if (productData?.variants?.length > 0) {
        setSelectedVariant((productData.variants as ProductVariant[])[0])
      }

      // Load reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(
          `
          *,
          user:profiles(full_name, email)
        `,
        )
        .eq('product_id', id)
        .order('created_at', { ascending: false })

      setReviews((reviewsData || []) as unknown as Review[])
    } catch (error) {
      console.error('Error loading product:', error)
      toaster.create({
        title: 'Error loading product',
        description: 'Product not found',
        type: 'error',
      })
      navigate('/products')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadProduct()
    checkAuth()
  }, [id, loadProduct, checkAuth])

  const addToCart = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    if (!product) return

    try {
      // Get or create active cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: user.id, status: 'active' })
          .select('id')
          .single()
        cart = newCart
      }

      if (!cart) throw new Error('Could not create cart')

      const price = selectedVariant?.price || product.base_price

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', product.id)
        .eq('variant_id', selectedVariant?.id || null)
        .single()

      if (existingItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id)
      } else {
        // Add new item
        await supabase.from('cart_items').insert({
          cart_id: cart.id,
          product_id: product.id,
          variant_id: selectedVariant?.id || null,
          quantity: quantity,
          unit_price: price,
          currency: product.currency,
        })
      }

      toaster.create({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart`,
        type: 'success',
      })

      // Reset quantity
      setQuantity(1)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toaster.create({
        title: 'Error',
        description: 'Could not add item to cart',
        type: 'error',
      })
    }
  }

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    if (!product) return

    try {
      if (isWishlisted) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id)

        setIsWishlisted(false)
        toaster.create({
          title: 'Removed from wishlist',
          type: 'info',
        })
      } else {
        await supabase.from('wishlists').insert({
          user_id: user.id,
          product_id: product.id,
        })

        setIsWishlisted(true)
        toaster.create({
          title: 'Added to wishlist',
          type: 'success',
        })
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    }
  }

  const submitReview = async () => {
    if (!user || !product) return

    try {
      await supabase.from('reviews').insert({
        user_id: user.id,
        product_id: product.id,
        rating: reviewRating,
        title: reviewTitle,
        content: reviewComment,
      })

      toaster.create({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
        type: 'success',
      })

      // Reset form
      setShowReviewForm(false)
      setReviewRating(5)
      setReviewTitle('')
      setReviewComment('')

      // Reload reviews
      loadProduct()
    } catch (error) {
      console.error('Error submitting review:', error)
      toaster.create({
        title: 'Error',
        description: 'Could not submit review',
        type: 'error',
      })
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} color="#FFB800" />)
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" color="#FFB800" />)
    }

    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} color="#FFB800" />)
    }

    return stars
  }

  const currentPrice = selectedVariant?.price || product?.base_price || 0
  const inStock = selectedVariant ? selectedVariant.stock > 0 : true

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Card.Root h="400px" />
      </Container>
    )
  }

  if (!product) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Product not found</Text>
      </Container>
    )
  }

  return (
    <Box py={8}>
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} mb={12}>
          {/* Image Gallery */}
          <VStack gap={4}>
            <Box
              position="relative"
              w="full"
              h={{ base: '300px', md: '450px' }}
              bg="gray.100"
              borderRadius="lg"
              overflow="hidden"
            >
              {product.images?.[selectedImage] ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.images[selectedImage].alt || product.name}
                  w="full"
                  h="full"
                  objectFit="contain"
                />
              ) : (
                <Flex h="full" align="center" justify="center">
                  <FaShoppingCart size="60" color="gray" />
                </Flex>
              )}
            </Box>

            {product.images && product.images.length > 1 && (
              <HStack gap={2} overflowX="auto" w="full">
                {product.images.map((img, idx) => (
                  <Box
                    key={idx}
                    w="80px"
                    h="80px"
                    borderRadius="md"
                    overflow="hidden"
                    cursor="pointer"
                    border="2px solid"
                    borderColor={selectedImage === idx ? 'brand.500' : 'transparent'}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <Image src={img.url} alt={img.alt} w="full" h="full" objectFit="cover" />
                  </Box>
                ))}
              </HStack>
            )}
          </VStack>

          {/* Product Info */}
          <VStack align="start" gap={6}>
            {product.category && (
              <Badge colorPalette="brand" variant="subtle">
                {product.category.name}
              </Badge>
            )}

            <Heading size="2xl">{product.name}</Heading>

            {reviews.length > 0 && (
              <HStack>
                <HStack gap={1}>{renderStars(averageRating)}</HStack>
                <Text fontSize="sm" color="fg.muted">
                  ({reviews.length} reviews)
                </Text>
              </HStack>
            )}

            <Text fontSize="3xl" fontWeight="bold" color="brand.500">
              ${currentPrice}
            </Text>

            <Text color="fg.muted">{product.description}</Text>

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <Box w="full">
                <Text fontWeight="semibold" mb={2}>
                  Select Option:
                </Text>
                <select
                  value={selectedVariant?.id}
                  onChange={(e) => {
                    const variant = product.variants?.find(
                      (v) => v.id === (e.target as HTMLSelectElement).value,
                    )
                    setSelectedVariant(variant || null)
                  }}
                  style={{ padding: '8px', borderRadius: 6 }}
                >
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} - ${variant.price} ({variant.stock} in stock)
                    </option>
                  ))}
                </select>
              </Box>
            )}

            {/* Quantity Selector */}
            <Stack direction={{ base: 'column', sm: 'row' }} gap={2} align="center">
              <Text fontWeight="semibold">Quantity:</Text>
              <HStack>
                <Button size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  w="60px"
                  textAlign="center"
                />
                <Button size="sm" onClick={() => setQuantity(quantity + 1)}>
                  +
                </Button>
              </HStack>
            </Stack>

            {/* Stock Status */}
            <Badge colorPalette={inStock ? 'green' : 'red'} variant="solid">
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>

            {/* Action Buttons */}
            <Stack direction={{ base: 'column', sm: 'row' }} gap={3} w="full">
              <Button
                colorPalette="brand"
                size="lg"
                onClick={addToCart}
                disabled={!inStock}
                flex="1"
                w={{ base: 'full', sm: 'auto' }}
              >
                <HStack gap={2}>
                  <FaShoppingCart />
                  <span>Add to Cart</span>
                </HStack>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={toggleWishlist}
                colorPalette={isWishlisted ? 'red' : undefined}
                w={{ base: 'full', sm: 'auto' }}
              >
                <HStack gap={2}>
                  <FaHeart />
                  <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                </HStack>
              </Button>
            </Stack>

            {/* Product Details */}
            {product.metadata && Object.keys(product.metadata).length > 0 && (
              <Box w="full">
                <Heading size="md" mb={3}>
                  Product Details
                </Heading>
                <VStack align="start" gap={2}>
                  {Object.entries(product.metadata).map(([key, value]) => (
                    <HStack key={key} w="full">
                      <Text fontWeight="semibold" minW="120px">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                      </Text>
                      <Text>{String(value)}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </SimpleGrid>

        {/* Reviews Section */}
        <Tabs.Root defaultValue="reviews">
          <Tabs.List>
            <Tabs.Trigger value="reviews">Reviews ({reviews.length})</Tabs.Trigger>
            <Tabs.Trigger value="details">Additional Details</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="reviews">
            <VStack align="start" gap={6} py={6}>
              {user && (
                <Box w="full">
                  {!showReviewForm ? (
                    <Button onClick={() => setShowReviewForm(true)}>Write a Review</Button>
                  ) : (
                    <Card.Root>
                      <Card.Body>
                        <VStack gap={4} align="start">
                          <Heading size="md">Write Your Review</Heading>

                          <Box>
                            <Text mb={2}>Rating:</Text>
                            <HStack>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Box
                                  key={star}
                                  cursor="pointer"
                                  onClick={() => setReviewRating(star)}
                                >
                                  {star <= reviewRating ? (
                                    <FaStar color="#FFB800" size="20" />
                                  ) : (
                                    <FaRegStar color="#FFB800" size="20" />
                                  )}
                                </Box>
                              ))}
                            </HStack>
                          </Box>

                          <Input
                            placeholder="Review Title"
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                          />

                          <Textarea
                            placeholder="Write your review here..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={4}
                          />

                          <HStack>
                            <Button colorPalette="brand" onClick={submitReview}>
                              Submit Review
                            </Button>
                            <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                              Cancel
                            </Button>
                          </HStack>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  )}
                </Box>
              )}

              {reviews.length === 0 ? (
                <Text color="fg.muted">No reviews yet. Be the first to review!</Text>
              ) : (
                reviews.map((review) => (
                  <Card.Root key={review.id} w="full">
                    <Card.Body>
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          <Avatar name={review.user?.full_name || review.user?.email} size="sm" />
                          <VStack align="start" gap={0}>
                            <Text fontWeight="semibold">
                              {review.user?.full_name || 'Anonymous'}
                            </Text>
                            <HStack gap={1}>{renderStars(review.rating)}</HStack>
                          </VStack>
                        </HStack>
                        <Text fontSize="sm" color="fg.muted">
                          {new Date(review.created_at).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <Text fontWeight="semibold" mb={1}>
                        {review.title}
                      </Text>
                      <Text color="fg.muted">{review.content}</Text>
                    </Card.Body>
                  </Card.Root>
                ))
              )}
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="details">
            <Box py={6}>
              <Text color="fg.muted">
                Additional product details and specifications would go here.
              </Text>
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </Box>
  )
}
