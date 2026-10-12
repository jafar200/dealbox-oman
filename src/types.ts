export type BasketCategory = 
  | 'all'
  | 'bakery'
  | 'supermarket'
  | 'restaurant'
  | 'produce'
  | 'cooked'
  | 'cafe';

export type Wilayah = 
  | 'all'
  | 'السيب'
  | 'بوشر'
  | 'مطرح'
  | 'العامرات'
  | 'صحار'
  | 'صلالة'
  | 'نزوى'
  | 'بركاء';

export type PortalMode = 
  | 'marketing'
  | 'intro'
  | 'client-app'
  | 'store-dashboard'
  | 'admin-dashboard'
  | 'architecture-docs'
  | 'portal-gate'
  | 'reset-password';

/* ===== المحتوى التسويقي للموقع (يُدار من لوحة الآدمن) ===== */
export interface MarketingIconItem {
  icon: string;
  title: string;
  desc?: string;
}

export interface MarketingOffer {
  emoji: string;
  store: string;
  title: string;
  newPrice: string;
  oldPrice: string;
  save: string;
  tag: string;
}

export interface MarketingGrowthHack {
  icon: string;
  title: string;
  headline: string;
  desc: string;
}

export interface MarketingImpactStat {
  icon: string;
  value: number;
  decimals: number;
  label: string;
}

export interface MarketingCampaign {
  icon: string;
  channel: string;
  name: string;
  desc: string;
  audience: string;
}

export interface MarketingPartnerBullet {
  icon: string;
  title: string;
  desc: string;
}

export interface MarketingSiteContent {
  seo: { title: string; description: string; keywords: string; ogImage: string };
  hero: {
    badgeText: string;
    tagline: string;
    subtitle: string;
    highlightLine: string;
    ctaClientText: string;
    ctaStoreText: string;
    chips: string[];
    imageUrl: string;
  };
  offers: MarketingOffer[];
  valueBand: MarketingIconItem[];
  features: { sectionTitle: string; sectionSub: string; items: MarketingIconItem[] };
  steps: { sectionTitle: string; items: MarketingIconItem[] };
  growthHacks: MarketingGrowthHack[];
  impact: { sectionTitle: string; sectionSub: string; stats: MarketingImpactStat[] };
  campaigns: {
    sectionBadge: string;
    sectionTitle: string;
    sectionSub: string;
    items: MarketingCampaign[];
  };
  partners: {
    badge: string;
    title: string;
    intro: string;
    bullets: MarketingPartnerBullet[];
    ctaText: string;
    equationTitle: string;
    equationText: string;
    guideTitle: string;
    guideItems: string[];
  };
  download: {
    title: string;
    subtitle: string;
    note: string;
    playStoreUrl: string;
    appStoreUrl: string;
  };
  footer: { about: string; copyright: string };
  images: { logoUrl: string; heroImageUrl: string; downloadImageUrl: string };
}

export type UserRole = 'client' | 'store_manager' | 'admin';

// RBAC — أدوار المشرفين ومدراء العمليات المصرح لهم بدخول لوحة الآدمن المركزية
export type AdminRole =
  | 'super_admin'
  | 'operations_manager'
  | 'supervisor'
  | 'logistics_manager'
  | 'financial_officer'
  | 'food_safety';

export type AdminPermission =
  | 'overview'
  | 'stores'
  | 'pickups'
  | 'reports'
  | 'users'
  | 'accounting'
  | 'stories'
  | 'settings';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  adminRole: AdminRole;
  roleTitle: string;
  roleShortTitle: string;
  badgeColor: string;
  icon: string;
  description: string;
  permissions: AdminPermission[];
  active: boolean;
  lastLoginAt: string | null;
  isSelf: boolean;
}

