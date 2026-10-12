import React, { useCallback, useEffect, useState } from 'react';
import type { PartnerRequest } from '../types';

interface AdminPartnerRequestsSectionProps {
  authToken: string;
  onNotify?: (message: string) => void;
  /** يُبلَّغ به الأب لتحديث شارة العدد في الشريط الجانبي */
  onCountChange?: (newCount: number) => void;
}

const STATUS_TABS: { key: PartnerRequest['status'] | 'all'; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'new', label: 'طلبات جديدة' },
  { key: 'contacted', label: 'تم التواصل' },
  { key: 'approved', label: 'مقبول' },
  { key: 'rejected', label: 'مرفوض' },
];

const STATUS_BADGE: Record<PartnerRequest['status'], string> = {
  new: 'bg-[#fea619]/15 text-[#855300]',
  contacted: 'bg-[#e2e7ff] text-[#3d4a72]',
  approved: 'bg-[#006948]/10 text-[#006948]',
  rejected: 'bg-red-50 text-red-700',
};

/**
 * قسم «طلبات انضمام الشركاء» — يعرض استمارات التسجيل الواردة من الموقع
 * التسويقي ليقوم الآدمن بالتواصل مع مقدميها وتحديث حالتها.
 */
export const AdminPartnerRequestsSection: React.FC<AdminPartnerRequestsSectionProps> = ({
  authToken,
  onNotify,
  onCountChange,
}) => {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [filter, setFilter] = useState<PartnerRequest['status'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/v1/admin/partner-requests', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'تعذر تحميل طلبات الانضمام');
      }
      setRequests(result.requests || []);
      setNewCount(result.newCount || 0);
      onCountChange?.(result.newCount || 0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateStatus = async (id: string, status: PartnerRequest['status']) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/v1/admin/partner-requests/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'تعذر تحديث الطلب');
      }
      setRequests((prev) => prev.map((r) => (r.id === id ? result.request : r)));
      if (status !== 'new') {
        setNewCount((c) => {
          const next = Math.max(0, c - (requests.find((r) => r.id === id)?.status === 'new' ? 1 : 0));
          onCountChange?.(next);
          return next;
        });
      }
      onNotify?.('تم تحديث حالة الطلب بنجاح');
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : 'تعذر تحديث الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ar-OM', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#131b2e]">طلبات انضمام الشركاء 🤝</h1>
          <p className="mt-1 text-sm text-stone-600">
            استمارات «سجّل مخبزك/مقهىك معنا» من الموقع التسويقي — تواصل مع مقدم الطلب هاتفياً ثم حدّث الحالة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fea619] px-3 py-1.5 text-xs font-black text-[#684000]">
              <span className="material-symbols-outlined text-[15px]">mark_email_unread</span>
              {newCount} جديد
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-600 transition hover:bg-stone-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>sync</span>
            تحديث
          </button>
        </div>
      </div>

      {/* فلتر الحالات */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
              filter === t.key
                ? 'bg-[#006948] text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {t.label}
            {t.key === 'new' && newCount > 0 && (
              <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-black ${filter === 'new' ? 'bg-white/25 text-white' : 'bg-[#fea619] text-[#684000]'}`}>
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-stone-500">جارٍ تحميل الطلبات...</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <span className="material-symbols-outlined mx-auto text-[36px] text-stone-300">inbox</span>
          <p className="mt-2 text-sm font-bold text-stone-500">لا توجد طلبات في هذا التصنيف</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((r) => (
            <article key={r.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-black text-[#131b2e]">{r.storeName}</h2>
                  <p className="text-xs text-stone-500 mt-0.5">مقدم الطلب: {r.fullName}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_BADGE[r.status]}`}>
                  {r.statusLabel}
                </span>
              </div>

              <div className="grid gap-1.5 text-xs text-stone-600">
                <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 font-bold text-[#006948] hover:underline" dir="ltr">
                  <span className="material-symbols-outlined text-[15px]">call</span>
                  <span>{r.phone}</span>
                </a>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-stone-400">location_on</span>
                  {r.wilayah}{r.area ? ` — ${r.area}` : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-stone-400">sell</span>
                  {r.categoryLabel}
                </span>
                {r.notes && (
                  <p className="rounded-lg bg-stone-50 px-3 py-2 leading-6 text-stone-600">«{r.notes}»</p>
                )}
                <span className="text-[10.5px] text-stone-400">وصل بتاريخ: {formatDate(r.createdAt)}</span>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  disabled={updatingId === r.id || r.status === 'contacted'}
                  onClick={() => void updateStatus(r.id, 'contacted')}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#e2e7ff] px-3 py-1.5 text-[11px] font-bold text-[#3d4a72] transition hover:bg-[#d4dcff] disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[14px]">phone_callback</span>
                  تم التواصل
                </button>
                <button
                  type="button"
                  disabled={updatingId === r.id || r.status === 'approved'}
                  onClick={() => void updateStatus(r.id, 'approved')}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#006948] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#00855d] disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  قبول
                </button>
                <button
                  type="button"
                  disabled={updatingId === r.id || r.status === 'rejected'}
                  onClick={() => void updateStatus(r.id, 'rejected')}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[14px]">cancel</span>
                  رفض
                </button>
                {updatingId === r.id && (
                  <span className="material-symbols-outlined animate-spin text-[16px] text-stone-400">sync</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
