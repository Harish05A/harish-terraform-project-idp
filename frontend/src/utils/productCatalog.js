const PRODUCT_DETAILS = {
  'LAPTOP-001': {
    name: 'MacBook Air M3',
    category: 'Electronics',
    description: '13-inch Apple laptop with M3 performance, all-day battery life, and a bright Liquid Retina display.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    rating_average: 4.8,
    rating_count: 184,
    createdRank: 10
  },
  'PHONE-001': {
    name: 'Samsung Galaxy S25',
    category: 'Smart Devices',
    description: 'Flagship Android phone with a sharp AMOLED display, pro-grade camera system, and fast charging.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    rating_average: 4.7,
    rating_count: 156,
    createdRank: 9
  },
  'TABLET-001': {
    name: 'iPad Air',
    category: 'Smart Devices',
    description: 'Lightweight tablet for streaming, sketching, note-taking, and productivity on the go.',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
    rating_average: 4.6,
    rating_count: 121,
    createdRank: 8
  },
  'WATCH-001': {
    name: 'Apple Watch Series 10',
    category: 'Accessories',
    description: 'Slim smartwatch with health insights, fitness tracking, and seamless phone notifications.',
    imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=900&q=80',
    rating_average: 4.5,
    rating_count: 98,
    createdRank: 7
  },
  'AIRPODS-001': {
    name: 'Sony WH-1000XM5',
    category: 'Audio',
    description: 'Premium wireless headphones with excellent noise cancellation and rich everyday sound.',
    imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=900&q=80',
    rating_average: 4.9,
    rating_count: 203,
    createdRank: 6
  },
  'MONITOR-001': {
    name: 'Dell UltraSharp 32 4K Monitor',
    category: 'Electronics',
    description: 'Color-accurate 4K display with USB-C connectivity for clean desk setups and creative work.',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
    rating_average: 4.4,
    rating_count: 77,
    createdRank: 5
  }
}

const CATEGORY_BY_KEYWORD = [
  ['headphone', 'Audio'],
  ['speaker', 'Audio'],
  ['earbud', 'Audio'],
  ['watch', 'Accessories'],
  ['keyboard', 'Accessories'],
  ['mouse', 'Accessories'],
  ['phone', 'Smart Devices'],
  ['tablet', 'Smart Devices'],
  ['ipad', 'Smart Devices'],
  ['kindle', 'Smart Devices'],
  ['laptop', 'Electronics'],
  ['monitor', 'Electronics']
]

export function enrichProduct(product) {
  const details = PRODUCT_DETAILS[product.product_id] || {}
  const productName = details.name || product.name || 'Product'
  const searchableName = productName.toLowerCase()
  const inferredCategory = CATEGORY_BY_KEYWORD.find(([keyword]) => searchableName.includes(keyword))?.[1]
  const ratingAverage = Number(product.rating_average ?? product.rating ?? details.rating_average ?? 4.3)
  const ratingCount = Number(product.rating_count ?? details.rating_count ?? 0)

  return {
    ...product,
    ...details,
    name: productName,
    description: details.description || product.description,
    category: details.category || product.category || inferredCategory || 'Accessories',
    imageUrl: details.imageUrl || product.image_url || product.imageUrl || 'https://plus.unsplash.com/premium_vector-1727134126399-ee77d346d73a?q=80&w=1022&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    rating_average: ratingAverage,
    rating: ratingAverage,
    rating_count: ratingCount,
    createdRank: details.createdRank || Number(product.created_at || product.createdRank || 0)
  }
}

export const priceRanges = [
  { label: 'All Prices', value: 'all', min: 0, max: Infinity },
  { label: 'Under $300', value: 'under-300', min: 0, max: 300 },
  { label: '$300 - $900', value: '300-900', min: 300, max: 900 },
  { label: '$900 - $1,500', value: '900-1500', min: 900, max: 1500 },
  { label: '$1,500+', value: '1500-plus', min: 1500, max: Infinity }
]
