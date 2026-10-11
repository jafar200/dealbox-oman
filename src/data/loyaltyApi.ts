import { useEffect, useState } from 'react';
import { readClientSession } from './clientSession';

/**
 * نسبة خصم الولاء الفعلية للمستفيد المسجّل دخوله.
 * تعيد 0 إذا لم يكن مؤهلاً (أقل من 10 عمليات شراء) أو غير مسجّل.
 */
export const fetchLoyaltyDiscount = async (): Promise<number> => {
  const token = readClientSession()?.token;
  if (!token) return 0;
  try {
    const result = await fetch('/api/v1/client/loyalty', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    return result?.success && result.eligible ? Number(result.loyaltyDiscountPercent) || 0 : 0;
  } catch {
    return 0;
  }
};

/** خطافة React تعيد نسبة خصم الولاء الفعّالة للمستخدم الحالي. */
export const useLoyaltyDiscount = (): number => {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      const p = await fetchLoyaltyDiscount();
      if (active) setPct(p);
    })();
    return () => { active = false; };
  }, []);

  return pct;
};

/** يطبّق نسبة الولاء على سعر معين، ويعيد السعر الأصلي إن كانت 0. */
export const applyLoyalty = (price: number, pct: number): number =>
  (pct > 0 ? price * (1 - pct / 100) : price);
