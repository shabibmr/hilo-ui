import { HomepageContent } from '../types';

export const MOCK_HOMEPAGE_CONTENT: HomepageContent = {
  hero: {
    eyebrow: 'LUXURY CREATIVE EXPERIENCES',
    headline: 'Stitch beauty into your quiet moments.',
    subheadline: 'Beginner embroidery experiences designed to slow down and create.',
    primaryCtaText: 'Start Your First Stitch',
    primaryCtaLink: '/collections/diy-kits',
    secondaryCtaText: 'Explore Gift Experiences',
    secondaryCtaLink: '/collections/gift-experiences',
    backgroundImage: { url: '/hilo/images/hero/hero-fairy-moon.jpg', altText: 'Fairy stitching on crescent moon atmosphere' }
  },
  collectionsNav: [
    { handle: 'diy-kits', title: 'DIY Kits', iconName: 'Sparkles' },
    { handle: 'gift-experiences', title: 'Gift Experiences', iconName: 'Gift' },
    { handle: 'accessories', title: 'Accessories', iconName: 'Scissors' },
    { handle: 'workshops', title: 'Workshops', iconName: 'BookOpen', badge: 'Coming Soon', isComingSoon: true },
    { handle: 'customisation', title: 'Customisation', iconName: 'Palette', badge: 'Coming Soon', isComingSoon: true }
  ],
  whyHiloCards: [
    { icon: 'HeartHandshake', title: 'Beginner Friendly', description: 'Clear step-by-step guides for zero-experience stitchers.' },
    { icon: 'Video', title: 'Guided Learning', description: 'QR code video lessons for every stitch technique.' },
    { icon: 'Sparkles', title: 'Handmade In India', description: 'Crafted with premium organic linen and silk threads.' },
    { icon: 'Moon', title: 'Screen-Free Time', description: 'A calming tactile ritual for quiet evenings.' },
    { icon: 'Gift', title: 'Beautiful Gifting', description: 'Delivered in luxury signature presentation boxes.' },
    { icon: 'Clock', title: 'Learn At Your Pace', description: 'No deadlines. Stitch whenever you need a pause.' }
  ],
  bestSellerHandles: ['blooming-roses', 'wildflower-meadow', 'moonlit-garden', 'lavender-dreams'],
  founderTeaser: {
    eyebrow: 'OUR STORY',
    headline: 'Meet the hands behind HILO ARTE.',
    bioSnippet: 'Hi, I’m Naima. What began with a simple thread slowly became a world of stitches, florals, quiet moments, and handmade stories.',
    ctaText: 'Read Our Story',
    image: { url: '/hilo/images/founder/naima-portrait.jpg', altText: 'Naima in her embroidery studio' },
    galleryImages: [
      { url: '/hilo/images/founder/workspace-1.jpg', altText: 'Studio thread collection' },
      { url: '/hilo/images/founder/workspace-2.jpg', altText: 'Hand drawing floral patterns' },
      { url: '/hilo/images/founder/workspace-3.jpg', altText: 'Linen stitching detail' },
      { url: '/hilo/images/founder/workspace-4.jpg', altText: 'Gift box packaging process' }
    ]
  },
  kitContentsItems: [
    { id: 'kc-1', name: 'Printed Linen', description: 'Pre-printed water-soluble pattern', icon: 'FileText', image: { url: '/hilo/images/kit-contents/linen.jpg', altText: 'Printed Fabric' } },
    { id: 'kc-2', name: 'Wooden Hoop', description: '6-inch beechwood with gold screw', icon: 'Circle', image: { url: '/hilo/images/kit-contents/hoop.jpg', altText: 'Wooden Hoop' } },
    { id: 'kc-3', name: 'Silk Threads', description: 'Full DMC skeins in curated shades', icon: 'Feather', image: { url: '/hilo/images/kit-contents/threads.jpg', altText: 'Threads' } },
    { id: 'kc-4', name: 'Tapestry Needles', description: '2x Japanese nickel-plated needles', icon: 'Pin', image: { url: '/hilo/images/kit-contents/needles.jpg', altText: 'Needles' } },
    { id: 'kc-5', name: 'Bee Needle Minder', description: 'Bespoke enamel magnet accessory', icon: 'Smile', image: { url: '/hilo/images/kit-contents/minder.jpg', altText: 'Needle Minder' } },
    { id: 'kc-6', name: 'Guidebook', description: 'Full-color printed booklet', icon: 'Book', image: { url: '/hilo/images/kit-contents/guide.jpg', altText: 'Guidebook' } },
    { id: 'kc-7', name: 'QR Video Lessons', description: 'Slow-motion video stitch tutorials', icon: 'QrCode', image: { url: '/hilo/images/kit-contents/qr.jpg', altText: 'QR Lessons' } },
    { id: 'kc-8', name: 'Instruction Card', description: 'Quick-start guide card', icon: 'Layers', image: { url: '/hilo/images/kit-contents/card.jpg', altText: 'Instruction Card' } },
    { id: 'kc-9', name: 'Travel Folder', description: 'Keep all your materials organized', icon: 'Folder', image: { url: '/hilo/images/kit-contents/folder.jpg', altText: 'Travel Folder' } }
  ],
  creativeJourneySteps: [
    { stepNumber: 1, title: 'Choose Your Kit', description: 'Pick a pattern that speaks to your quiet mood.', icon: 'MousePointer' },
    { stepNumber: 2, title: 'Open Your Box', description: 'Unwrap the signature presentation box and linen.', icon: 'Package' },
    { stepNumber: 3, title: 'Scan QR Lessons', description: 'Watch slow-motion video guides on your phone.', icon: 'QrCode' },
    { stepNumber: 4, title: 'Learn Stitches', description: 'Master basic stitches with ease and comfort.', icon: 'Sparkles' },
    { stepNumber: 5, title: 'Complete Artwork', description: 'Watch your floral piece come alive stitch by stitch.', icon: 'CheckCircle' },
    { stepNumber: 6, title: 'Frame It', description: 'Tighten the hoop or display in a wooden frame.', icon: 'Image' },
    { stepNumber: 7, title: 'Share Your Story', description: 'Join our quiet community of handmade creators.', icon: 'Heart' }
  ]
};
