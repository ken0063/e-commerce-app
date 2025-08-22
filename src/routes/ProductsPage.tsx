import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Button,
  VStack,
  HStack,
  Image,
  Flex,
  Card,
  Input,
  Stack,
} from '@chakra-ui/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FaShoppingCart, FaFilter } from 'react-icons/fa'
import { Badge } from '@/components/ui/badge'
import { toaster } from '@/utils'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  base_price: number
  currency: string
  images?: { url: string; alt: string }[]
  category?: { id: string; name: string; slug: string }
}

interface Category {
  id: string
  name: string
  slug: string
}

export function Component() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name')
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || '',
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    setCategories(data || [])
  }

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          images:product_images(url, alt),
          category:categories!inner(id, name, slug)
        `,
          { count: 'exact' },
        )
        .eq('status', 'published')
        .eq('is_active', true)

      // Apply filters
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      if (selectedCategory) {
        query = query.eq('category.slug', selectedCategory)
      }

      if (priceRange.min) {
        query = query.gte('base_price', priceRange.min)
      }

      if (priceRange.max) {
        query = query.lte('base_price', priceRange.max)
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('base_price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('base_price', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        default:
          query = query.order('name', { ascending: true })
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, count, error } = await query

      if (error) throw error

      setProducts(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading products:', error)
      toaster.create({
        title: 'Error loading products',
        description: 'Please try again later',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, selectedCategory, sortBy, priceRange.min, priceRange.max])

  useEffect(() => {
    loadProducts()
  }, [searchParams, currentPage, loadProducts])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (sortBy !== 'name') params.set('sort', sortBy)
    if (priceRange.min) params.set('min_price', priceRange.min)
    if (priceRange.max) params.set('max_price', priceRange.max)

    setSearchParams(params)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSortBy('name')
    setPriceRange({ min: '', max: '' })
    setSearchParams({})
    setCurrentPage(1)
  }

  const addToCart = async (product: Product) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/auth')
      return
    }

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

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', product.id)
        .single()

      if (existingItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id)
      } else {
        // Add new item
        await supabase.from('cart_items').insert({
          cart_id: cart.id,
          product_id: product.id,
          quantity: 1,
          unit_price: product.base_price,
          currency: product.currency,
        })
      }

      toaster.create({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart`,
        type: 'success',
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toaster.create({
        title: 'Error',
        description: 'Could not add item to cart',
        type: 'error',
      })
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <Box py={8}>
      <Container maxW={{ base: 'full', xl: 'container.xl' }}>
        <VStack gap={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="2xl" mb={2}>
              All Products
            </Heading>
            <Text color="fg.muted">{totalCount} products available</Text>
          </Box>

          {/* Filters */}
          <Card.Root>
            <Card.Body>
              <VStack gap={4}>
                {/* Mobile: condensed row with toggle */}
                <HStack w="full" gap={2} display={{ base: 'flex', md: 'none' }}>
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button colorPalette="brand" onClick={handleSearch}>
                    Search
                  </Button>
                </HStack>

                <Stack
                  direction={{ base: 'column', md: 'row' }}
                  gap={4}
                  align={{ base: 'stretch', md: 'center' }}
                  display={{ base: 'none', md: 'flex' }}
                >
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ minWidth: '200px', padding: '8px', borderRadius: 6 }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ minWidth: '150px', padding: '8px', borderRadius: 6 }}
                  >
                    <option value="name">Name</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </Stack>

                <Stack direction={{ base: 'column', md: 'row' }} gap={4} align="center">
                  <HStack w="full" gap={4}>
                    <Input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      maxW={{ base: 'full', md: '150px' }}
                    />
                    <Text display={{ base: 'none', md: 'block' }}>to</Text>
                    <Input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      maxW={{ base: 'full', md: '150px' }}
                    />
                  </HStack>
                  <HStack gap={2} w={{ base: 'full', md: 'auto' }}>
                    <Button
                      colorPalette="brand"
                      onClick={handleSearch}
                      w={{ base: 'full', md: 'auto' }}
                    >
                      <HStack gap={2}>
                        <FaFilter /> <span>Apply</span>
                      </HStack>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      w={{ base: 'full', md: 'auto' }}
                    >
                      Clear
                    </Button>
                  </HStack>
                </Stack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Products Grid */}
          {loading ? (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} gap={4}>
              {[...Array(12)].map((_, i) => (
                <Card.Root key={i} h="350px" />
              ))}
            </SimpleGrid>
          ) : products.length === 0 ? (
            <Card.Root p={16}>
              <Card.Body>
                <VStack>
                  <Text fontSize="lg" color="fg.muted">
                    No products found
                  </Text>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} gap={4}>
              {products.map((product) => (
                <Card.Root
                  key={product.id}
                  overflow="hidden"
                  cursor="pointer"
                  _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                  transition="all 0.2s"
                >
                  <Box
                    position="relative"
                    h={{ base: '160px', md: '200px' }}
                    bg="gray.100"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    ) : (
                      <Flex h="full" align="center" justify="center">
                        <FaShoppingCart size="40" color="gray" />
                      </Flex>
                    )}
                    {product.category && (
                      <Badge
                        position="absolute"
                        top="2"
                        left="2"
                        colorPalette="brand"
                        variant="solid"
                      >
                        {product.category.name}
                      </Badge>
                    )}
                  </Box>
                  <Card.Body>
                    <VStack align="start" gap={2}>
                      <Text fontWeight="semibold" lineClamp={2}>
                        {product.name}
                      </Text>
                      <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                        {product.description}
                      </Text>
                      <HStack justify="space-between" w="full">
                        <Text fontSize="xl" fontWeight="bold" color="brand.500">
                          ${product.base_price}
                        </Text>
                        <Button
                          size="sm"
                          colorPalette="brand"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(product)
                          }}
                        >
                          <HStack gap={1}>
                            <FaShoppingCart />
                            <span>Add</span>
                          </HStack>
                        </Button>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <HStack justify="center" gap={2} wrap="wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'solid' : 'outline'}
                    colorPalette={currentPage === page ? 'brand' : undefined}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
              {totalPages > 5 && <Text>...</Text>}
              {totalPages > 5 && (
                <Button
                  variant={currentPage === totalPages ? 'solid' : 'outline'}
                  colorPalette={currentPage === totalPages ? 'brand' : undefined}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </HStack>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
