import React, { useState } from 'react';

interface PartnerSignupModalProps {
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'bakery', label: 'مخبوزات ومعجنات' },
  { value: 'supermarket', label: 'سوبرماركت وأغذية' },
  { value: 'restaurant', label: 'مطاعم وبوفيهات' },
  { value: 'cafe', label: 'مقاهي وحلويات' },
  { value: 'produce', label: 'خضار وفواكه' },
  { value: 'cooked', label: 'وجبات مطبوخة' },
  { value: 'other', label: 'أخرى' },
];

const inputCls =
  'w-full rounded-xl border border-[#e6e2f2] bg-white px-3 py-2.5 text-[13px] text-[#131b2e] transition focus:border-[#006948] focus:outline-none focus:ring-2 focus:ring-[#006948]/15';

/**
 * استمارة «سجّل مخبزك/مقهىك معنا» — تُرسل طلب انضمام للإدارة
 * عبر POST /api/v1/partnership-requests ليقوم الآدمن بالتواصل مع مقدم الطلب.
 */
export const PartnerSignupModal: React.FC<PartnerSignupModalProps> = ({ onClose }) => {
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayah, setWilayah] = useState('السيب');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('bakery');
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    setError('');
    setIsSending(true);
    try {
      const response = await fetch('/api/v1/partnership-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, storeName, phone, wilayah, area, category, notes }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'تعذر إرسال الطلب حالياً، حاول لاحقاً');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال الطلب حالياً');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="استمارة تسجيل شريك"
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-fade-up"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined mx-auto text-[52px] text-[#006948]">mark_email_read</span>
            <h3 className="mt-4 text-xl font-black text-[#131b2e]">تم استلام طلبك بنجاح! 🎉</h3>
            <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-7 text-[#3d4a42]">
              شكراً لاهتمامك بالانضمام إلى DealBox. سيتواصل معك فريقنا خلال أيام العمل
              القادمة على رقم الهاتف الذي أدخلته لاستكمال إجراءات الشراكة.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-2xl bg-[#006948] px-8 py-3 text-[14px] font-black text-white transition hover:bg-[#00855d] active:scale-95"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[#131b2e]">سجّل مخبزك / مقهاك معنا 🤝</h3>
                <p className="mt-1 text-[12.5px] leading-6 text-[#3d4a42]">
                  املأ الاستمارة وسيتواصل معك فريق DealBox لإتمام انضمام متجرك كشريك.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={submit} className="grid gap-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold text-[#3d4a42]">الاسم الكامل *</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    maxLength={80}
                    placeholder="مثال: أحمد البلوشي"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold text-[#3d4a42]">رقم الهاتف (واتساب) *</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    inputMode="tel"
                    dir="ltr"
                    maxLength={20}
                    placeholder="+968 9XXX XXXX"
                    className={`${inputCls} text-left`}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[12px] font-bold text-[#3d4a42]">اسم المخبز / المقهى / المتجر *</span>
                <input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  maxLength={80}
                  placeholder="مثال: مخبز النور — الخوض"
                  className={inputCls}
                />
              </label>

              <div className="grid gap-3.5 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold text-[#3d4a42]">الولاية</span>
                  <select value={wilayah} onChange={(e) => setWilayah(e.target.value)} className={inputCls}>
                    {['السيب', 'بوشر', 'مطرح', 'العامرات', 'صحار', 'صلالة', 'نزوى', 'بركاء'].map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold text-[#3d4a42]">المنطقة / الحي</span>
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    maxLength={60}
                    placeholder="مثال: الخوض السابعة"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-bold text-[#3d4a42]">نوع النشاط</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[12px] font-bold text-[#3d4a42]">ملاحظات إضافية (اختياري)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="أخبرنا عن متجرك: عدد الفروع، أوقات العمل، نوع المنتجات..."
                  className={`${inputCls} resize-none leading-6`}
                />
              </label>

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] font-bold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#006948] py-3.5 text-[15px] font-black text-white shadow-lg shadow-[#006948]/20 transition hover:bg-[#00855d] active:scale-[0.98] disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-[19px] ${isSending ? 'animate-spin' : ''}`}>
                  {isSending ? 'sync' : 'send'}
                </span>
                {isSending ? 'جارٍ إرسال الطلب...' : 'إرسال طلب الانضمام'}
              </button>
              <p className="text-center text-[11px] text-stone-400">
                بإرسالك الطلب أنت توافق على تواصل فريق DealBox معك هاتفياً.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
