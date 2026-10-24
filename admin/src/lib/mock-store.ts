/**
 * In-browser sample studio. Used only when Supabase env vars are absent.
 * Mutations stay in localStorage so forms, stock, and status changes survive refresh.
 */
import type { Session, User } from '@supabase/supabase-js';
import type {
  Collection,
  Customer,
  DashboardCounts,
  Enquiry,
  HeroContent,
  ImageAsset,
  Invoice,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  PurchaseInvoice,
  PurchaseItem,
  SiteSettings,
  SocialLinks,
  StoreProfile,
  Supplier,
  CollectionInput,
  ProductInput,
} from './types';

const DB_KEY = 'hilo-admin-mock-db-v1';
const AUTH_KEY = 'hilo-admin-mock-auth';

export interface PurchaseRecord extends PurchaseInvoice {
  items: PurchaseItem[];
}

interface MockDb {
  products: Product[];
  collections: Collection[];
  customers: Customer[];
  orders: Order[];
  orderItems: OrderItem[];
  invoices: Invoice[];
  invoiceSeq: number;
  enquiries: Enquiry[];
  suppliers: Supplier[];
  purchases: PurchaseRecord[];
  settings: SiteSettings;
  /** Order ids whose pending stock hold was already returned. */
  releasedHolds: string[];
}

const listeners = new Set<(session: Session | null) => void>();

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const emptyHero = (): HeroContent => ({
  eyebrow: '',
  headline: '',
  subheadline: '',
  primaryCtaText: '',
  primaryCtaLink: '',
  secondaryCtaText: '',
  secondaryCtaLink: '',
  backgroundImage: null,
});

const emptyStore = (): StoreProfile => ({
  name: '',
  address: '',
  phone: '',
  email: '',
  hours: '',
  gstin: '',
});

const emptySocial = (): SocialLinks => ({
  instagram: '',
  pinterest: '',
  whatsapp: '',
});

