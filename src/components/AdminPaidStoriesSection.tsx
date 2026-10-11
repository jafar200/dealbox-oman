import React, { useEffect, useState } from 'react';

interface StoryRequest {
  id: string;
  storeName: string;
  imageData: string;
  caption: string;
  feeOmr: number;
  paymentReference: string;
  paymentStatus: 'unpaid' | 'submitted' | 'confirmed';
  reviewStatus: 'pending_payment' | 'pending_review' | 'approved' | 'rejected';
  rejectionReason: string;
  createdAt: string;
}

interface AdminPaidStoriesSectionProps {
  authToken: string;
  onNotify?: (message: string) => void;
  /** ما إذا كان الدور يملك صلاحية «الإعدادات» (تحرير رسوم النشر). القصص متاحة بصلاحية «القصص» وحدها. */
  canManageSettings?: boolean;
}

interface StoreStorySettings {
  storeId: string;
  storeName: string;
  feeOmr: number;
  period: 'daily' | 'weekly' | 'monthly';
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
};

const statusLabels: Record<StoryRequest['reviewStatus'], string> = {
  pending_payment: 'بانتظار التحويل',
  pending_review: 'بانتظار مراجعة الدفع',
  approved: 'معتمدة ومنشورة',
  rejected: 'مرفوضة',
};

