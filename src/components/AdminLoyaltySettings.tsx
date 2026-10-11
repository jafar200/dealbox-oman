import React, { useEffect, useState } from 'react';

interface AdminLoyaltySettingsProps {
  authToken: string;
  onNotify?: (message: string) => void;
}

/**
 * إعداد خصم الولاء الذي يحصل عليه المستفيد بعد 10 عمليات شراء مكتملة. يضبطه الأدمن،
 * ويُطبَّق على سعر كل النماذج المعروضة للمستفيد عبر لاحقة محورة.
 */
export const AdminLoyaltySettings: React.FC<AdminLoyaltySettingsProps> = ({ authToken, onNotify }) => {
  const [percent, setPercent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const authHeaders = { Authorization: `Bearer ${authToken}` };

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/v1/admin/loyalty', { headers: authHeaders });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'تعذر التحميل');
        if (isActive) setPercent(String(result.loyaltyDiscountPercent ?? ''));
      } catch (error) {
        if (isActive) setErrorMessage(error instanceof Error ? error.message : 'تعذر الاتصال');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => { isActive = false; };
  }, [authToken]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/v1/admin/loyalty', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ loyaltyDiscountPercent: Number(percent) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'تعذر الحفظ');
      setPercent(String(result.loyaltyDiscountPercent));
      if (onNotify) onNotify('تم حفظ خصم الولاء بنجاح');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir="rtl" className="rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="mb-1 text-sm font-black text-[#131b2e]">مكافآت الولاء للمستفيدين</h2>
      <p className="mb-3 text-xs leading-5 text-stone-600">
        بعد 10 عمليات استلام مؤكّدة من قبل المتاجر (`status: collected`)، يحصل المستفيد على خصم إضافي على الطلبات الجديدة بالنسبة التي تحددها أدناه.
      </p>
      <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm font-bold text-stone-700">
          <span>نسبة الخصم الإضافي (%)</span>
          <input
            type="number"
            min="0"
            max="80"
            step="0.5"
            required
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            placeholder="مثال: 10"
            className="h-11 w-full rounded-lg border border-stone-300 bg-stone-50 px-3 font-mono"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving || isLoading}
          className="h-11 rounded-lg bg-[#006948] px-5 font-bold text-white disabled:opacity-60"
        >
          {isSaving ? 'جارٍ الحفظ...' : 'حفظ النسبة'}
        </button>
      </form>
      {errorMessage && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>
      )}
    </div>
  );
};