function seed(): MockDb {
  const products: Product[] = [
    {
      id: 'prod-1',
      handle: 'blooming-roses',
      title: 'Blooming Roses',
      subtitle: 'Beginner Embroidery Experience Kit',
      description:
        'Signature rose kit on washed linen, with metallic gold thread and a beechwood hoop.',
      short_description: 'Vintage rose petals stitched with matte silk and gold highlights.',
      price: 1899,
      currency_code: 'INR',
      difficulty: 'Beginner',
      estimated_hours: 4,
      images: [
        {
          url: '/images/products/blooming-roses-1.jpg',
          altText: 'Blooming Roses completed hoop',
        },
      ],
      collections: ['diy-kits'],
      tags: ['floral', 'beginner', 'gift'],
      whats_included: [
        'Pre-printed washed linen',
        '6-inch beechwood hoop',
        'Cotton and metallic threads',
        'Needles and printed guidebook',
      ],
      shipping_info: 'Free shipping on orders above ₹1,500. Dispatch in 1-2 days across India.',
      faqs: [
        {
          question: 'Is this kit suitable for complete beginners?',
          answer: 'Yes. The pattern is printed and the guidebook covers each stitch.',
        },
      ],
      is_best_seller: true,
      is_featured: true,
      stock: 14,
      published: true,
      created_at: hoursAgo(240),
    },
    {
      id: 'prod-2',
      handle: 'wildflower-meadow',
      title: 'Wildflower Meadow',
      subtitle: 'Botanical DIY Embroidery Kit',
      description: 'Lavender, chamomile, and small gold botanicals on cream linen.',
      short_description: 'Gentle botanical stems on warm cream linen.',
      price: 1699,
      currency_code: 'INR',
      difficulty: 'Beginner',
      estimated_hours: 3.5,
      images: [
        {
          url: '/images/products/wildflower-meadow-1.jpg',
          altText: 'Wildflower Meadow hoop',
        },
      ],
      collections: ['diy-kits'],
      tags: ['botanical', 'beginner'],
      whats_included: ['Pre-printed linen', '5-inch hoop', 'Threads', 'Needles and guidebook'],
      shipping_info: 'Dispatched in gift packaging within 2 days.',
      faqs: [],
      is_best_seller: true,
      is_featured: false,
      stock: 8,
      published: true,
      created_at: hoursAgo(200),
    },
    {
      id: 'prod-3',
      handle: 'moonlit-garden',
      title: 'Moonlit Garden',
      subtitle: 'Night sky embroidery kit',
      description: 'Wine linen with silver and gold night-blooming florals.',
      short_description: 'Deep wine linen with gold and a crescent moon.',
      price: 2199,
      currency_code: 'INR',
      difficulty: 'Intermediate',
      estimated_hours: 6,
      images: [
        { url: '/images/products/moonlit-garden-1.jpg', altText: 'Moonlit Garden embroidery' },
      ],
      collections: ['diy-kits', 'gift-experiences'],
      tags: ['night-sky', 'gold-thread'],
      whats_included: ['Wine linen', '7-inch hoop', 'Metallic threads', 'Guidebook'],
      shipping_info: 'Packed in the signature gift box.',
      faqs: [],
      is_best_seller: false,
      is_featured: true,
      stock: 3,
      published: true,
      created_at: hoursAgo(160),
    },
    {
      id: 'prod-4',
      handle: 'lavender-dreams',
      title: 'Lavender Dreams',
      subtitle: 'Wellness stitch box',
      description: 'French lavender sprigs on sage linen, with a dried lavender sachet.',
      short_description: 'French lavender sprigs on muted sage linen.',
      price: 1499,
      currency_code: 'INR',
      difficulty: 'Beginner',
      estimated_hours: 3,
      images: [
        { url: '/images/products/lavender-dreams-1.jpg', altText: 'Lavender Dreams kit' },
      ],
      collections: ['diy-kits', 'gift-experiences'],
      tags: ['wellness', 'lavender'],
      whats_included: ['Sage linen', '5-inch hoop', 'Dried lavender sachet', 'Threads and needles'],
      shipping_info: 'Dispatched within 2 days.',
      faqs: [],
      is_best_seller: false,
      is_featured: false,
      stock: 0,
      published: true,
      created_at: hoursAgo(120),
    },
    {
      id: 'prod-5',
      handle: 'vintage-stork-scissors',
      title: 'Vintage Stork Embroidery Scissors',
      subtitle: 'Antique gold craft scissors',
      description: 'Pointed stork scissors for trimming embroidery thread.',
      short_description: 'Antique gold stork embroidery scissors.',
      price: 899,
      currency_code: 'INR',
      difficulty: 'Beginner',
      estimated_hours: 0,
      images: [
        {
          url: '/images/products/vintage-stork-scissors-1.jpg',
          altText: 'Vintage stork scissors',
        },
      ],
      collections: ['accessories'],
      tags: ['tools', 'scissors'],
      whats_included: ['Stork scissors', 'Leather tip sheath'],
      shipping_info: 'Dispatched within 2 days.',
      faqs: [],
      is_best_seller: false,
      is_featured: false,
      stock: 22,
      published: true,
      created_at: hoursAgo(90),
    },
    {
      id: 'prod-6',
      handle: 'golden-bee-needle-minder',
      title: 'Golden Bee Needle Minder',
      subtitle: 'Enamel magnetic needle keeper',
      description: 'Enamel bee magnet that holds the needle on the hoop.',
      short_description: 'Enamel bee magnetic needle keeper.',
      price: 599,
      currency_code: 'INR',
      difficulty: 'Beginner',
      estimated_hours: 0,
      images: [
        {
          url: '/images/products/golden-bee-needle-minder-1.jpg',
          altText: 'Golden bee needle minder',
        },
      ],
      collections: ['accessories'],
      tags: ['tools', 'minder'],
      whats_included: ['Enamel bee magnet', 'Backing magnet'],
      shipping_info: 'Dispatched within 2 days.',
      faqs: [],
      is_best_seller: false,
      is_featured: false,
      stock: 6,
      published: false,
      created_at: hoursAgo(40),
    },
  ];

  const collections: Collection[] = [
    {
      id: 'col-1',
      handle: 'diy-kits',
      title: 'DIY Embroidery Kits',
      description:
        'Printed linen, threads, a hoop, and a guidebook for a first stitch.',
      image: { url: '/images/collections/diy-kits.jpg', altText: 'DIY kits' },
      featured_product_handles: ['blooming-roses', 'wildflower-meadow', 'moonlit-garden'],
      sort_order: 0,
      published: true,
    },
    {
      id: 'col-2',
      handle: 'gift-experiences',
      title: 'Gift Experiences',
      description: 'Gift sets packed for birthdays, bridesmaids, and quiet weekends.',
      image: { url: '/images/collections/gift-experiences.jpg', altText: 'Gift experiences' },
      featured_product_handles: ['moonlit-garden', 'lavender-dreams'],
      sort_order: 1,
      published: true,
    },
    {
      id: 'col-3',
      handle: 'accessories',
      title: 'Embroidery Accessories',
      description: 'Scissors, needle minders, and small tools that live beside the hoop.',
      image: { url: '/images/collections/accessories.jpg', altText: 'Accessories' },
      featured_product_handles: ['vintage-stork-scissors', 'golden-bee-needle-minder'],
      sort_order: 2,
      published: true,
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cus-1',
      name: 'Meher Qureshi',
      email: 'meher.qureshi@example.com',
      phone: '+91 98200 44173',
      default_address: {
        fullName: 'Meher Qureshi',
        line1: '14 Carmichael Road',
        line2: 'Flat 3',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400026',
        country: 'India',
      },
      created_at: hoursAgo(80),
    },
    {
      id: 'cus-2',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      phone: '+91 98450 22819',
      default_address: {
        fullName: 'Ananya Iyer',
        line1: '42 Lavelle Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      created_at: minutesAgo(8),
    },
    {
      id: 'cus-3',
      name: 'Farah Siddiqui',
      email: 'farah.siddiqui@example.com',
      phone: '+91 90000 11842',
      default_address: {
        fullName: 'Farah Siddiqui',
        line1: '8 Banjara Hills Road No. 12',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'India',
      },
      created_at: hoursAgo(50),
    },
    {
      id: 'cus-4',
      name: 'Rhea Kapoor',
      email: 'rhea.kapoor@example.com',
      phone: '+91 98111 67320',
      default_address: {
        fullName: 'Rhea Kapoor',
        line1: '27 Hauz Khas Village',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110016',
        country: 'India',
      },
      created_at: hoursAgo(300),
    },
    {
      id: 'cus-5',
      name: 'Devika Nair',
      email: 'devika.nair@example.com',
      phone: '+91 98950 77411',
      default_address: {
        fullName: 'Devika Nair',
        line1: '16 Marine Drive',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682031',
        country: 'India',
      },
      created_at: hoursAgo(30),
    },
    {
      id: 'cus-6',
      name: 'Laila Fernandes',
      email: 'laila.fernandes@example.com',
      phone: '+91 83220 55904',
      default_address: {
        fullName: 'Laila Fernandes',
        line1: '3 Fontainhas',
        city: 'Panaji',
        state: 'Goa',
        postalCode: '403001',
        country: 'India',
      },
      created_at: hoursAgo(18),
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord-1',
      customer_name: 'Meher Qureshi',
      customer_email: 'meher.qureshi@example.com',
      customer_phone: '+91 98200 44173',
      shipping_address: customers[0].default_address!,
      subtotal: 2498,
      currency_code: 'INR',
      status: 'paid',
      razorpay_order_id: 'order_Qx81meher',
      razorpay_payment_id: 'pay_Qx81meher',
      customer_id: 'cus-1',
      created_at: hoursAgo(26),
    },
    {
      id: 'ord-2',
      customer_name: 'Ananya Iyer',
      customer_email: 'ananya.iyer@example.com',
      customer_phone: '+91 98450 22819',
      shipping_address: customers[1].default_address!,
      subtotal: 3398,
      currency_code: 'INR',
      status: 'pending',
      razorpay_order_id: 'order_Qx82ananya',
      razorpay_payment_id: null,
      customer_id: 'cus-2',
      created_at: minutesAgo(8),
    },
    {
      id: 'ord-3',
      customer_name: 'Farah Siddiqui',
      customer_email: 'farah.siddiqui@example.com',
      customer_phone: '+91 90000 11842',
      shipping_address: customers[2].default_address!,
      subtotal: 2199,
      currency_code: 'INR',
      status: 'shipped',
      razorpay_order_id: 'order_Qx73farah',
      razorpay_payment_id: 'pay_Qx73farah',
      customer_id: 'cus-3',
      created_at: hoursAgo(48),
    },
    {
      id: 'ord-4',
      customer_name: 'Rhea Kapoor',
      customer_email: 'rhea.kapoor@example.com',
      customer_phone: '+91 98111 67320',
      shipping_address: customers[3].default_address!,
      subtotal: 1499,
      currency_code: 'INR',
      status: 'delivered',
      razorpay_order_id: 'order_Qx11rhea',
      razorpay_payment_id: 'pay_Qx11rhea',
      customer_id: 'cus-4',
      created_at: hoursAgo(220),
    },
    {
      id: 'ord-5',
      customer_name: 'Devika Nair',
      customer_email: 'devika.nair@example.com',
      customer_phone: '+91 98950 77411',
      shipping_address: customers[4].default_address!,
      subtotal: 899,
      currency_code: 'INR',
      status: 'cancelled',
      razorpay_order_id: null,
      razorpay_payment_id: null,
      customer_id: 'cus-5',
      created_at: hoursAgo(20),
    },
    {
      id: 'ord-6',
      customer_name: 'Laila Fernandes',
      customer_email: 'laila.fernandes@example.com',
      customer_phone: '+91 83220 55904',
      shipping_address: customers[5].default_address!,
      subtotal: 3598,
      currency_code: 'INR',
      status: 'paid',
      razorpay_order_id: 'order_Qx90laila',
      razorpay_payment_id: 'pay_Qx90laila',
      customer_id: 'cus-6',
      created_at: hoursAgo(6),
    },
  ];

  const orderItems: OrderItem[] = [
    { id: 'oi-1', order_id: 'ord-1', product_id: 'prod-1', title: 'Blooming Roses', unit_price: 1899, quantity: 1 },
    { id: 'oi-2', order_id: 'ord-1', product_id: 'prod-6', title: 'Golden Bee Needle Minder', unit_price: 599, quantity: 1 },
    { id: 'oi-3', order_id: 'ord-2', product_id: 'prod-2', title: 'Wildflower Meadow', unit_price: 1699, quantity: 2 },
    { id: 'oi-4', order_id: 'ord-3', product_id: 'prod-3', title: 'Moonlit Garden', unit_price: 2199, quantity: 1 },
    { id: 'oi-5', order_id: 'ord-4', product_id: 'prod-4', title: 'Lavender Dreams', unit_price: 1499, quantity: 1 },
    { id: 'oi-6', order_id: 'ord-5', product_id: 'prod-5', title: 'Vintage Stork Embroidery Scissors', unit_price: 899, quantity: 1 },
    { id: 'oi-7', order_id: 'ord-6', product_id: 'prod-1', title: 'Blooming Roses', unit_price: 1899, quantity: 1 },
    { id: 'oi-8', order_id: 'ord-6', product_id: 'prod-2', title: 'Wildflower Meadow', unit_price: 1699, quantity: 1 },
  ];

  const invoices: Invoice[] = [
    { id: 'inv-1', order_id: 'ord-4', invoice_no: 'HA-00009', issued_at: hoursAgo(219), tax_total: 0, total: 1499 },
    { id: 'inv-2', order_id: 'ord-3', invoice_no: 'HA-00011', issued_at: hoursAgo(47), tax_total: 110, total: 2309 },
    { id: 'inv-3', order_id: 'ord-1', invoice_no: 'HA-00012', issued_at: hoursAgo(26), tax_total: 0, total: 2498 },
    { id: 'inv-4', order_id: 'ord-6', invoice_no: 'HA-00013', issued_at: hoursAgo(6), tax_total: 0, total: 3598 },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup-1',
      name: 'Malabar Linen Co.',
      phone: '+91 98470 22108',
      email: 'orders@malabarlinen.example',
      address: 'Weaver street, Kannur, Kerala 670001',
      gstin: '32AABCM4412P1Z8',
    },
    {
      id: 'sup-2',
      name: 'Hoop & Brass Works',
      phone: '+91 94140 88321',
      email: 'desk@hoopbrass.example',
      address: 'Bapu Bazaar, Jaipur, Rajasthan 302003',
      gstin: '08AADFH2291Q1Z3',
    },
  ];

  const purchases: PurchaseRecord[] = [
    {
      id: 'pur-1',
      supplier_id: 'sup-2',
      bill_no: 'HB-1842',
      bill_date: '2026-10-12',
      total: 8400,
      notes: 'Hoops and bee minders for the October kits.',
      created_at: hoursAgo(280),
      items: [
        {
          id: 'pi-1',
          purchase_id: 'pur-1',
          product_id: 'prod-6',
          description: 'Golden Bee Needle Minder',
          quantity: 20,
          unit_cost: 180,
        },
        {
          id: 'pi-2',
          purchase_id: 'pur-1',
          product_id: 'prod-5',
          description: 'Vintage Stork Embroidery Scissors',
          quantity: 12,
          unit_cost: 400,
        },
      ],
    },
  ];

  const settings: SiteSettings = {
    id: 1,
    hero: {
      eyebrow: 'Luxury creative experiences',
      headline: 'Stitch beauty into your quiet moments.',
      subheadline: 'Beginner embroidery kits made to slow an evening down.',
      primaryCtaText: 'Start your first stitch',
      primaryCtaLink: '/collections/diy-kits',
      secondaryCtaText: 'Explore gift experiences',
      secondaryCtaLink: '/collections/gift-experiences',
      backgroundImage: {
        url: '/images/hero/hero-fairy-moon.jpg',
        altText: 'Embroidery hoop in evening light',
      },
    },
    store: {
      name: 'Hilo Arte',
      address: 'Studio 4, 18 Hill Road, Bandra West, Mumbai 400050',
      phone: '+91 22 4893 2210',
      email: 'studio@hiloarte.com',
      hours: 'Tuesday to Saturday, 11:00 to 18:00',
      gstin: '27AAPFH1842Q1Z5',
    },
    social: {
      instagram: 'https://instagram.com/hiloarte',
      pinterest: 'https://pinterest.com/hiloarte',
      whatsapp: '+91 98200 11024',
    },
    announcement: 'Free shipping on kits above ₹1,500. Lavender Dreams is sold out this week.',
    updated_at: hoursAgo(5),
  };

  return {
    products,
    collections,
    customers,
    orders,
    orderItems,
    invoices,
    invoiceSeq: 13,
    enquiries: [
      {
        id: 'enq-1',
        kind: 'contact',
        name: 'Ishita Malhotra',
        email: 'ishita.malhotra@example.com',
        message: 'Can Blooming Roses ship to Chandigarh before 2 November, packed as a birthday gift?',
        handled: false,
        created_at: hoursAgo(5),
      },
      {
        id: 'enq-2',
        kind: 'workshop',
        name: 'Kabir Seth',
        email: 'kabir.seth@example.com',
        message: 'We host eight people on Sunday afternoons in Pune. Do you still take private stitch evenings?',
        handled: false,
        created_at: hoursAgo(15),
      },
      {
        id: 'enq-3',
        kind: 'contact',
        name: 'Priya Menon',
        email: 'priya.menon@example.com',
        message: 'I would like a hoop with an initial M in the Moonlit Garden palette. Is a one-off possible?',
        handled: false,
        created_at: hoursAgo(28),
      },
      {
        id: 'enq-4',
        kind: 'contact',
        name: 'Sana Yusuf',
        email: 'sana.yusuf@example.com',
        message: 'The stork scissors arrived. Thank you for replacing the bent tip so quickly.',
        handled: true,
        created_at: hoursAgo(70),
      },
    ],
    suppliers,
    purchases,
    settings,
    releasedHolds: ['ord-5'],
  };
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readDb(): MockDb {
  if (!canUseStorage()) return seed();
  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const fresh = seed();
    window.localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as MockDb;
    if (!parsed.products || !parsed.settings) throw new Error('incomplete');
    parsed.settings = {
      ...parsed.settings,
      hero: { ...emptyHero(), ...parsed.settings.hero },
      store: { ...emptyStore(), ...parsed.settings.store },
      social: { ...emptySocial(), ...parsed.settings.social },
    };
    parsed.releasedHolds = parsed.releasedHolds || [];
    return parsed;
  } catch {
    const fresh = seed();
    window.localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

function writeDb(db: MockDb): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function sessionFromEmail(email: string): Session {
  const user = {
    id: 'admin-sample',
    email,
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  } as User;
  return { user } as Session;
}

export function getMockSession(): Session | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { email?: string };
    if (!parsed.email) return null;
    return sessionFromEmail(parsed.email);
  } catch {
    return null;
  }
}

