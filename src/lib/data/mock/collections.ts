import { Collection } from '../types';

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    handle: 'diy-kits',
    title: 'DIY Embroidery Kits',
    description: 'Complete beginner-friendly embroidery kits with printed organic linen, premium threads, hoops, and step-by-step video lessons.',
    image: { url: '/hilo/images/collections/diy-kits.jpg', altText: 'DIY Kits Collection' },
    featuredProductHandles: ['blooming-roses', 'wildflower-meadow', 'moonlit-garden', 'lavender-dreams']
  },
  {
    id: 'col-2',
    handle: 'gift-experiences',
    title: 'Gift Experiences',
    description: 'Thoughtfully curated gift sets designed for birthdays, wellness pauses, bridesmaids, and heartfelt gestures.',
    image: { url: '/hilo/images/collections/gift-experiences.jpg', altText: 'Gift Experiences Collection' },
    featuredProductHandles: ['moonlit-garden', 'lavender-dreams']
  },
  {
    id: 'col-3',
    handle: 'accessories',
    title: 'Embroidery Accessories',
    description: 'Elevated brass scissors, enamel needle minders, linen travel pouches, and extra embroidery hoops.',
    image: { url: '/hilo/images/collections/accessories.jpg', altText: 'Accessories Collection' },
    featuredProductHandles: ['vintage-stork-scissors', 'golden-bee-needle-minder']
  }
];
