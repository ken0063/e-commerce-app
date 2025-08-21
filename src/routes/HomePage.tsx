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
  LinkBox,
  LinkOverlay,
} from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FaShoppingCart } from 'react-icons/fa'
import { Badge } from '@/components/ui/badge'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  base_price: number
  currency: string
  images?: { url: string; alt: string }[]
  category?: { name: string; slug: string }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export function HomePage() {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      // Load featured products with images
      const { data: products } = await supabase
        .from('products')
        .select(
          `
          *,
          images:product_images(url, alt),
          category:categories(name, slug)
        `,
        )
        .eq('status', 'published')
        .eq('is_active', true)
        .limit(8)

      // Load top categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('position')
        .limit(6)

      setFeaturedProducts(products || [])
      setCategories(cats || [])
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg="gradient.to-r"
        gradientFrom="brand.500"
        gradientTo="accent.500"
        color="white"
        py={{ base: 16, md: 24 }}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <Flex direction={{ base: 'column', lg: 'row' }} align="center" gap={8}>
            <VStack align={{ base: 'center', lg: 'start' }} flex="1" gap={6}>
              <Heading size={{ base: '3xl', md: '4xl' }} fontWeight="bold">
                Welcome to ShopHub
              </Heading>
              <Text fontSize={{ base: 'lg', md: 'xl' }} opacity={0.95}>
                Discover amazing products at unbeatable prices. Shop the latest trends and enjoy
                fast, free shipping on orders over $50.
              </Text>
              <HStack gap={4}>
                <Button
                  size="lg"
                  colorPalette="white"
                  variant="solid"
                  onClick={() => navigate('/products')}
                >
                  Shop Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="white"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => navigate('/deals')}
                >
                  View Deals
                </Button>
              </HStack>
            </VStack>
            <Box flex="1" display={{ base: 'none', lg: 'block' }}>
              <Image
                src="https://images.unsplash.com/photo-1472851294608-062f824d29cc"
                alt="Shopping"
                borderRadius="lg"
                boxShadow="2xl"
              />
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxW="container.xl" py={16}>
        <VStack gap={8}>
          <Box textAlign="center">
            <Heading size="2xl" mb={2}>
              Shop by Category
            </Heading>
            <Text color="fg.muted">Browse our wide selection of categories</Text>
          </Box>

          {loading ? (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4} w="full">
              {[...Array(6)].map((_, i) => (
                <Card.Root key={i} h="120px" />
              ))}
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4} w="full">
              {categories.map((category) => (
                <LinkBox
                  as={Card.Root}
                  key={category.id}
                  p={4}
                  textAlign="center"
                  cursor="pointer"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                  transition="all 0.2s"
                >
                  <Box mb={2}>
                    <FaShoppingCart size="20" color="var(--chakra-colors-brand-500)" />
                  </Box>
                  <LinkOverlay asChild>
                    <Link to={`/categories/${category.slug}`}>
                      <Text fontWeight="semibold">{category.name}</Text>
                    </Link>
                  </LinkOverlay>
                </LinkBox>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>

      {/* Featured Products Section */}
      <Box bg="bg.subtle" py={16}>
        <Container maxW="container.xl">
          <VStack gap={8}>
            <Box textAlign="center">
              <Heading size="2xl" mb={2}>
                Featured Products
              </Heading>
              <Text color="fg.muted">Check out our handpicked selection</Text>
            </Box>

            {loading ? (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6} w="full">
                {[...Array(8)].map((_, i) => (
                  <Card.Root key={i} h="350px" />
                ))}
              </SimpleGrid>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6} w="full">
                {featuredProducts.map((product) => (
                  <Card.Root
                    key={product.id}
                    overflow="hidden"
                    cursor="pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                    _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    <Box position="relative" h="200px" bg="gray.100">
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
                          <Button size="sm" colorPalette="brand" variant="ghost">
                            <FaShoppingCart />
                          </Button>
                        </HStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                ))}
              </SimpleGrid>
            )}

            <Button
              size="lg"
              colorPalette="brand"
              variant="outline"
              onClick={() => navigate('/products')}
            >
              View All Products →
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

// React Router v7 lazy route module support
export { HomePage as Component }
