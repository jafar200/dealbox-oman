import React, { useEffect, useState } from 'react';

interface AdminAnnouncementSettingsProps {
  authToken: string;
  onNotify?: (message: string) => void;
}

interface AnnouncementState {
  announcementTitle: string;
  announcementBody: string;
  announcementActive: boolean;
  announcementPublishedAt: string | null;
}

/**
 * التنبيه العام للتطبيق: ينشره الأدمن من الإعدادات ويظهر لكل المستفيدين
 * على هواتفهم (بانر أعلى الرئيسية + بطاقة داخل نافذة التنبيهات + نقطة عدم القراءة).
 */
export const AdminAnnouncementSettings: React.FC<AdminAnnouncementSettingsProps> = ({ authToken, onNotify }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [active, setActive] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const authHeaders = { Authorization: `Bearer ${authToken}` };

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/v1/admin/announcement', { headers: authHeaders });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'تعذر التحميل');
        if (isActive) {
          setTitle(result.announcementTitle || '');
          setBody(result.announcementBody || '');
          setActive(result.announcementActive === true);
          setPublishedAt(result.announcementPublishedAt || null);
        }
      } catch (error) {
        if (isActive) setErrorMessage(error instanceof Error ? error.message : 'تعذر الاتصال');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => { isActive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const save = async (event: React.FormEvent, publishActive: boolean) => {
    event.preventDefault();
    if (publishActive && (!title.trim() || !body.trim())) {
      setErrorMessage('اكتب عنوان التنبيه ونصّه قبل النشر');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/v1/admin/announcement', {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementTitle: title.trim(),
          announcementBody: body.trim(),
          announcementActive: publishActive,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'تعذر الحفظ');
      setTitle(result.announcementTitle);
      setBody(result.announcementBody);
      setActive(result.announcementActive);
      setPublishedAt(result.announcementPublishedAt || null);
      if (onNotify) {
        onNotify(publishActive ? 'تم نشر التنبيه العام لكل المستفيدين' : 'تم حفظ التنبيه العام');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir="rtl" className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-black text-[#131b2e]">التنبيه العام للتطبيق</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            active ? 'bg-[#f5fff6] text-[#006948] border border-[#006948]/20' : 'bg-stone-100 text-stone-500 border border-stone-200'
          }`}
        >
          {active ? 'منشور الآن' : 'غير منشور'}
        </span>
      </div>
      <p className="mb-3 text-xs leading-5 text-stone-600">
        اكتب تنبيهاً عاماً واحداً يظهر لكل المستفيدين على هواتفهم: بانر أعلى الرئيسية وبطاقة داخل نافذة التنبيهات مع نقطة عدم قراءة.
        {publishedAt && ` آخر نشر: ${new Date(publishedAt).toLocaleString('ar-OM')}`}
      </p>

      <form onSubmit={(e) => save(e, true)} className="flex flex-col gap-3">
        <label className="space-y-1 text-sm font-bold text-stone-700">
          <span>عنوان التنبيه</span>
          <input
            type="text"
            maxLength={120}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: عرض نهاية الأسبوع — خصم إضافي 20%"
            className="h-11 w-full rounded-lg border border-stone-300 bg-stone-50 px-3"
          />
        </label>
        <label className="space-y-1 text-sm font-bold text-stone-700">
          <span>نص التنبيه</span>
          <textarea
            maxLength={600}
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب تفاصيل التنبيه التي تظهر للمستفيدين..."
            className="w-full resize-y rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm leading-6"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="h-11 rounded-lg bg-[#006948] px-5 font-bold text-white disabled:opacity-60"
          >
            {isSaving ? 'جارٍ الحفظ...' : 'نشر للجميع'}
          </button>
          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={(e) => save(e, active)}
            className="h-11 rounded-lg border border-stone-300 bg-white px-5 font-bold text-stone-700 disabled:opacity-60"
          >
            حفظ كمسودة
          </button>
          {active && (
            <button
              type="button"
              disabled={isSaving || isLoading}
              onClick={(e) => save(e, false)}
              className="h-11 rounded-lg border border-red-200 bg-red-50 px-5 font-bold text-red-700 disabled:opacity-60"
            >
              إيقاف العرض
            </button>
          )}
        </div>
      </form>

      {errorMessage && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>
      )}
    </div>
  );
};
