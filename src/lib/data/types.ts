export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ImageAsset {
  url: string;
  altText: string;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  availableForSale: boolean;
  /** Units on hand when the provider knows it (Supabase). */
  stock?: number;
  sku?: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  subtitle?: string;
  description: string;
  shortDescription: string;
  price: number;
  currencyCode: string;
  difficulty: Difficulty;
  estimatedHours: number;
  images: ImageAsset[];
  collections: string[]; // collection handles
  tags: string[];
  variants: ProductVariant[];
  whatsIncluded: string[];
  shippingInfo: string;
  faqs: { question: string; answer: string }[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ImageAsset;
  featuredProductHandles: string[];
}

export interface CartLine {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface Cart {
  id: string;
  lines: CartLine[];
  subtotal: number;
  currencyCode: string;
  totalQuantity: number;
}

export interface FounderStoryContent {
  headline: string;
  subheadline: string;
  founderName: string;
  founderTitle: string;
  portraitImage: ImageAsset;
  storyParagraphs: string[];
  galleryImages: ImageAsset[];
  quote: string;
}

export interface HomepageContent {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    backgroundImage: ImageAsset;
  };
  collectionsNav: {
    handle: string;
    title: string;
    iconName: string;
    badge?: string;
    isComingSoon?: boolean;
  }[];
  whyHiloCards: {
    icon: string;
    title: string;
    description: string;
  }[];
  bestSellerHandles: string[];
  founderTeaser: {
    eyebrow: string;
    headline: string;
    bioSnippet: string;
    ctaText: string;
    image: ImageAsset;
    galleryImages?: ImageAsset[];
  };
  kitContentsItems: {
    id: string;
    name: string;
    description: string;
    icon: string;
    image: ImageAsset;
  }[];
  creativeJourneySteps: {
    stepNumber: number;
    title: string;
    description: string;
    icon: string;
  }[];
}


export interface StoreProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  gstin: string;
}

export interface SocialLinks {
  instagram: string;
  pinterest: string;
  whatsapp: string;
}

export interface SiteSettings {
  id: number;
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    backgroundImage: ImageAsset | null;
  };
  store: StoreProfile;
  social: SocialLinks;
  announcement: string | null;
  updated_at: string;
}
