import React, { useEffect, useRef, useState } from 'react';
import type {
  MarketingSiteContent,
  MarketingOffer,
  MarketingIconItem,
  MarketingGrowthHack,
  MarketingImpactStat,
  MarketingCampaign,
  MarketingPartnerBullet,
} from '../types';
import { DEFAULT_MARKETING_CONTENT } from '../marketingDefaults';

interface AdminMarketingEditorProps {
  authToken?: string;
  onNotify?: (msg: string) => void;
}

/* ===== عناصر تحكم صغيرة ===== */
const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
  dirLtr?: boolean;
}> = ({ label, value, onChange, textarea, placeholder, dirLtr }) => (
  <label className="block">
    <span className="mb-1 block text-[11.5px] font-bold text-[#3d4a42]">{label}</span>
    {textarea ? (
      <textarea
        value={value}
        placeholder={placeholder}
        dir={dirLtr ? 'ltr' : 'rtl'}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#e6e2f2] bg-white px-3 py-2 text-[13px] leading-6 text-[#131b2e] transition focus:border-[#006948] focus:outline-none focus:ring-2 focus:ring-[#006948]/15"
      />
    ) : (
      <input
        value={value}
        placeholder={placeholder}
        dir={dirLtr ? 'ltr' : 'rtl'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#e6e2f2] bg-white px-3 py-2 text-[13px] text-[#131b2e] transition focus:border-[#006948] focus:outline-none focus:ring-2 focus:ring-[#006948]/15"
      />
    )}
  </label>
);

const IconField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-[11.5px] font-bold text-[#3d4a42]">{label}</span>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined rounded-lg bg-[#eefaf1] px-1.5 text-[#006948] text-[22px]">
        {value || 'add'}
      </span>
      <input
        value={value}
        placeholder="اسم الأيقونة (material symbols)"
        dir="ltr"
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#e6e2f2] bg-white px-3 py-2 text-[12px] text-[#131b2e] transition focus:border-[#006948] focus:outline-none focus:ring-2 focus:ring-[#006948]/15"
      />
    </div>
  </label>
);

/* ===== محرر قوائم العناصر ===== */
function ListEditor<T extends object>(props: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderFields: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  emptyLabel: string;
  maxItems?: number;
}) {
  const { title, items, onChange, renderFields, emptyLabel, maxItems = 12 } = props;
  const updateAt = (index: number, patch: Partial<T>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index));
  const addNew = () => {
    if (items.length >= maxItems) return;
    const sample = (items[items.length - 1] ?? {}) as Record<string, unknown>;
    const blank: T = {} as T;
    for (const k of Object.keys(sample)) {
      const v = sample[k];
      (blank as Record<string, unknown>)[k] = typeof v === 'number' ? 0 : '';
    }
    onChange([...items, blank]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-black text-[#131b2e]">{title}</h4>
        <button
          type="button"
          onClick={addNew}
          disabled={items.length >= maxItems}
          className="inline-flex items-center gap-1 rounded-lg bg-[#006948] px-3 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-[#00855d] disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          إضافة عنصر
        </button>
      </div>

      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-[#e6e2f2] px-4 py-6 text-center text-[12px] text-[#a9a2bd]">
          {emptyLabel}
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className="relative space-y-3 rounded-2xl border border-[#eeeaf7] bg-[#fcfcff] p-4">
          <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#131b2e] text-[10.5px] font-black text-white">
            {i + 1}
          </span>
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="absolute left-3 top-10 rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
            title="حذف العنصر"
          >
            <span className="material-symbols-outlined text-[17px]">delete</span>
          </button>
          {renderFields(item, (patch) => updateAt(i, patch))}
        </div>
      ))}
    </div>
  );
}

