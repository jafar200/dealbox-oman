import { BasketCategory, DealBoxItem } from '../types';

/**
 * Client feed boxes API (GET /api/v1/client/boxes)
 * The backend reads Box documents from MongoDB and populates the related Store,
 * then computes the distance from the origin (Al Khoudh by default).
 */

export interface ApiBox {
  id: string;
  storeId: string;
  storeName: string;
  storeLogoUrl?: string;
  phone?: string;
  address?: string;
  rating?: number;
  wilayah?: string;
  area?: string;
  category: BasketCategory;
  title: string;
  description: string;
  imageUrl?: string;
  expectedItems?: string[];
  originalPrice: number;
  discountedPrice: number;
  currency?: string;
  remainingCount: number;
  pickupWindow: string;
  pickupDate?: string;
  distanceKm: number;
  coordinates?: [number, number];
  createdAt?: string;
}

export interface ApiBoxesResponse {
  success: boolean;
  count: number;
  currency?: string;
  origin?: { lat: number; lng: number };
  data: ApiBox[];
  message?: string;
}

const CATEGORY_NAMES_AR: Record<BasketCategory, string> = {
  all: 'عام',
  bakery: 'مخابز ومعجنات',
  supermarket: 'سوبرماركت وأغذية',
  restaurant: 'مطاعم ووجبات',
  cooked: 'وجبات مطبوخة',
  cafe: 'مقاهي وحلويات',
  produce: 'خضار وفواكه',
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1509440192960-59e2a1e2f1e6?auto=format&fit=crop&w=800&q=80';

const buildRemainingText = (count: number): string => {
  if (count <= 0) return 'نفدت الكمية';
  if (count === 1) return 'باقي صندوق واحد';
  if (count === 2) return 'باقي صندوقين';
  return `باقي ${count} صناديق`;
};

const buildDistanceText = (distanceKm: number, area?: string): string => {
  const place = area ? ` · ${area}` : '';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} م${place}`;
  return `${distanceKm} كم${place}`;
};

export const mapApiBoxToDealBoxItem = (box: ApiBox): DealBoxItem => ({
  id: String(box.id),
  storeId: String(box.storeId),
  storeName: box.storeName,
  storeLogoUrl: box.storeLogoUrl || '',
  imageUrl: box.imageUrl || FALLBACK_IMAGE,
  category: box.category,
  categoryNameAr: CATEGORY_NAMES_AR[box.category] || 'حقائب متنوعة',
  title: box.title,
  description: box.description,
  expectedItems: box.expectedItems || [],
  remainingCount: box.remainingCount,
  remainingText: buildRemainingText(box.remainingCount),
  distanceKm: box.distanceKm,
  distanceText: buildDistanceText(box.distanceKm, box.area),
  pickupTimeText: `${box.pickupDate || 'اليوم'} ${box.pickupWindow}`,
  pickupWindow: box.pickupWindow,
  originalPrice: box.originalPrice,
  discountedPrice: box.discountedPrice,
  currency: box.currency || 'ر.ع',
  locationArea: [box.area, box.wilayah].filter(Boolean).join('، ') || 'سلطنة عُمان',
  coordinates: box.coordinates || [23.6139, 58.1963],
  phone: box.phone,
  addressDetails: box.address || 'يرجى مراجعة عنوان المتجر عند تأكيد الحجز',
  verifiedStore: true,
  createdAt: box.createdAt,
});

export const fetchDealBoxes = async (options?: {
  wilayah?: string;
  category?: Exclude<BasketCategory, 'all'>;
  maxDistance?: number;
  signal?: AbortSignal;
}): Promise<DealBoxItem[]> => {
  const params = new URLSearchParams();
  if (options?.wilayah) params.set('wilayah', options.wilayah);
  if (options?.category) params.set('category', options.category);
  if (options?.maxDistance) params.set('maxDistance', String(options.maxDistance));

  const query = params.toString();
  const response = await fetch(`/api/v1/client/boxes${query ? `?${query}` : ''}`, {
    signal: options?.signal,
  });

  const result: ApiBoxesResponse = await response.json().catch(() => ({
    success: false,
    count: 0,
    data: [],
  }));

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'تعذر تحميل الصناديق المتاحة');
  }

  return (result.data || []).map(mapApiBoxToDealBoxItem);
};
