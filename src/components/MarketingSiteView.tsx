import React from 'react';
import { PortalMode, MarketingSiteContent } from '../types';
import { DEFAULT_MARKETING_CONTENT } from '../marketingDefaults';

interface MarketingSiteViewProps {
  projectLogo?: string | null;
  onNavigate: (mode: PortalMode) => void;
  onSeoChange?: (seo: MarketingSiteContent['seo']) => void;
}

/* ===== أيقونات متاجر التطبيقات ===== */
const GooglePlayBadge: React.FC = () => (
  <svg viewBox="0 0 512 512" className="h-7 w-7" fill="currentColor" aria-hidden="true">
    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
  </svg>
);

const AppleBadge: React.FC = () => (
  <svg viewBox="0 0 384 512" className="h-7 w-7" fill="currentColor" aria-hidden="true">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

/* ===== شعار المشروع (يُدار من الآدمن — يُظهر الصورة المرفوعة إن وُجدت) ===== */
const BrandMark: React.FC<{ logoUrl?: string }> = ({ logoUrl }) => (
  <div className="flex items-center gap-2.5">
    {logoUrl ? (
      <img src={logoUrl} alt="شعار DealBox" className="h-9 w-9 rounded-2xl object-cover shadow-sm" />
    ) : (
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#006948] font-black text-white relative">
        DB
        <span className="absolute rounded-full bg-[#fea619]" style={{ width: 9, height: 9, top: -3, left: -2 }} />
      </div>
    )}
    <div className="leading-tight">
      <div className="text-[17px] font-black tracking-tight text-[#131b2e]">DealBox</div>
      <div className="text-[10.5px] font-semibold text-stone-500">عُمان · لحفظ النعمة</div>
    </div>
  </div>
);

/* ===== مكوّن الظهور التدريجي عند التمرير (Scroll Reveal) ===== */
interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 34, className = '' }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
      }}
    >
      {children}
    </div>
  );
};

/* ===== عدّاد الأثر المتحرك ===== */
const useCountUp = (target: number, decimals: number, started: boolean) => {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!started) return;
    const duration = 1900;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(parseFloat((target * eased).toFixed(decimals)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, decimals]);
  return val;
};