export const AdminPaidStoriesSection: React.FC<AdminPaidStoriesSectionProps> = ({
  authToken,
  onNotify,
  canManageSettings = true,
}) => {
  const [stories, setStories] = useState<StoryRequest[]>([]);
  const [feeOmr, setFeeOmr] = useState('');
  const [rejectionReasons, setReasons] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // إعدادات الرسوم لكل متجر
  const [storesList, setStoresList] = useState<StoreStorySettings[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeFeeOmr, setStoreFeeOmr] = useState('');
  const [storeFeePeriod, setStoreFeePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isSavingStoreFee, setIsSavingStoreFee] = useState(false);

  const authHeaders = { Authorization: `Bearer ${authToken}` };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // الأدوار بصلاحية «القصص» فقط (مثل مراقب الجودة) تشاهد القصص دون إعدادات الرسوم
      if (!canManageSettings) {
        const storiesResponse = await fetch('/api/v1/admin/stories', { headers: authHeaders });
        const storiesResult = await storiesResponse.json();
        if (!storiesResponse.ok) {
          throw new Error(storiesResult.message || 'تعذر تحميل طلبات القصص');
        }
        setStories(storiesResult.stories || []);
        setFeeOmr('');
        return;
      }
      const [storiesResponse, settingsResponse, storesResponse] = await Promise.all([
        fetch('/api/v1/admin/stories', { headers: authHeaders }),
        fetch('/api/v1/admin/story-settings', { headers: authHeaders }),
        fetch('/api/v1/admin/stores', { headers: authHeaders }),
      ]);
      const [storiesResult, settingsResult, storesResult] = await Promise.all([
        storiesResponse.json(),
        settingsResponse.json(),
        storesResponse.json(),
      ]);
      if (!storiesResponse.ok || !settingsResponse.ok || !storesResponse.ok) {
        throw new Error(storiesResult.message || settingsResult.message || 'تعذر تحميل طلبات القصص');
      }
      setStories(storiesResult.stories || []);
      setFeeOmr(String(settingsResult.storyPromotionFeeOmr || ''));
      const stores: StoreStorySettings[] = (storesResult.stores || []).map((s: any) => ({
        storeId: String(s._id),
        storeName: s.name,
        feeOmr: s.storySettings?.feeOmr ?? 0,
        period: s.storySettings?.period ?? 'weekly',
      }));
      setStoresList(stores);
      if (stores.length > 0 && !selectedStoreId) {
        setSelectedStoreId(stores[0].storeId);
        setStoreFeeOmr(String(stores[0].feeOmr));
        setStoreFeePeriod(stores[0].period);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [authToken]);

  const saveFee = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingFee(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/v1/admin/story-settings', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyPromotionFeeOmr: Number(feeOmr) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'تعذر حفظ الرسوم');
      setFeeOmr(String(result.storyPromotionFeeOmr));
      if (onNotify) onNotify('تم حفظ رسوم نشر القصة بنجاح');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر حفظ الرسوم');
    } finally {
      setIsSavingFee(false);
    }
  };

  // تحميل إعدادات متجر محدد عند اختياره من القائمة
  const onSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    const store = storesList.find((s) => s.storeId === storeId);
    if (store) {
      setStoreFeeOmr(String(store.feeOmr));
      setStoreFeePeriod(store.period);
    }
  };

  // حفظ رسوم وفترة الفوترة لمتجر محدد
  const saveStoreFee = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStoreId) return;
    setIsSavingStoreFee(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/v1/admin/stores/${selectedStoreId}/story-settings`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyFeeOmr: Number(storeFeeOmr),
          storyFeePeriod: storeFeePeriod,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'تعذر حفظ إعدادات المتجر');
      // تحديث القائمة المحلية
      setStoresList((prev) =>
        prev.map((s) =>
          s.storeId === selectedStoreId
            ? { ...s, feeOmr: Number(storeFeeOmr), period: storeFeePeriod }
            : s
        )
      );
      if (onNotify) onNotify(`تم حفظ رسوم القصص للمتجر: ${(storesList.find((s) => s.storeId === selectedStoreId) || {}).storeName || ''}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر حفظ إعدادات المتجر');
    } finally {
      setIsSavingStoreFee(false);
    }
  };

  const reviewStory = async (storyId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/v1/admin/stories/${storyId}/review`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: rejectionReasons[storyId] || '' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'تعذرت مراجعة القصة');
      if (onNotify) onNotify(action === 'approve' ? 'تم تأكيد الدفع ونشر القصة لمدة 24 ساعة' : 'تم رفض القصة وإبلاغ المتجر');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذرت مراجعة القصة');
    }
  };

  return (
    <section className="space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-black text-[#131b2e]">القصص المدفوعة ومراجعة التحويلات</h1>
        <p className="mt-1 text-sm text-stone-600">لا تظهر القصة للمستفيدين إلا بعد تأكيد الدفع واعتمادها. مدة النشر 24 ساعة.</p>
      </div>

      {canManageSettings && (
      <div className="space-y-4">
        {/* الرسوم العالمية (افتراضي للمتاجر بدون إعداد خاص) */}
        <form onSubmit={saveFee} className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1 text-sm font-bold text-stone-700">
            <span>الرسوم الافتراضية للمنصة (ر.ع) — للمتاجر بدون إعداد خاص</span>
            <input
              type="number"
              min="0.001"
              max="1000"
              step="0.001"
              required
              value={feeOmr}
              onChange={(event) => setFeeOmr(event.target.value)}
              className="h-11 w-full rounded-lg border border-stone-300 bg-stone-50 px-3 font-mono"
            />
          </label>
          <button disabled={isSavingFee} className="h-11 rounded-lg bg-[#006948] px-5 font-bold text-white disabled:opacity-60">
            {isSavingFee ? 'جارٍ الحفظ...' : 'حفظ الرسوم'}
          </button>
        </form>

        {/* إعدادات الرسوم لكل متجر */}
        <div className="rounded-xl border border-[#006948]/20 bg-gradient-to-l from-[#eefaf1] to-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#006948]">
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            <h2 className="text-sm font-black">رسوم القصص المخصصة لكل متجر</h2>
          </div>
          <p className="text-[11px] text-stone-500">
            حدد رسوم وفترة الفوترة لكل متجر على حدة — المتجر بدون إعداد يستخدم الرسوم الافتراضية أعلاه.
          </p>
          {storesList.length === 0 ? (
            <p className="text-xs text-stone-400">لا توجد متاجر مسجلة بعد.</p>
          ) : (
            <form onSubmit={saveStoreFee} className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <label className="lg:w-56 space-y-1 text-sm font-bold text-stone-700">
                <span>المتجر</span>
                <select
                  value={selectedStoreId}
                  onChange={(e) => onSelectStore(e.target.value)}
                  className="h-11 w-full rounded-lg border border-stone-300 bg-white px-3 font-semibold"
                >
                  {storesList.map((s) => (
                    <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                  ))}
                </select>
              </label>
              <label className="flex-1 space-y-1 text-sm font-bold text-stone-700">
                <span>رسوم نشر القصة (ر.ع)</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.001"
                  value={storeFeeOmr}
                  onChange={(event) => setStoreFeeOmr(event.target.value)}
                  className="h-11 w-full rounded-lg border border-stone-300 bg-white px-3 font-mono"
                />
              </label>
              <label className="lg:w-40 space-y-1 text-sm font-bold text-stone-700">
                <span>فترة الفوترة</span>
                <select
                  value={storeFeePeriod}
                  onChange={(e) => setStoreFeePeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="h-11 w-full rounded-lg border border-stone-300 bg-white px-3 font-semibold"
                >
                  <option value="daily">يومي</option>
                  <option value="weekly">أسبوعي</option>
                  <option value="monthly">شهري</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={isSavingStoreFee || !selectedStoreId}
                className="h-11 rounded-lg bg-[#006948] px-5 font-bold text-white disabled:opacity-60"
              >
                {isSavingStoreFee ? 'جارٍ الحفظ...' : 'حفظ للمتجر'}
              </button>
            </form>
          )}
          {/* جدول الإعدادات الحالية */}
          {storesList.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-500">
                    <th className="px-3 py-2 font-bold">المتجر</th>
                    <th className="px-3 py-2 font-bold">الرسوم (ر.ع)</th>
                    <th className="px-3 py-2 font-bold">الفترة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {storesList.map((s) => (
                    <tr key={s.storeId} className={s.storeId === selectedStoreId ? 'bg-[#eefaf1]' : ''}>
                      <td className="px-3 py-2 font-bold text-[#131b2e]">{s.storeName}</td>
                      <td className="px-3 py-2 font-mono">{s.feeOmr.toFixed(3)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-[#f2f3ff] px-2 py-0.5 font-bold text-[#006948]">
                          {PERIOD_LABELS[s.period]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {errorMessage && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>}
      {isLoading ? (
        <p className="py-8 text-center text-sm text-stone-500">جارٍ تحميل القصص...</p>
      ) : stories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">لا توجد طلبات قصص حتى الآن.</p>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <article key={story.id} className="grid grid-cols-1 gap-4 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-[120px_minmax(0,1fr)]">
              <img src={story.imageData} alt={`قصة ${story.storeName}`} className="h-36 w-full rounded-lg bg-stone-100 object-cover sm:h-28 sm:w-[120px]" />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-black text-[#131b2e]">{story.storeName}</h2>
                  <span className="rounded-full bg-[#f2f3ff] px-2.5 py-1 text-xs font-bold text-[#006948]">{statusLabels[story.reviewStatus]}</span>
                </div>
                {story.caption && <p className="text-sm text-stone-700">{story.caption}</p>}
                <p className="text-sm text-stone-600">الرسوم: <bdi dir="ltr" className="font-mono font-bold">{story.feeOmr.toFixed(3)} ر.ع</bdi></p>
                {story.paymentReference && <p className="text-sm text-stone-600">مرجع التحويل: <bdi dir="ltr" className="font-mono font-bold">{story.paymentReference}</bdi></p>}
                {story.rejectionReason && <p className="text-sm text-red-700">سبب الرفض: {story.rejectionReason}</p>}
                {story.reviewStatus === 'pending_review' && (
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                    <button type="button" onClick={() => void reviewStory(story.id, 'approve')} className="h-10 rounded-lg bg-[#006948] px-4 text-sm font-bold text-white">
                      تأكيد الدفع والموافقة
                    </button>
                    <input
                      value={rejectionReasons[story.id] || ''}
                      onChange={(event) => setReasons((previous) => ({ ...previous, [story.id]: event.target.value }))}
                      placeholder="سبب الرفض"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-stone-300 px-3 text-sm"
                    />
                    <button type="button" onClick={() => void reviewStory(story.id, 'reject')} className="h-10 rounded-lg border border-red-300 px-4 text-sm font-bold text-red-700">
                      رفض
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};