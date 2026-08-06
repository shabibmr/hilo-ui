import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    handle: 'blooming-roses',
    title: 'Blooming Roses',
    subtitle: 'Beginner Embroidery Experience Kit',
    description: 'Immerse yourself in a peaceful evening with our signature Blooming Roses embroidery kit. Crafted on soft washed linen with pre-printed vintage floral outlines, high-lustre metallic gold threads, and premium wooden hoop.',
    shortDescription: 'Vintage rose petals stitched with soft matte silk and golden highlights.',
    price: 1899,
    currencyCode: 'INR',
    difficulty: 'Beginner',
    estimatedHours: 4,
    images: [
      { url: '/hilo/images/products/blooming-roses-1.jpg', altText: 'Blooming Roses Completed Embroidery Hoop' },
      { url: '/hilo/images/products/blooming-roses-2.jpg', altText: 'Blooming Roses Kit Unboxed Content' }
    ],
    collections: ['diy-kits', 'best-sellers'],
    tags: ['floral', 'beginner', 'popular', 'gift'],
    variants: [
      { id: 'var-1-1', title: 'Standard Linen Kit', price: 1899, availableForSale: true }
    ],
    whatsIncluded: [
      'Pre-printed 100% natural washed organic linen fabric',
      '6-inch beechwood embroidery hoop with gold brass tension screw',
      'Full skeins of DMC cotton & metallic silk threads',
      '2x Japanese nickel-plated tapestry needles',
      'Bespoke enamel bee needle minder',
      'Full-color printed guidebook & QR code video tutorials'
    ],
    shippingInfo: 'Free shipping on orders over ₹1499 across India. Dispatched within 24 hours in our signature gift presentation box.',
    faqs: [
      { question: 'Is this kit suitable for complete beginners?', answer: 'Yes! Over 80% of our stitchers have never held an embroidery needle before. The QR code links directly to slow-motion step-by-step stitch guides.' },
      { question: 'Does the printed pattern wash off?', answer: 'Yes, the outline ink is water-soluble. Once you complete stitching, submerge gently in warm water for 5 minutes and let air dry.' }
    ],
    isBestSeller: true,
    isFeatured: true
  },
  {
    id: 'prod-2',
    handle: 'wildflower-meadow',
    title: 'Wildflower Meadow',
    subtitle: 'Botanical DIY Embroidery Kit',
    description: 'A delicate dance of lavender, chamomile, and gold-dusted botanicals. Designed to bring the calmness of an open meadow into your quiet home hours.',
    shortDescription: 'Gentle botanical stems and wildflower blossoms on warm cream linen.',
    price: 1699,
    currencyCode: 'INR',
    difficulty: 'Beginner',
    estimatedHours: 3.5,
    images: [
      { url: '/hilo/images/products/wildflower-meadow-1.jpg', altText: 'Wildflower Meadow Hoop' }
    ],
    collections: ['diy-kits', 'best-sellers'],
    tags: ['botanical', 'beginner', 'gift'],
    variants: [
      { id: 'var-2-1', title: 'Standard Linen Kit', price: 1699, availableForSale: true }
    ],
    whatsIncluded: [
      'Pre-printed organic linen fabric',
      '5-inch beechwood hoop',
      'DMC silk threads',
      '2x needles & guidebook'
    ],
    shippingInfo: 'Dispatched within 24 hours in gift packaging.',
    faqs: [
      { question: 'How long does it take to complete?', answer: 'Most beginners finish in 3 to 4 relaxing evening sessions.' }
    ],
    isBestSeller: true
  },
  {
    id: 'prod-3',
    handle: 'moonlit-garden',
    title: 'Moonlit Garden',
    subtitle: 'Luxury Night Sky Embroidery Experience',
    description: 'Rich wine-hued linen adorned with silver and gold starbursts, night-blooming jasmine, and moonlit floral vines.',
    shortDescription: 'Deep wine linen embroidered with shimmering gold and crescent moon accents.',
    price: 2199,
    currencyCode: 'INR',
    difficulty: 'Intermediate',
    estimatedHours: 6,
    images: [
      { url: '/hilo/images/products/moonlit-garden-1.jpg', altText: 'Moonlit Garden Embroidery' }
    ],
    collections: ['diy-kits', 'best-sellers', 'gift-experiences'],
    tags: ['night-sky', 'gold-thread', 'luxury'],
    variants: [
      { id: 'var-3-1', title: 'Luxury Gift Box Edition', price: 2199, availableForSale: true }
    ],
    whatsIncluded: [
      'Pre-printed deep wine linen fabric',
      '7-inch brass-accented wooden hoop',
      'Metallic gold and silk skeins',
      'Custom travel folder & accessories'
    ],
    shippingInfo: 'Free premium gift box packaging included.',
    faqs: [
      { question: 'Is metallic thread hard to work with?', answer: 'Our guidebook includes specific tips for smooth threading with metallic floss.' }
    ],
    isBestSeller: true
  },
  {
    id: 'prod-4',
    handle: 'lavender-dreams',
    title: 'Lavender Dreams',
    subtitle: 'Relaxation & Wellness Stitch Box',
    description: 'A soothing sensory experience pairing French lavender embroidery with aromatic lavender essential oil sachets.',
    shortDescription: 'French lavender sprigs on soft muted sage linen.',
    price: 1499,
    currencyCode: 'INR',
    difficulty: 'Beginner',
    estimatedHours: 3,
    images: [
      { url: '/hilo/images/products/lavender-dreams-1.jpg', altText: 'Lavender Dreams Kit' }
    ],
    collections: ['diy-kits', 'gift-experiences', 'best-sellers'],
    tags: ['wellness', 'lavender', 'relaxation'],
    variants: [
      { id: 'var-4-1', title: 'Standard Wellness Kit', price: 1499, availableForSale: true }
    ],
    whatsIncluded: [
      'Soft sage printed linen',
      '5-inch beechwood hoop',
      'Organic French dried lavender sachet',
      'DMC threads & needle set'
    ],
    shippingInfo: 'Dispatched within 24 hours.',
    faqs: [
      { question: 'Does it come with lavender?', answer: 'Yes! Includes an organic dried lavender sachet inside the box.' }
    ],
    isBestSeller: true
  },
  {
    id: 'prod-5',
    handle: 'vintage-stork-scissors',
    title: 'Vintage Stork Embroidery Scissors',
    subtitle: 'High-Precision Brass Crafting Scissors',
    description: 'Forged from high-grade Japanese stainless steel with antique gold plating. Ultra-sharp pointed tips designed for precision thread trimming.',
    shortDescription: 'Precision antique gold stork embroidery scissors.',
    price: 899,
    currencyCode: 'INR',
    difficulty: 'Beginner',
    estimatedHours: 0,
    images: [
      { url: '/hilo/images/products/vintage-stork-scissors-1.jpg', altText: 'Vintage Stork Embroidery Scissors' }
    ],
    collections: ['accessories'],
    tags: ['tools', 'scissors', 'brass'],
    variants: [
      { id: 'var-5-1', title: 'Antique Gold Edition', price: 899, availableForSale: true }
    ],
    whatsIncluded: [
      '1x Vintage Stork Scissors with gold finish',
      'Leather tip protective sheath'
    ],
    shippingInfo: 'Dispatched within 24 hours.',
    faqs: [
      { question: 'Are these scissors sharp?', answer: 'Yes, they feature hand-sharpened Japanese steel edges specifically tailored for embroidery thread.' }
    ]
  },
  {
    id: 'prod-6',
    handle: 'golden-bee-needle-minder',
    title: 'Golden Bee Magnetic Needle Minder',
    subtitle: 'Enamel & Neodymium Magnet Accessory',
    description: 'Keep your tapestry needle safely resting on your hoop with our signature golden bee magnetic needle minder.',
    shortDescription: 'Enamel bee magnetic needle keeper for embroidery hoops.',
    price: 599,
    currencyCode: 'INR',
    difficulty: 'Beginner',
    estimatedHours: 0,
    images: [
      { url: '/hilo/images/products/golden-bee-needle-minder-1.jpg', altText: 'Golden Bee Magnetic Needle Minder' }
    ],
    collections: ['accessories'],
    tags: ['tools', 'minder', 'magnet'],
    variants: [
      { id: 'var-6-1', title: 'Signature Gold Bee', price: 599, availableForSale: true }
    ],
    whatsIncluded: [
      '1x Hard enamel bee magnet',
      '1x Backing neodymium magnet'
    ],
    shippingInfo: 'Dispatched within 24 hours.',
    faqs: [
      { question: 'How does it attach?', answer: 'Place the enamel bee on top of your fabric and the second magnet underneath the hoop.' }
    ]
  }
];
