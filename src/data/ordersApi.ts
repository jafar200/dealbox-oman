import { Reservation } from '../types';
import { readClientSession } from './clientSession';

/**
 * Client orders API (POST/GET /api/v1/client/orders)
 * Reservations are persisted by the backend in the `Order` collection and the
 * booking code (DB-XXXX) is generated server side so it stays unique.
 */

export const readClientToken = (): string | null => readClientSession()?.token ?? null;

interface ApiOrder {
  id: string;
  boxId: string;
  storeName: string;
  title: string;
  quantity?: number;
  pricePaid: number;
  originalPrice: number;
  currency: string;
  pickupCode: string;
  pickupTimeWindow: string;
  status: 'pending' | 'collected' | 'cancelled';
  createdAt: string;
}

interface ApiOrderResponse {
  success: boolean;
  message?: string;
  data?: ApiOrder;
}

interface ApiOrdersResponse {
  success: boolean;
  message?: string;
  count?: number;
  orders?: ApiOrder[];
}

const toReservation = (order: ApiOrder): Reservation => ({
  id: order.id,
  boxId: order.boxId,
  storeName: order.storeName,
  title: order.title,
  imageUrl: undefined,
  pickupTimeWindow: order.pickupTimeWindow,
  pricePaid: order.pricePaid,
  originalPrice: order.originalPrice,
  currency: order.currency || 'ر.ع',
  pickupCode: order.pickupCode,
  createdAt: formatCreatedAt(order.createdAt),
  status: mapStatus(order.status),
  addressDetails: '',
  phone: '+968 0000 0000',
  quantity: order.quantity ?? 1,
});

const mapStatus = (status: ApiOrder['status']): Reservation['status'] => {
  if (status === 'collected') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
};

const formatCreatedAt = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Places a booking. Falls back to a client-generated code only when the
 * session is missing (guest browsing), otherwise the backend owns the code.
 */
export const createOrder = async (
  boxId: string,
  quantity: number
): Promise<Reservation> => {
  const token = readClientToken();

  const response = await fetch('/api/v1/client/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ boxId, quantity }),
  });

  const result: ApiOrderResponse = await response.json().catch(() => ({
    success: false,
  }));

  if (response.status === 401) {
    throw new Error('يلزم تسجيل الدخول لتأكيد الحجز');
  }
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || 'تعذر إتمام الحجز');
  }

  return toReservation(result.data);
};

export const fetchMyOrders = async (options?: { signal?: AbortSignal }): Promise<Reservation[]> => {
  const token = readClientToken();
  if (!token) return [];

  const response = await fetch('/api/v1/client/orders', {
    headers: { Authorization: `Bearer ${token}` },
    signal: options?.signal,
  });

  const result: ApiOrdersResponse = await response.json().catch(() => ({
    success: false,
  }));

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'تعذر تحميل طلباتك');
  }

  return (result.orders || []).map(toReservation);
};