export function mockSignIn(email: string, password: string): Session {
  if (!email.trim() || !password) {
    throw new Error('Enter both email and password.');
  }
  if (canUseStorage()) {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify({ email: email.trim() }));
  }
  const session = sessionFromEmail(email.trim());
  listeners.forEach((listener) => listener(session));
  return session;
}

export function mockSignOut(): void {
  if (canUseStorage()) window.localStorage.removeItem(AUTH_KEY);
  listeners.forEach((listener) => listener(null));
}

export function onMockAuthChange(callback: (session: Session | null) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getDashboardCounts(): DashboardCounts {
  const db = readDb();
  return {
    totalProducts: db.products.length,
    lowStockProducts: db.products.filter((product) => product.stock <= 3).length,
    totalCollections: db.collections.length,
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter((order) => order.status === 'pending').length,
    unhandledEnquiries: db.enquiries.filter((enquiry) => !enquiry.handled).length,
  };
}

export function listProducts(): Product[] {
  return readDb().products.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getProduct(id: string): Product {
  const product = readDb().products.find((item) => item.id === id);
  if (!product) throw new Error('Product not found.');
  return product;
}

export function createProduct(input: ProductInput): void {
  const db = readDb();
  if (db.products.some((product) => product.handle === input.handle)) {
    throw new Error('A product with this handle already exists.');
  }
  db.products.unshift({
    ...input,
    id: uid('prod'),
    created_at: new Date().toISOString(),
  });
  writeDb(db);
}

export function updateProduct(id: string, input: Partial<ProductInput>): void {
  const db = readDb();
  const index = db.products.findIndex((product) => product.id === id);
  if (index === -1) throw new Error('Product not found.');
  db.products[index] = { ...db.products[index], ...input, id };
  writeDb(db);
}

export function setProductPublished(id: string, published: boolean): void {
  const db = readDb();
  const product = db.products.find((item) => item.id === id);
  if (!product) throw new Error('Product not found.');
  product.published = published;
  writeDb(db);
}

export function deleteProduct(id: string): void {
  const db = readDb();
  db.products = db.products.filter((product) => product.id !== id);
  writeDb(db);
}

export function listCollections(orderBy: 'sort_order' | 'title' = 'sort_order'): Collection[] {
  const rows = readDb().collections.slice();
  rows.sort((a, b) =>
    orderBy === 'title' ? a.title.localeCompare(b.title) : a.sort_order - b.sort_order
  );
  return rows;
}

export function createCollection(input: CollectionInput): void {
  const db = readDb();
  if (db.collections.some((collection) => collection.handle === input.handle)) {
    throw new Error('A collection with this handle already exists.');
  }
  db.collections.push({
    ...input,
    id: uid('col'),
    featured_product_handles: [],
  });
  writeDb(db);
}

export function updateCollection(id: string, input: CollectionInput): void {
  const db = readDb();
  const index = db.collections.findIndex((collection) => collection.id === id);
  if (index === -1) throw new Error('Collection not found.');
  db.collections[index] = {
    ...db.collections[index],
    ...input,
    id,
  };
  writeDb(db);
}

export function setCollectionPublished(id: string, published: boolean): void {
  const db = readDb();
  const collection = db.collections.find((item) => item.id === id);
  if (!collection) throw new Error('Collection not found.');
  collection.published = published;
  writeDb(db);
}

export function deleteCollection(id: string): void {
  const db = readDb();
  db.collections = db.collections.filter((collection) => collection.id !== id);
  writeDb(db);
}

export function uploadImageFile(file: File): Promise<ImageAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      resolve({
        url: String(reader.result || ''),
        altText: file.name.replace(/\.[^/.]+$/, ''),
      });
    };
    reader.readAsDataURL(file);
  });
}