/* طلب انضمام شريك من استمارة الموقع التسويقي — يراجعه الآدمن ويتواصل مع مقدمه */
export interface PartnerRequest {
  id: string;
  fullName: string;
  storeName: string;
  phone: string;
  wilayah: string;
  area: string;
  category: string;
  categoryLabel: string;
  notes: string;
  status: 'new' | 'contacted' | 'approved' | 'rejected';
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRoleCatalogItem {  key: AdminRole;
  title: string;
  shortTitle: string;
  color: string;
  icon: string;
  description: string;
  permissions: AdminPermission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  storeId?: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  wilaya: Wilayah;
  area: string;
  address: string;
  phone: string;
  crNumber: string; // Commercial Registration in Oman
  category: BasketCategory;
  logoUrl: string;
  managerName: string;
  status: 'active' | 'pending' | 'suspended';
  commissionRate: number; // e.g. 0.15 (15%)
  coordinates: [number, number];
  bankAccount: {
    bankName: string;
    accountHolder: string;
    iban: string;
  };
}

export interface DealBoxItem {
  id: string;
  storeId?: string;
  storeName: string;
  storeLogoUrl: string;
  imageUrl: string;
  category: BasketCategory;
  categoryNameAr: string;
  title: string;
  description: string;
  expectedItems: string[];
  remainingCount: number;
  remainingText: string;
  distanceKm: number;
  distanceText: string;
  pickupTimeText: string;
  pickupWindow: string;
  originalPrice: number;
  discountedPrice: number;
  currency: string;
  locationArea: string;
  coordinates: [number, number];
  phone?: string;
  addressDetails: string;
  verifiedStore: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt?: string;
}

export type StoreBasket = {
  id: string;
  storeName: string;
  storeLogo: string;
  category: BasketCategory;
  categoryNameAr: string;
  wilayah: Wilayah;
  area: string;
  title: string;
  description: string;
  expectedItems: string[];
  originalPrice: number;
  discountedPrice: number;
  remainingBaskets: number;
  pickupStart: string;
  pickupEnd: string;
  pickupDate: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  coordinates: [number, number];
  badge?: string;
  verifiedStore: boolean;
  phone?: string;
  addressDetails: string;
  imageUrl?: string;
};

export interface StoreStory {
  id: string;
  name: string;
  avatarUrl: string;
  active: boolean;
  boxCount: number;
  category: BasketCategory;
}

export interface Reservation {
  id: string;
  boxId: string;
  storeId?: string;
  storeName: string;
  title: string;
  customerName?: string;
  customerPhone?: string;
  imageUrl?: string;
  pickupTimeWindow: string;
  pricePaid: number;
  originalPrice: number;
  currency: string;
  pickupCode: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'cancelled';
  addressDetails: string;
  phone: string;
  quantity?: number;
  cancellationReason?: string;
  refundStatus?: 'refunded' | 'processing' | 'wallet_credit' | 'not_applicable';
  cancelledAt?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  wilayah: string;
  email: string;
  joinedDate: string;
  ordersCount: number;
  totalSpentOmr: number;
  status: 'active' | 'suspended' | 'vip';
  avatarUrl?: string;
}

export interface Settlement {
  id: string;
  settlementNumber: string;
  storeId: string;
  storeName: string;
  period: string;
  totalOrders: number;
  grossSalesOmr: number;
  platformCommissionOmr: number;
  netPayoutOmr: number;
  status: 'pending' | 'processed' | 'transferred';
  bankName: string;
  iban: string;
  createdAt: string;
  transferredAt?: string;
}

export interface SystemStats {
  mealsSavedToday: number;
  co2SavedKg: number;
  moneySavedOmr: number;
  activeStoresCount: number;
}

// إحصائيات الأدمن الحقيقية من GET /api/v1/admin/analytics
export interface AdminAnalyticsData {
  totalStores: number;
  activeStores: number;
  pendingStores: number;
  grossSalesOmr: number;
  platformCommissionOmr: number;
  mealsRescued: number;
  totalOrders: number;
  nonCancelledPct: number;
  todayStat: { total: number; collected: number; pending: number; cancelled: number };
  weekly: { day: string; salesOmr: number; ordersCount: number; isPeak: boolean }[];
  recentOrders: {
    id: string;
    storeName: string;
    beneficiary: string;
    beneficiaryNote: string;
    windowTime: string;
    status: string;
    statusText: string;
    phone: string;
    items: string;
    priceOmr: number;
  }[];
}

export type ActiveNavTab = 'explore-home' | 'my-reservations' | 'stores-map' | 'user-profile';

// تحليلات المستخدمين والحجوزات من GET /api/v1/admin/users-analytics
export interface AdminPeriodCounts {
  all: number;
  day: number;
  week: number;
  month: number;
  year: number;
}

export interface AdminUserBookingStore {
  storeId: string | null;
  storeName: string;
  count: AdminPeriodCounts;
}

export interface AdminUserBooking {
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  email: string | null;
  registered: boolean;
  totals: AdminPeriodCounts;
  lastBookingAt: string | null;
  byStore: AdminUserBookingStore[];
}

export interface AdminStoreBookingUser {
  clientName: string;
  phone: string;
  count: AdminPeriodCounts;
}

export interface AdminStoreBookings {
  storeId: string | null;
  storeName: string;
  totals: AdminPeriodCounts;
  users: AdminStoreBookingUser[];
}

export interface AdminUsersAnalyticsData {
  summary: {
    totalUsers: number;
    totalBookings: number;
    activeToday: number;
    totalStores: number;
  };
  users: AdminUserBooking[];
  stores: AdminStoreBookings[];
}

// التقرير المحاسبي الشامل من GET /api/v1/admin/accounting
export type AdminPeriodKey = keyof AdminPeriodCounts;

export interface AdminAccountingPeriod {
  bookings: number;
  confirmed: number;
  cancelled: number;
  pending: number;
  collected: number;
  gross: number;
  commission: number;
  net: number;
}

export interface AdminAccountingStoreUser {
  clientName: string;
  phone: string;
  count: AdminPeriodCounts;
  confirmed: AdminPeriodCounts;
  cancelled: AdminPeriodCounts;
}

export interface AdminAccountingStore {
  storeId: string | null;
  storeName: string;
  counts: AdminPeriodCounts;
  confirmed: AdminPeriodCounts;
  cancelled: AdminPeriodCounts;
  pending: AdminPeriodCounts;
  collected: AdminPeriodCounts;
  gross: AdminPeriodCounts;
  commission: AdminPeriodCounts;
  net: AdminPeriodCounts;
  users: AdminAccountingStoreUser[];
}

export interface AdminAccountingBooking {
  id: string;
  orderNumber: string;
  storeName: string;
  clientName: string;
  clientPhone: string;
  quantity: number;
  priceOmr: number;
  commissionOmr: number;
  netOmr: number;
  status: string;
  statusText: string;
  windowTime: string;
  createdAt: string;
}

export interface AdminAccountingData {
  summary: {
    periods: Record<AdminPeriodKey, AdminAccountingPeriod>;
    totalStores: number;
    totalUsers: number;
  };
  stores: AdminAccountingStore[];
  bookings: AdminAccountingBooking[];
}
