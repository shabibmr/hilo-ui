export interface ImageAsset {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ImageAsset | null;
  featured_product_handles: string[];
  sort_order: number;
  published: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Product {
  id: string;
  handle: string;
  title: string;
  subtitle: string | null;
  description: string;
  short_description: string;
  price: number;
  currency_code: string;
  difficulty: DifficultyLevel;
  estimated_hours: number;
  images: ImageAsset[];
  collections: string[];
  tags: string[];
  whats_included: string[];
  shipping_info: string;
  faqs: FAQItem[];
  is_best_seller: boolean;
  is_featured: boolean;
  stock: number;
  published: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: ShippingAddress;
  subtotal: number;
  currency_code: string;
  status: OrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  refund_id?: string | null;
  refunded_at?: string | null;
  customer_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  title: string;
  unit_price: number;
  quantity: number;
}

export type EnquiryKind = 'contact' | 'workshop';

export interface Enquiry {
  id: string;
  kind: EnquiryKind;
  name: string;
  email: string;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  default_address: ShippingAddress | null;
  created_at: string;
}

export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  backgroundImage: ImageAsset | null;
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
  hero: HeroContent;
  store: StoreProfile;
  social: SocialLinks;
  announcement: string | null;
  updated_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_no: string;
  issued_at: string;
  tax_total: number;
  total: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
}

export interface PurchaseInvoice {
  id: string;
  supplier_id: string | null;
  bill_no: string;
  bill_date: string;
  total: number;
  notes: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
}

export type ProductInput = Omit<Product, 'id' | 'created_at'>;
export type CollectionInput = Omit<Collection, 'id' | 'featured_product_handles'>;

export interface DashboardCounts {
  totalProducts: number;
  lowStockProducts: number;
  totalCollections: number;
  pendingOrders: number;
  totalOrders: number;
  unhandledEnquiries: number;
}