export function listOrders(): Order[] {
  return readDb().orders.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function orderItems(orderId: string): OrderItem[] {
  return readDb().orderItems.filter((item) => item.order_id === orderId);
}

export function invoiceFor(orderId: string): Invoice | null {
  return readDb().invoices.find((invoice) => invoice.order_id === orderId) || null;
}

function nextInvoiceNo(db: MockDb): string {
  db.invoiceSeq += 1;
  return `HA-${String(db.invoiceSeq).padStart(5, '0')}`;
}

function ensureInvoice(db: MockDb, order: Order): Invoice {
  const existing = db.invoices.find((invoice) => invoice.order_id === order.id);
  if (existing) return existing;
  const created: Invoice = {
    id: uid('inv'),
    order_id: order.id,
    invoice_no: nextInvoiceNo(db),
    issued_at: new Date().toISOString(),
    tax_total: 0,
    total: Number(order.subtotal),
  };
  db.invoices.push(created);
  return created;
}

function restoreHold(db: MockDb, order: Order): void {
  if (db.releasedHolds.includes(order.id)) return;
  if (order.status !== 'pending' && order.status !== 'cancelled') return;
  const items = db.orderItems.filter((item) => item.order_id === order.id);
  for (const item of items) {
    if (!item.product_id) continue;
    const product = db.products.find((row) => row.id === item.product_id);
    if (product) product.stock += item.quantity;
  }
  db.releasedHolds.push(order.id);
}

export function updateOrderStatus(id: string, status: OrderStatus): Order {
  const db = readDb();
  const order = db.orders.find((row) => row.id === id);
  if (!order) throw new Error('Order not found.');
  const previous = order.status;
  if (previous === 'refunded' && status !== 'refunded') {
    throw new Error('A refunded order cannot be transitioned to another status.');
  }
  order.status = status;
  if ((status === 'cancelled' || status === 'refunded') && previous !== 'cancelled') {
    restoreHold(db, order);
    if (status === 'refunded') {
      order.refunded_at = new Date().toISOString();
      order.refund_id = order.refund_id || `rfnd_mock_${Date.now().toString().slice(-6)}`;
    }
  }
  if (status === 'paid' || status === 'shipped' || status === 'delivered') ensureInvoice(db, order);
  writeDb(db);
  return order;
}

export function refundOrder(id: string): Order {
  const db = readDb();
  const order = db.orders.find((row) => row.id === id);
  if (!order) throw new Error('Order not found.');
  if (order.status === 'refunded') {
    throw new Error('Order has already been refunded.');
  }
  if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
    throw new Error(`Cannot refund an order with status "${order.status}".`);
  }
  order.status = 'refunded';
  order.refund_id = `rfnd_mock_${Date.now().toString().slice(-6)}`;
  order.refunded_at = new Date().toISOString();
  restoreHold(db, order);
  writeDb(db);
  return order;
}