/* ===== قسم قابل للطي ===== */
const CollapsibleSection: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eeeaf7] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-right transition hover:bg-[#fcfcff]"
      >
        <span className="flex items-center gap-2.5">
          <span className="material-symbols-outlined rounded-xl bg-[#eefaf1] p-1.5 text-[#006948] text-[20px]">{icon}</span>
          <span className="text-[14px] font-black">{title}</span>
        </span>
        <span className={`material-symbols-outlined text-[20px] text-[#a9a2bd] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {open && <div className="border-t border-[#f0edf8] px-5 py-5">{children}</div>}
    </div>
  );
};

/* ===== المحرر الرئيسي ===== */
export const AdminMarketingEditor: React.FC<AdminMarketingEditorProps> = ({ authToken, onNotify }) => {
  const [content, setContent] = useState<MarketingSiteContent>(DEFAULT_MARKETING_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  /* جلب المحتوى الحالي */
  useEffect(() => {
    if (!authToken) return;
    let isActive = true;
    setIsLoading(true);
    fetch('/api/v1/admin/marketing', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((result) => {
        if (!isActive) return;
        if (result?.success && result.content) {
          setContent({ ...DEFAULT_MARKETING_CONTENT, ...result.content });
        }
        setIsLoading(false);
      })
      .catch(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [authToken]);

  const update = <K extends keyof MarketingSiteContent>(section: K, patch: Partial<MarketingSiteContent[K]>) => {
    setContent((c) => ({ ...c, [section]: { ...c[section], ...patch } }));
  };

  /* حفظ المحتوى */
  const save = async () => {
    if (!authToken) return;
    setIsSaving(true);
    try {
      const r = await fetch('/api/v1/admin/marketing', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const result = await r.json();
      if (!r.ok || !result.success) {
        onNotify?.(result.message || 'تعذر حفظ المحتوى التسويقي');
        return;
      }
      setContent({ ...DEFAULT_MARKETING_CONTENT, ...result.content });
      onNotify?.('تم حفظ المحتوى التسويقي بنجاح — الموقع محدّث الآن');
    } catch {
      onNotify?.('تعذر الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  /* رفع صورة */
  const uploadImage = (slot: 'logo' | 'hero' | 'download') => {
    const input = fileInputs.current[slot];
    input?.click();
  };

  const handleFile = async (slot: 'logo' | 'hero' | 'download', file: File | undefined) => {
    if (!file || !authToken) return;
    const form = new FormData();
    form.append('image', file);
    form.append('slot', slot);
    setUploadingSlots((s) => ({ ...s, [slot]: true }));
    try {
      const r = await fetch('/api/v1/admin/marketing/images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form,
      });
      const result = await r.json();
      if (!r.ok || !result.success) {
        onNotify?.(result.message || 'تعذر رفع الصورة');
        return;
      }
      setContent((c) => ({
        ...c,
        images: {
          ...c.images,
          logoUrl: slot === 'logo' ? result.url : c.images.logoUrl,
          heroImageUrl: slot === 'hero' ? result.url : c.images.heroImageUrl,
          downloadImageUrl: slot === 'download' ? result.url : c.images.downloadImageUrl,
        },
      }));
      onNotify?.('تم رفع الصورة بنجاح');
    } catch {
      onNotify?.('تعذر رفع الصورة');
    } finally {
      setUploadingSlots((s) => ({ ...s, [slot]: false }));
    }
  };

  const slotLabels: Record<string, { title: string; hint: string }> = {
    logo: { title: 'شعار الموقع', hint: 'يظهر في أعلى و أسفل الصفحة — مربع (1:1) مثل 512×512' },
    hero: { title: 'صورة الهيدر الرئيسي', hint: 'تظهر أسفل العنوان — عرض مثالي 1200×630' },
    download: { title: 'صورة قسم التحميل', hint: 'تظهر فوق أزرار المتاجر — مثل صورة QR أو لقطّة الهاتف' },
  };

  return (
    <div className="space-y-5">
      {/* شريط العناوين */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-black text-[#131b2e]">إدارة المحتوى التسويقي للموقع</h3>
          <p className="mt-0.5 text-[12px] text-[#3d4a42]">
            تحكّم كامل بكل نصوص وأقسام الموقع التسويقي — التغييرات تظهر فور الحفظ على الصفحة الرئيسية.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6e2f2] bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#3d4a42] transition hover:border-[#006948]/40 hover:text-[#006948]"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            معاينة الموقع
          </a>
          <button
            type="button"
            onClick={save}
            disabled={isSaving || isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#006948] px-5 py-2.5 text-[12.5px] font-bold text-white shadow-sm transition hover:bg-[#00855d] disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSaving ? 'animate-spin' : ''}`}>
              {isSaving ? 'sync' : 'save'}
            </span>
            حفظ التغييرات
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[#a9a2bd]">
          <span className="material-symbols-outlined animate-spin text-[30px]">sync</span>
          <span className="text-[13px]">جاري تحميل المحتوى التسويقي…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ===== SEO ===== */}
          <CollapsibleSection title="تحسين محركات البحث (SEO)" icon="search" defaultOpen>
            <div className="space-y-3">
              <Field label="عنوان الصفحة (Title)" value={content.seo.title} onChange={(v) => update('seo', { title: v })} />
              <Field label="الوصف (Meta Description)" value={content.seo.description} onChange={(v) => update('seo', { description: v })} textarea placeholder="يظهر في نتائج البحث — حتى 500 حرف" />
              <Field label="الكلمات المفتاحية (Keywords)" value={content.seo.keywords} onChange={(v) => update('seo', { keywords: v })} placeholder="DealBox, عُمان, مخابز, خصومات" />
              <Field label="صورة المشاركة في المواقع (OG Image URL)" value={content.seo.ogImage} onChange={(v) => update('seo', { ogImage: v })} dirLtr placeholder="https://…" />
            </div>
          </CollapsibleSection>

          {/* ===== الهيدر ===== */}
          <CollapsibleSection title="الهيدر الرئيسي (Hero)" icon="hero" defaultOpen>
            <div className="space-y-3">
              <Field label="نص الشارة العلوية" value={content.hero.badgeText} onChange={(v) => update('hero', { badgeText: v })} />
              <Field label="الشعار الرئيسي (العنوان الكبير)" value={content.hero.tagline} onChange={(v) => update('hero', { tagline: v })} />
              <Field label="النص الفرعي" value={content.hero.subtitle} onChange={(v) => update('hero', { subtitle: v })} textarea />
              <Field label="سطر التمييز (يظهر باللون الفيروزي)" value={content.hero.highlightLine} onChange={(v) => update('hero', { highlightLine: v })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="زر الزبائن" value={content.hero.ctaClientText} onChange={(v) => update('hero', { ctaClientText: v })} />
                <Field label="زر المتاجر" value={content.hero.ctaStoreText} onChange={(v) => update('hero', { ctaStoreText: v })} />
              </div>
              <Field
                label="الشرائح الموثوقة (كل شريحة في سطر منفصل)"
                value={content.hero.chips.join('\n')}
                onChange={(v) => update('hero', { chips: v.split('\n').map((s) => s.trim()).filter(Boolean) })}
                textarea
              />
            </div>
          </CollapsibleSection>

          {/* ===== العروض ===== */}
          <CollapsibleSection title="صناديق العروض اليوم" icon="local_offer">
            <ListEditor<MarketingOffer>
              title="العروض"
              items={content.offers}
              emptyLabel="لا توجد عروض — أضف أول عرض"
              onChange={(offers) => setContent((c) => ({ ...c, offers }))}
              renderFields={(o, patch) => (
                <>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="الإيموجي" value={o.emoji} onChange={(v) => patch({ emoji: v })} />
                    <Field label="اسم المتجر" value={o.store} onChange={(v) => patch({ store: v })} />
                    <Field label="الوسم" value={o.tag} onChange={(v) => patch({ tag: v })} />
                    <Field label="نسبة التوفير" value={o.save} onChange={(v) => patch({ save: v })} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="عنوان الصندوق" value={o.title} onChange={(v) => patch({ title: v })} />
                    <Field label="السعر الجديد" value={o.newPrice} onChange={(v) => patch({ newPrice: v })} />
                    <Field label="السعر القديم" value={o.oldPrice} onChange={(v) => patch({ oldPrice: v })} />
                  </div>
                </>
              )}
            />
          </CollapsibleSection>

          {/* ===== شريط القيمة ===== */}
          <CollapsibleSection title="شريط القيمة (لماذا DealBox؟)" icon="stars">
            <ListEditor<MarketingIconItem>
              title="عناصر شريط القيمة (حتى 4)"
              items={content.valueBand}
              emptyLabel="لا توجد عناصر"
              maxItems={4}
              onChange={(valueBand) => setContent((c) => ({ ...c, valueBand }))}
              renderFields={(x, patch) => (
                <div className="grid gap-3 pr-8 sm:grid-cols-3">
                  <IconField label="الأيقونة" value={x.icon} onChange={(v) => patch({ icon: v })} />
                  <Field label="العنوان" value={x.title} onChange={(v) => patch({ title: v })} />
                  <Field label="الوصف" value={x.desc ?? ''} onChange={(v) => patch({ desc: v })} />
                </div>
              )}
            />
          </CollapsibleSection>

          {/* ===== المميزات ===== */}
          <CollapsibleSection title="قسم المميزات" icon="auto_awesome">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <Field label="عنوان القسم" value={content.features.sectionTitle} onChange={(v) => update('features', { sectionTitle: v })} />
              <Field label="النص التعريفي" value={content.features.sectionSub} onChange={(v) => update('features', { sectionSub: v })} />
            </div>
            <ListEditor<MarketingIconItem>
              title="بطاقات المميزات"
              items={content.features.items}
              emptyLabel="لا توجد مميزات"
              onChange={(items) => update('features', { items })}
              renderFields={(x, patch) => (
                <div className="grid gap-3 pr-8 sm:grid-cols-3">
                  <IconField label="الأيقونة" value={x.icon} onChange={(v) => patch({ icon: v })} />
                  <Field label="العنوان" value={x.title} onChange={(v) => patch({ title: v })} />
                  <Field label="الوصف" value={x.desc ?? ''} onChange={(v) => patch({ desc: v })} />
                </div>
              )}
            />
          </CollapsibleSection>

          {/* ===== كيف يعمل ===== */}
          <CollapsibleSection title="قسم «كيف يعمل»" icon="route">
            <div className="mb-4">
              <Field label="عنوان القسم" value={content.steps.sectionTitle} onChange={(v) => update('steps', { sectionTitle: v })} />
            </div>
            <ListEditor<MarketingIconItem>
              title="الخطوات"
              items={content.steps.items}
              emptyLabel="لا توجد خطوات"
              maxItems={6}
              onChange={(items) => update('steps', { items })}
              renderFields={(x, patch) => (
                <div className="grid gap-3 pr-8 sm:grid-cols-3">
                  <IconField label="الأيقونة" value={x.icon} onChange={(v) => patch({ icon: v })} />
                  <Field label="عنوان الخطوة" value={x.title} onChange={(v) => patch({ title: v })} />
                  <Field label="الوصف" value={x.desc ?? ''} onChange={(v) => patch({ desc: v })} />
                </div>
              )}
            />
          </CollapsibleSection>

          {/* ===== محفزات النمو ===== */}
          <CollapsibleSection title="محفزات النمو (التوصية والفلاش سيلز)" icon="rocket_launch">
            <ListEditor<MarketingGrowthHack>
              title="المحفزات"
              items={content.growthHacks}
              emptyLabel="لا توجد محفزات"
              maxItems={4}
              onChange={(growthHacks) => setContent((c) => ({ ...c, growthHacks }))}
              renderFields={(g, patch) => (
                <>
                  <div className="grid gap-3 pr-8 sm:grid-cols-2">
                    <IconField label="الأيقونة" value={g.icon} onChange={(v) => patch({ icon: v })} />
                    <Field label="العنوان" value={g.title} onChange={(v) => patch({ title: v })} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="العنوان الفرعي البارز" value={g.headline} onChange={(v) => patch({ headline: v })} />
                    <Field label="الوصف" value={g.desc} onChange={(v) => patch({ desc: v })} />
                  </div>
                </>
              )}
            />
          </CollapsibleSection>

          {/* ===== الأثر ===== */}
          <CollapsibleSection title="الأثر بالأرقام (عدّادات متحركة)" icon="monitor_heart">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <Field label="عنوان القسم" value={content.impact.sectionTitle} onChange={(v) => update('impact', { sectionTitle: v })} />
              <Field label="النص التعريفي" value={content.impact.sectionSub} onChange={(v) => update('impact', { sectionSub: v })} />
            </div>
            <ListEditor<MarketingImpactStat>
              title="الأرقام"
              items={content.impact.stats}
              emptyLabel="لا توجد أرقام"
              maxItems={6}
              onChange={(stats) => update('impact', { stats })}
              renderFields={(s, patch) => (
                <div className="grid gap-3 pr-8 sm:grid-cols-4">
                  <IconField label="الأيقونة" value={s.icon} onChange={(v) => patch({ icon: v })} />
                  <Field label="القيمة (رقم)" value={String(s.value)} onChange={(v) => patch({ value: Number(v) || 0 })} />
                  <Field label="المنازل العشرية (0-2)" value={String(s.decimals)} onChange={(v) => patch({ decimals: Math.min(2, Math.max(0, Number(v) || 0)) })} />
                  <Field label="الوصف" value={s.label} onChange={(v) => patch({ label: v })} />
                </div>
              )}
            />
          </CollapsibleSection>

          {/* ===== الحملات ===== */}
          <CollapsibleSection title="حملات الإطلاق" icon="campaign">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Field label="نص الشارة" value={content.campaigns.sectionBadge} onChange={(v) => update('campaigns', { sectionBadge: v })} />
              <Field label="عنوان القسم" value={content.campaigns.sectionTitle} onChange={(v) => update('campaigns', { sectionTitle: v })} />
              <Field label="النص التعريفي" value={content.campaigns.sectionSub} onChange={(v) => update('campaigns', { sectionSub: v })} />
            </div>
            <ListEditor<MarketingCampaign>
              title="الحملات"
              items={content.campaigns.items}
              emptyLabel="لا توجد حملات"
              maxItems={6}
              onChange={(items) => update('campaigns', { items })}
              renderFields={(c, patch) => (
                <>
                  <div className="grid gap-3 pr-8 sm:grid-cols-3">
                    <IconField label="الأيقونة" value={c.icon} onChange={(v) => patch({ icon: v })} />
                    <Field label="القناة (بالعربية)" value={c.channel} onChange={(v) => patch({ channel: v })} />
                    <Field label="اسم القناة (إنجليزي)" value={c.name} onChange={(v) => patch({ name: v })} dirLtr />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="وصف الحملة" value={c.desc} onChange={(v) => patch({ desc: v })} textarea />
                    <Field label="الجمهور المستهدف" value={c.audience} onChange={(v) => patch({ audience: v })} />
                  </div>
                </>
              )}
            />
          </CollapsibleSection>

          {/* ===== المتاجر الشريكة ===== */}
          <CollapsibleSection title="قسم المتاجر الشريكة" icon="storefront">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نص الشارة" value={content.partners.badge} onChange={(v) => update('partners', { badge: v })} />
                <Field label="عنوان القسم" value={content.partners.title} onChange={(v) => update('partners', { title: v })} />
              </div>
              <Field label="النص التعريفي" value={content.partners.intro} onChange={(v) => update('partners', { intro: v })} textarea />
              <ListEditor<MarketingPartnerBullet>
                title="نقاط البيع للمتاجر"
                items={content.partners.bullets}
                emptyLabel="لا توجد نقاط"
                maxItems={6}
                onChange={(bullets) => update('partners', { bullets })}
                renderFields={(b, patch) => (
                  <div className="grid gap-3 pr-8 sm:grid-cols-3">
                    <IconField label="الأيقونة" value={b.icon} onChange={(v) => patch({ icon: v })} />
                    <Field label="العنوان" value={b.title} onChange={(v) => patch({ title: v })} />
                    <Field label="الوصف" value={b.desc ?? ''} onChange={(v) => patch({ desc: v })} />
                  </div>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نص زر التسجيل" value={content.partners.ctaText} onChange={(v) => update('partners', { ctaText: v })} />
                <Field label="عنوان «معادلة رابحة»" value={content.partners.equationTitle} onChange={(v) => update('partners', { equationTitle: v })} />
              </div>
              <Field label="نص المعادلة" value={content.partners.equationText} onChange={(v) => update('partners', { equationText: v })} textarea />
              <Field label="عنوان دليل الشريك" value={content.partners.guideTitle} onChange={(v) => update('partners', { guideTitle: v })} />
              <Field
                label="خطوات الدليل (كل خطوة في سطر منفصل)"
                value={content.partners.guideItems.join('\n')}
                onChange={(v) => update('partners', { guideItems: v.split('\n').map((s) => s.trim()).filter(Boolean) })}
                textarea
              />
            </div>
          </CollapsibleSection>

          {/* ===== التحميل ===== */}
          <CollapsibleSection title="قسم تحميل التطبيق" icon="download">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="العنوان" value={content.download.title} onChange={(v) => update('download', { title: v })} />
                <Field label="النص التعريفي" value={content.download.subtitle} onChange={(v) => update('download', { subtitle: v })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="رابط Google Play" value={content.download.playStoreUrl} onChange={(v) => update('download', { playStoreUrl: v })} dirLtr placeholder="https://play.google.com/…" />
                <Field label="رابط App Store" value={content.download.appStoreUrl} onChange={(v) => update('download', { appStoreUrl: v })} dirLtr placeholder="https://apps.apple.com/…" />
              </div>
              <Field label="ملاحظة تحت الأزرار" value={content.download.note} onChange={(v) => update('download', { note: v })} />
            </div>
          </CollapsibleSection>

          {/* ===== التذييل ===== */}
          <CollapsibleSection title="التذييل" icon="footer">
            <div className="space-y-3">
              <Field label="نبذة عن المنصة" value={content.footer.about} onChange={(v) => update('footer', { about: v })} textarea />
              <Field label="حقوق النشر" value={content.footer.copyright} onChange={(v) => update('footer', { copyright: v })} />
            </div>
          </CollapsibleSection>

          {/* ===== الصور ===== */}
          <CollapsibleSection title="الصور المرفوعة (الشعار / الهيدر / التحميل)" icon="image">
            <div className="grid gap-4 md:grid-cols-3">
              {(['logo', 'hero', 'download'] as const).map((slot) => {
                const current =
                  slot === 'logo' ? content.images.logoUrl : slot === 'hero' ? content.images.heroImageUrl : content.images.downloadImageUrl;
                return (
                  <div key={slot} className="space-y-2 rounded-2xl border border-[#eeeaf7] bg-[#fcfcff] p-4">
                    <h5 className="text-[12.5px] font-black text-[#131b2e]">{slotLabels[slot].title}</h5>
                    <p className="text-[11px] leading-5 text-[#a9a2bd]">{slotLabels[slot].hint}</p>
                    <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#e6e2f2] bg-white">
                      {current ? (
                        <img src={current} alt={slotLabels[slot].title} className="max-h-full w-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-[26px] text-[#d8d3e8]">add_photo_alternate</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => uploadImage(slot)}
                        disabled={uploadingSlots[slot]}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#131b2e] px-3 py-2 text-[11.5px] font-bold text-white transition hover:bg-[#283044] disabled:opacity-50"
                      >
                        <span className={`material-symbols-outlined text-[15px] ${uploadingSlots[slot] ? 'animate-spin' : ''}`}>
                          {uploadingSlots[slot] ? 'sync' : 'upload'}
                        </span>
                        {uploadingSlots[slot] ? 'جارٍ الرفع…' : 'رفع صورة'}
                      </button>
                      {current && (
                        <button
                          type="button"
                          onClick={() =>
                            setContent((c) => ({
                              ...c,
                              images: {
                                ...c.images,
                                logoUrl: slot === 'logo' ? '' : c.images.logoUrl,
                                heroImageUrl: slot === 'hero' ? '' : c.images.heroImageUrl,
                                downloadImageUrl: slot === 'download' ? '' : c.images.downloadImageUrl,
                              },
                            }))
                          }
                          className="rounded-xl border border-[#e6e2f2] px-3 py-2 text-stone-400 transition hover:border-red-200 hover:text-red-600"
                          title="إزالة الصورة"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={(el) => { fileInputs.current[slot] = el; }}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        handleFile(slot, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
};