const ImpactCounters: React.FC<{ stats: MarketingSiteContent['impact']['stats'] }> = ({ stats }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setStarted(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
      {stats.map((s, i) => {
        const v = useCountUp(s.value, s.decimals, started);
        const formatted =
          s.decimals > 0 ? v.toFixed(s.decimals) : Math.round(v).toLocaleString('en-US');
        return (
          <Reveal key={s.label} delay={i * 160}>
            <div className="group relative overflow-hidden rounded-3xl border border-[#e6e2f2] bg-white p-8 text-center shadow-lg shadow-[#006948]/5 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-[#fea619]/10 blur-2xl transition group-hover:bg-[#006948]/10" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006948] text-white shadow-lg shadow-[#006948]/25 transition group-hover:scale-110">
                <span className="material-symbols-outlined text-[28px]">{s.icon}</span>
              </div>
              <div className="mt-5 text-4xl font-black tracking-tight text-[#006948]">
                +{formatted}
              </div>
              <div className="mt-2 text-[13px] font-semibold leading-6 text-[#3d4a42]">{s.label}</div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
};

export const MarketingSiteView: React.FC<MarketingSiteViewProps> = ({ projectLogo, onNavigate, onSeoChange }) => {
  const [content, setContent] = React.useState<MarketingSiteContent>(DEFAULT_MARKETING_CONTENT);

  /* جلب المحتوى التسويقي من الخادم (يُدار من لوحة الآدمن) */
  React.useEffect(() => {
    let isActive = true;
    fetch('/api/v1/marketing')
      .then((r) => (r.ok ? r.json() : null))
      .then((result) => {
        if (!isActive || !result?.success || !result.content) return;
        const merged: MarketingSiteContent = {
          ...DEFAULT_MARKETING_CONTENT,
          ...result.content,
          seo: { ...DEFAULT_MARKETING_CONTENT.seo, ...result.content.seo },
          hero: { ...DEFAULT_MARKETING_CONTENT.hero, ...result.content.hero },
          features: { ...DEFAULT_MARKETING_CONTENT.features, ...result.content.features },
          steps: { ...DEFAULT_MARKETING_CONTENT.steps, ...result.content.steps },
          impact: { ...DEFAULT_MARKETING_CONTENT.impact, ...result.content.impact },
          campaigns: { ...DEFAULT_MARKETING_CONTENT.campaigns, ...result.content.campaigns },
          partners: { ...DEFAULT_MARKETING_CONTENT.partners, ...result.content.partners },
          download: { ...DEFAULT_MARKETING_CONTENT.download, ...result.content.download },
          footer: { ...DEFAULT_MARKETING_CONTENT.footer, ...result.content.footer },
          images: { ...DEFAULT_MARKETING_CONTENT.images, ...result.content.images },
        };
        setContent(merged);
        onSeoChange?.(merged.seo);
      })
      .catch(() => { /* يبقى المحتوى الاحتياطي المحلي */ });
    return () => { isActive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (id: string) => {
    if (typeof document === 'undefined') return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { id: 'features', label: 'المميزات' },
    { id: 'how', label: 'كيف يعمل' },
    { id: 'impact', label: 'الأثر' },
    { id: 'campaigns', label: 'حملات الإطلاق' },
    { id: 'partners', label: 'للمتاجر' },
  ];

  /* مؤقتات دخول الهيدر المتتالية */
  const heroDelays = { badge: 0, title: 140, sub: 280, cta: 420, chips: 560 };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] font-['IBM_Plex_Sans_Arabic','IBM_Plex_Sans',sans-serif] scroll-smooth">
      {/* ===== الشريط العلوي ===== */}
      <header className="sticky top-0 z-50 border-b border-[#e6e2f2]/70 bg-white/85 backdrop-blur-md animate-fade-in">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <BrandMark logoUrl={content.images.logoUrl} />
          </button>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => scrollTo(l.id)}
                className="group relative text-[13px] font-semibold text-[#3d4a42] transition hover:text-[#006948]"
              >
                {l.label}
                <span className="absolute -bottom-1 right-0 h-0.5 w-0 rounded-full bg-[#fea619] transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => scrollTo('download')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#006948] px-4 py-2.5 text-[13px] font-bold text-white shadow-xs transition hover:bg-[#00855d] hover:shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            حمّل التطبيق
          </button>
        </div>
      </header>

      {/* ===== الهيدر الرئيسي (Hero) ===== */}
      <section className="relative overflow-hidden bg-[#0b1226] text-white">
        <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-[#006948]/40 blur-3xl animate-drift" />
        <div className="pointer-events-none absolute bottom-0 left-1/5 h-72 w-72 rounded-full bg-[#fea619]/20 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(133,248,196,0.06),transparent_50%)] animate-pulse-soft" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <div style={{ animationDelay: `${heroDelays.badge}ms` }} className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[12px] font-semibold text-[#85f8c4]">
              <span className="material-symbols-outlined animate-bounce-gentle text-[15px]">eco</span>
              {content.hero.badgeText}
            </span>
          </div>

          <h1 style={{ animationDelay: `${heroDelays.title}ms` }} className="animate-fade-up mx-auto mt-6 max-w-4xl text-4xl font-black leading-[1.2] tracking-tight sm:text-5xl lg:text-[58px]">
            <span className="bg-gradient-to-l from-[#fea619] via-[#ffddb8] to-[#85f8c4] bg-[length:200%_auto] bg-clip-text animate-shine text-transparent">
              {content.hero.tagline}
            </span>
          </h1>

          <p style={{ animationDelay: `${heroDelays.sub}ms` }} className="animate-fade-up mx-auto mt-6 max-w-2xl text-[15px] leading-8 text-stone-300 sm:text-base">
            {content.hero.subtitle}
            {content.hero.highlightLine && (
              <span className="mt-2 block text-[#85f8c4]">{content.hero.highlightLine}</span>
            )}
          </p>

          <div style={{ animationDelay: `${heroDelays.cta}ms` }} className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollTo('download')}
              className="group inline-flex items-center gap-2 rounded-2xl bg-[#fea619] px-6 py-4 text-[15px] font-black text-[#684000] shadow-lg shadow-[#fea619]/20 transition hover:bg-[#ffc14a] hover:shadow-xl hover:shadow-[#fea619]/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-[19px] transition group-hover:-translate-y-0.5">download</span>
              {content.hero.ctaClientText}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('portal-gate')}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-6 py-4 text-[14px] font-bold text-white backdrop-blur transition hover:bg-white/10 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              {content.hero.ctaStoreText}
            </button>
          </div>

          {content.hero.chips.length > 0 && (
            <div style={{ animationDelay: `${heroDelays.chips}ms` }} className="animate-fade-up mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-semibold text-stone-400">
              {content.hero.chips.map((chip) => (
                <span key={chip} className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#85f8c4]">verified</span>
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* صورة الهيدر المرفوعة من الآدمن */}
          {content.images.heroImageUrl && (
            <Reveal delay={700} className="mx-auto mt-10 max-w-3xl">
              <img
                src={content.images.heroImageUrl}
                alt="عرض الموقع"
                className="w-full rounded-3xl border border-white/10 object-cover shadow-2xl"
              />
            </Reveal>
          )}

          <button
            type="button"
            onClick={() => scrollTo('features')}
            className="animate-bounce-gentle mx-auto mt-12 flex flex-col items-center gap-1.5 text-stone-400 transition hover:text-[#85f8c4]"
            aria-label="مرر للأسفل"
          >
            <span className="text-[10px] font-bold tracking-widest">اكتشف المزيد</span>
            <span className="material-symbols-outlined text-[22px]">keyboard_arrow_down</span>
          </button>
        </div>
      </section>

      {/* ===== صناديق اليوم (عروض تسويقية) ===== */}
      {content.offers.length > 0 && (
        <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {content.offers.map((o, i) => (
              <Reveal key={`${o.title}-${i}`} delay={i * 140}>
                <div className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-[#fea619]/50 bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:border-[#fea619] hover:shadow-xl">
                  <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-[#fea619]/10 blur-2xl transition group-hover:bg-[#fea619]/20" />
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#fff1d6] px-3 py-1 text-[10.5px] font-black text-[#684000]">
                      🔥 {o.tag}
                    </span>
                    <span className="text-[24px] transition group-hover:scale-125">{o.emoji}</span>
                  </div>
                  <div className="mt-3 text-[11px] font-semibold text-[#3d4a42]">{o.store}</div>
                  <div className="mt-1 text-[15px] font-black">{o.title}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-xl bg-[#006948] px-3 py-1.5 text-[15px] font-black text-white">{o.newPrice}</span>
                    <span className="text-[12px] text-stone-400 line-through">{o.oldPrice}</span>
                    <span className="mr-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-[#006948]">
                      {o.save}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ===== شريط القيمة ===== */}
      {content.valueBand.length > 0 && (
        <section className="border-b border-[#eeeaf7] bg-white py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4">
            {content.valueBand.map((x, i) => (
              <Reveal key={`${x.title}-${i}`} delay={i * 110}>
                <div className="group flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eefaf1] text-[#006948] transition group-hover:scale-110 group-hover:bg-[#006948] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#006948]/20">
                    <span className="material-symbols-outlined text-[28px]">{x.icon}</span>
                  </div>
                  <div className="mt-3 text-[16px] font-black">{x.title}</div>
                  <div className="mt-1 text-[12px] text-[#3d4a42]">{x.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ===== المميزات ===== */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-black uppercase tracking-widest text-[#006948]">مميزات التطبيق</span>
            <h2 className="mt-3 text-3xl font-black leading-snug sm:text-4xl">
              {content.features.sectionTitle}
            </h2>
            <p className="mt-4 text-[14.5px] leading-7 text-[#3d4a42]">
              {content.features.sectionSub}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.items.map((f, i) => (
            <Reveal key={`${f.title}-${i}`} delay={(i % 3) * 120}>
              <div className="group rounded-3xl border border-[#eeeaf7] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#006948]/30 hover:shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#131b2e] text-white transition group-hover:scale-110 group-hover:bg-[#006948] group-hover:shadow-lg group-hover:shadow-[#006948]/25">
                  <span className="material-symbols-outlined text-[24px]">{f.icon}</span>
                </div>
                <h3 className="mt-4 text-[16px] font-black">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-7 text-[#3d4a42]">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== كيف يعمل ===== */}
      <section id="how" className="scroll-mt-20 bg-[#eeecf9] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[12px] font-black uppercase tracking-widest text-[#006948]">كيف يعمل DealBox؟</span>
              <h2 className="mt-3 text-3xl font-black leading-snug sm:text-4xl">
                {content.steps.sectionTitle}
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {content.steps.items.map((s, i) => (
              <Reveal key={`${s.title}-${i}`} delay={i * 150}>
                <div className="group relative overflow-hidden rounded-3xl border border-[#eeeaf7] bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#fea619] text-[13px] font-black text-[#684000] transition group-hover:scale-110">
                    {i + 1}
                  </span>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eefaf1] text-[#006948] transition group-hover:scale-110 group-hover:bg-[#006948] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[#006948]/25">
                    <span className="material-symbols-outlined text-[32px]">{s.icon}</span>
                  </div>
                  <h3 className="mt-5 text-[16px] font-black">{s.title}</h3>
                  <p className="mt-2.5 text-[13px] leading-7 text-[#3d4a42]">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* محفزات النمو */}
          {content.growthHacks.length > 0 && (
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {content.growthHacks.map((g, i) => (
                <Reveal key={`${g.title}-${i}`} delay={i * 150}>
                  <div className="group relative overflow-hidden rounded-3xl border border-[#006948]/20 bg-gradient-to-l from-[#eefaf1] to-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[#fea619]/15 blur-2xl transition group-hover:bg-[#fea619]/25" />
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#006948] text-white transition group-hover:scale-110">
                        <span className="material-symbols-outlined text-[24px]">{g.icon}</span>
                      </div>
                      <div>
                        <div className="text-[10.5px] font-black uppercase tracking-widest text-[#006948]">
                          محفّز نمو
                        </div>
                        <h3 className="text-[15px] font-black">{g.title}</h3>
                      </div>
                    </div>
                    <div className="mt-4 text-[17px] font-black text-[#131b2e]">{g.headline}</div>
                    <p className="mt-2 text-[13px] leading-7 text-[#3d4a42]">{g.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== الأثر بالأرقام ===== */}
      <section id="impact" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-black uppercase tracking-widest text-[#006948]">أثرنا بالأرقام</span>
            <h2 className="mt-3 text-3xl font-black leading-snug sm:text-4xl">
              {content.impact.sectionTitle}
            </h2>
            <p className="mt-4 text-[14.5px] leading-7 text-[#3d4a42]">
              {content.impact.sectionSub}
            </p>
          </div>
        </Reveal>

        {content.impact.stats.length > 0 && (
          <div className="mt-12">
            <ImpactCounters stats={content.impact.stats} />
          </div>
        )}
      </section>

      {/* ===== حملات الإطلاق ===== */}
      <section id="campaigns" className="scroll-mt-20 bg-[#0b1226] py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[12px] font-semibold text-[#85f8c4]">
                <span className="material-symbols-outlined animate-bounce-gentle text-[15px]">rocket_launch</span>
                {content.campaigns.sectionBadge}
              </span>
              <h2 className="mt-5 text-3xl font-black leading-snug sm:text-4xl">
                {content.campaigns.sectionTitle}
              </h2>
              <p className="mt-4 text-[14.5px] leading-8 text-stone-300">
                {content.campaigns.sectionSub}
              </p>
            </div>
          </Reveal>

          {content.campaigns.items.length > 0 && (
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {content.campaigns.items.map((c, i) => (
                <Reveal key={`${c.channel}-${i}`} delay={i * 140}>
                  <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:-translate-y-1 hover:border-[#fea619]/40 hover:bg-white/10">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#85f8c4]/10 blur-2xl transition group-hover:bg-[#fea619]/15" />
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fea619] text-[#684000] transition group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#fea619]/30">
                        <span className="material-symbols-outlined text-[24px]">{c.icon}</span>
                      </div>
                      <div>
                        <div className="text-[15px] font-black">{c.channel}</div>
                        <div className="text-[10.5px] font-semibold text-[#85f8c4]" dir="ltr">
                          {c.name}
                        </div>
                      </div>
                    </div>
                    <p className="mt-5 text-[13px] leading-7 text-stone-300">{c.desc}</p>
                    <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold text-[#85f8c4] transition group-hover:bg-white/10">
                      <span className="material-symbols-outlined text-[13px]">target</span>
                      {c.audience}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== للمتاجر الشريكة ===== */}
      <section id="partners" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#006948]/25 bg-[#eefaf1] px-4 py-1.5 text-[12px] font-bold text-[#006948]">
                <span className="material-symbols-outlined text-[15px]">storefront</span>
                {content.partners.badge}
              </span>
              <h2 className="mt-5 text-3xl font-black leading-snug sm:text-4xl">
                {content.partners.title}
              </h2>
              <p className="mt-5 text-[15px] leading-8 text-[#3d4a42]">
                {content.partners.intro}
              </p>

              <ul className="mt-7 space-y-4">
                {content.partners.bullets.map((x, i) => (
                  <li key={`${x.title}-${i}`} className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#131b2e] text-white transition hover:scale-110 hover:bg-[#006948]">
                      <span className="material-symbols-outlined text-[22px]">{x.icon}</span>
                    </div>
                    <div>
                      <div className="text-[14.5px] font-black">{x.title}</div>
                      <div className="mt-0.5 text-[12.5px] leading-6 text-[#3d4a42]">{x.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onNavigate('portal-gate')}
                className="group mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#006948] px-7 py-4 text-[15px] font-black text-white shadow-lg shadow-[#006948]/20 transition hover:bg-[#00855d] hover:shadow-xl hover:shadow-[#006948]/30 active:scale-95"
              >
                {content.partners.ctaText}
                <span className="material-symbols-outlined text-[19px] rotate-180 transition group-hover:-translate-x-1">arrow_right_alt</span>
              </button>
            </div>
          </Reveal>

          <div className="grid gap-5">
            <Reveal delay={120}>
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#006948] to-[#00855d] p-8 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[#fea619]/20 blur-2xl transition group-hover:bg-[#fea619]/30" />
                <span className="material-symbols-outlined animate-float text-[34px] text-[#fea619]">balance</span>
                <div className="mt-4 text-2xl font-black">{content.partners.equationTitle}</div>
                <p className="mt-2 text-[13.5px] leading-7 text-emerald-50">
                  {content.partners.equationText}
                </p>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="rounded-3xl border border-[#eeeaf7] bg-white p-8 shadow-sm transition hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-black">{content.partners.guideTitle}</span>
                  <span className="material-symbols-outlined text-[#006948]">menu_book</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-[12.5px] leading-6 text-[#3d4a42]">
                  {content.partners.guideItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-[#006948]">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== تحميل التطبيق ===== */}
      <section id="download" className="scroll-mt-20 px-4 pb-20 sm:px-6">
        <Reveal y={44}>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-gradient-to-l from-[#006948] to-[#00855d] p-10 text-center text-white sm:p-16">
            <div className="pointer-events-none absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-[#fea619]/25 blur-3xl animate-drift" />
            <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-float-slow" />

            <span className="material-symbols-outlined animate-bounce-gentle mx-auto text-[44px] text-[#fea619]">smartphone</span>
            <h2 className="relative mx-auto mt-4 max-w-2xl text-3xl font-black leading-snug sm:text-4xl">
              {content.download.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-[14.5px] leading-7 text-emerald-50">
              {content.download.subtitle}
            </p>

            {content.images.downloadImageUrl && (
              <img
                src={content.images.downloadImageUrl}
                alt="تحميل التطبيق"
                className="relative mx-auto mt-8 max-w-xs rounded-2xl border border-white/15 object-cover shadow-xl"
              />
            )}

            <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href={content.download.playStoreUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl bg-[#131b2e] px-7 py-4 text-right text-white shadow-xl transition hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#283044] hover:shadow-2xl active:scale-95"
              >
                <span className="transition group-hover:-translate-y-0.5"><GooglePlayBadge /></span>
                <span className="leading-tight">
                  <span className="block text-[11px] text-stone-300">حمّله الآن من</span>
                  <span className="block text-[16px] font-black">Google Play</span>
                </span>
              </a>
              <a
                href={content.download.appStoreUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl bg-[#131b2e] px-7 py-4 text-right text-white shadow-xl transition hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#283044] hover:shadow-2xl active:scale-95"
              >
                <span className="transition group-hover:-translate-y-0.5"><AppleBadge /></span>
                <span className="leading-tight">
                  <span className="block text-[11px] text-stone-300">حمّله الآن من</span>
                  <span className="block text-[16px] font-black">App Store</span>
                </span>
              </a>
            </div>

            {content.download.note && (
              <p className="relative mt-6 text-[12px] text-emerald-100/70">
                {content.download.note}
              </p>
            )}
          </div>
        </Reveal>
      </section>

      {/* ===== التذييل ===== */}
      <footer className="border-t border-[#e6e2f2] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row">
          <BrandMark logoUrl={content.images.logoUrl} />
          <p className="max-w-md text-center text-[12px] leading-6 text-[#3d4a42] md:text-right">
            {content.footer.about}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() => onNavigate('client-app')}
              className="text-[12px] font-bold text-[#3d4a42] transition hover:text-[#006948]"
            >
              تطبيق الزبون على الويب
            </button>
            <span className="text-[#d8d3e8]">·</span>
            <a
              href="/?portal=gate"
              className="text-[12px] font-bold text-[#3d4a42] transition hover:text-[#006948]"
            >
              بوابة الشركاء والإدارة
            </a>
          </div>
        </div>
        <div className="border-t border-[#f0edf8] py-4 text-center text-[11px] font-semibold text-[#a9a2bd]">
          {content.footer.copyright}
        </div>
      </footer>
    </div>
  );
};