export function verifyPayment(id: string): { verified: boolean; status: OrderStatus; message: string } {
  const db = readDb();
  const order = db.orders.find((row) => row.id === id);
  if (!order) throw new Error('Order not found.');
  if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
    return { verified: true, status: order.status, message: 'Order is already marked as paid.' };
  }
  // In mock mode, verify marks the pending order as paid
  order.status = 'paid';
  order.razorpay_payment_id = order.razorpay_payment_id || `pay_mock_${Date.now().toString().slice(-6)}`;
  ensureInvoice(db, order);
  writeDb(db);
  return { verified: true, status: 'paid', message: 'Payment confirmed on Razorpay. Order marked as paid.' };
}

export function releasePendingHold(id: string): void {
  const db = readDb();
  const order = db.orders.find((row) => row.id === id);
  if (!order) throw new Error('Order not found.');
  if (order.status !== 'pending') throw new Error('Only unpaid orders hold stock.');
  restoreHold(db, order);
  writeDb(db);
}

export function listEnquiries(): Enquiry[] {
  return readDb().enquiries.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function setEnquiryHandled(id: string, handled: boolean): void {
  const db = readDb();
  const enquiry = db.enquiries.find((row) => row.id === id);
  if (!enquiry) throw new Error('Enquiry not found.');
  enquiry.handled = handled;
  writeDb(db);
}

export function listCustomers(): Customer[] {
  return readDb().customers.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getCustomer(id: string): Customer {
  const customer = readDb().customers.find((row) => row.id === id);
  if (!customer) throw new Error('Customer not found.');
  return customer;
}

export function ordersForCustomer(customerId: string): Order[] {
  return listOrders().filter((order) => order.customer_id === customerId);
}

export function listSuppliers(): Supplier[] {
  return readDb().suppliers.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function saveSupplier(input: Omit<Supplier, 'id'> & { id?: string }): Supplier {
  const db = readDb();
  if (input.id) {
    const index = db.suppliers.findIndex((supplier) => supplier.id === input.id);
    if (index === -1) throw new Error('Supplier not found.');
    db.suppliers[index] = { ...db.suppliers[index], ...input, id: input.id };
    writeDb(db);
    return db.suppliers[index];
  }
  const created: Supplier = {
    id: uid('sup'),
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
    gstin: input.gstin,
  };
  db.suppliers.push(created);
  writeDb(db);
  return created;
}

export function deleteSupplier(id: string): void {
  const db = readDb();
  db.suppliers = db.suppliers.filter((supplier) => supplier.id !== id);
  for (const purchase of db.purchases) {
    if (purchase.supplier_id === id) purchase.supplier_id = null;
  }
  writeDb(db);
}

export function getPurchase(id: string): PurchaseRecord {
  const purchase = readDb().purchases.find((row) => row.id === id);
  if (!purchase) throw new Error('Purchase bill not found.');
  return purchase;
}

export function getInvoice(id: string): Invoice {
  const invoice = readDb().invoices.find((row) => row.id === id);
  if (!invoice) throw new Error('Invoice not found.');
  return invoice;
}

export function createInvoice(orderId: string): Invoice {
  const db = readDb();
  const order = db.orders.find((row) => row.id === orderId);
  if (!order) throw new Error('Order not found.');
  const invoice = ensureInvoice(db, order);
  writeDb(db);
  return invoice;
}

export function listPurchases(): PurchaseRecord[] {
  return readDb().purchases.slice().sort((a, b) => (a.bill_date < b.bill_date ? 1 : -1));
}

export function createPurchase(input: {
  supplier_id: string | null;
  bill_no: string;
  bill_date: string;
  notes: string | null;
  items: Array<Omit<PurchaseItem, 'id' | 'purchase_id'>>;
}): PurchaseRecord {
  if (!input.bill_no.trim()) throw new Error('Bill number is required.');
  if (input.items.length === 0) throw new Error('Add at least one line.');
  const db = readDb();
  const purchaseId = uid('pur');
  const items: PurchaseItem[] = input.items.map((item) => ({
    ...item,
    id: uid('pi'),
    purchase_id: purchaseId,
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unit_cost: Number(item.unit_cost),
  }));
  for (const item of items) {
    if (!item.description) throw new Error('Each line needs a description.');
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error('Quantity must be at least 1.');
    }
    if (item.product_id) {
      const product = db.products.find((row) => row.id === item.product_id);
      if (!product) throw new Error('One of the products no longer exists.');
      product.stock += item.quantity;
    }
  }
  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  const record: PurchaseRecord = {
    id: purchaseId,
    supplier_id: input.supplier_id,
    bill_no: input.bill_no.trim(),
    bill_date: input.bill_date,
    total,
    notes: input.notes,
    created_at: new Date().toISOString(),
    items,
  };
  db.purchases.unshift(record);
  writeDb(db);
  return record;
}

export function getSettings(): SiteSettings {
  return readDb().settings;
}

export function saveSettings(input: Omit<SiteSettings, 'id' | 'updated_at'>): SiteSettings {
  const db = readDb();
  db.settings = {
    ...input,
    id: 1,
    updated_at: new Date().toISOString(),
  };
  writeDb(db);
  return db.settings;
}

export function holdExpiresAt(order: Order): string | null {
  if (order.status !== 'pending') return null;
  return new Date(new Date(order.created_at).getTime() + 15 * 60 * 1000).toISOString();
}

export function holdIsReleased(orderId: string): boolean {
  return readDb().releasedHolds.includes(orderId);
}
