import React, { useState } from 'react';

interface IntroSlideConfig {
  id: string;
  title: string;
  description: string;
  badge: string;
  highlight: string;
  tag: string;
  icon: string;
  imageUrl?: string;
  enabled: boolean;
  accent?: string;
}

interface IntroOnboardingViewProps {
  onContinue: () => void;
  onSkip: () => void;
  slides?: IntroSlideConfig[];
  projectLogo?: string | null;
}

const DEFAULT_SLIDES: IntroSlideConfig[] = [
  {
    id: 'welcome',
    enabled: true,
    badge: 'الخيار الذكي لمجتمعنا',
    title: 'أهلاً بك في Dealbox! 🎁',
    description: 'وفّر أكثر واستمتع بوجباتك المفضلة! أروع العروض والخصومات من أفضل المطاعم والمقاهي بانتظارك بخصومات تصل إلى 70%.',
    highlight: 'وفر حتى 70%',
    tag: 'وجبات طازجة',
    icon: '✨',
    accent: 'from-[#85f8c4]/30 via-[#f2f3ff] to-[#ffddb8]/40',
  },
  {
    id: 'smart-shopping',
    enabled: true,
    badge: 'حفظ الطعام، وفر المال',
    title: 'تسوق بذكاء وابدأ فرق التغيير 🌱',
    description: 'اختر أفضل الصناديق المتاحة بالقرب منك، واستفد من خصومات حقيقية مع دعم البيئة والمجتمع المحلي.',
    highlight: 'خصم فوري',
    tag: 'توصيل ذكي',
    icon: '🌿',
    accent: 'from-[#dff9ea] via-[#ecfdf5] to-[#d6f5ff]',
  },
  {
    id: 'safe-pickup',
    enabled: true,
    badge: 'استلام سهل وآمن',
    title: 'احجز وادفع فقط عند الاستلام ✅',
    description: 'اختر وقت الاستلام المناسب لك، وتأكد من جودة الطلب قبل التفعيل. تجربة سريعة، واضحة، ومريحة في كل خطوة.',
    highlight: 'استلام موثوق',
    tag: 'تجربة مريحة',
    icon: '🛍️',
    accent: 'from-[#fff1d6] via-[#fffaf0] to-[#e3f4ff]',
  },
];

export const IntroOnboardingView: React.FC<IntroOnboardingViewProps> = ({
  onContinue,
  onSkip,
  slides,
  projectLogo,
}) => {
  const activeSlides = (slides && slides.filter((s) => s.enabled).length ? slides.filter((s) => s.enabled) : DEFAULT_SLIDES.filter((s) => s.enabled));
  const [step, setStep] = useState(0);
  const current = activeSlides[step] || activeSlides[0];
  const isLastStep = step === activeSlides.length - 1;

  React.useEffect(() => {
    setStep(0);
  }, [slides?.map((s) => s.id + s.enabled + s.title).join('|')]);

  const handleNext = () => {
    if (isLastStep) {
      onContinue();
      return;
    }
    setStep((prev) => prev + 1);
  };

  return (
    <div
      className="min-h-screen bg-[#faf8ff] text-[#131b2e]"
      dir="rtl"
      style={{ fontFamily: '"IBM Plex Sans Arabic", "IBM Plex Sans", sans-serif' }}
    >
      <main className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-5 pt-4 pb-6">
        <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-[#85f8c4]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-48 h-60 w-60 rounded-full bg-[#ffddb8]/30 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between pb-2 pt-2">
          <div className="flex items-center gap-2 rounded-full border border-[#dfe8df] bg-white/80 px-2.5 py-1.5 shadow-sm">
            {projectLogo ? (
              <img src={projectLogo} alt="شعار DealBox" className="h-7 w-7 rounded-full object-contain" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eafdf4] text-lg text-[#006948]">
                🎁
              </div>
            )}
            <span className="text-sm font-black tracking-tight text-[#0f172a]">DealBox</span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="rounded-full bg-[#eef1ff] px-3.5 py-1.5 text-[13px] font-semibold text-[#3d4a42] transition hover:bg-[#e3e8ff]"
          >
            تخطي
          </button>
        </header>

        <div className="relative z-10 my-6 flex min-h-[300px] w-full flex-col items-center justify-center">
          <div className={`absolute h-64 w-64 rounded-full bg-gradient-to-tr ${current.accent || 'from-[#85f8c4]/30 via-[#f2f3ff] to-[#ffddb8]/40'} scale-105`} />
          <div className="absolute h-52 w-52 rounded-full bg-white/80 shadow-md" />

          <div className="absolute right-4 top-0 z-20 flex items-center gap-1.5 rounded-full bg-[#fea619] px-3.5 py-2 text-[12px] font-bold text-[#684000] shadow-md">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>
              local_fire_department
            </span>
            <span>{current.highlight}</span>
          </div>

          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#006948] shadow-sm">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>
              eco
            </span>
            <span>{current.tag}</span>
          </div>

          <div className="relative z-10 flex h-64 w-64 items-center justify-center overflow-hidden rounded-[28px] bg-[#f7f6f3] p-3 shadow-xl ring-1 ring-black/5">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-[#dff9ea] via-[#fffaf0] to-[#f8f2ff]">
              {current.imageUrl ? (
                <img src={current.imageUrl} alt={current.title} className="h-full w-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-x-5 bottom-6 h-20 rounded-[18px] bg-gradient-to-br from-[#f3d78c] to-[#f6a730] shadow-inner" />
                  <div className="absolute inset-x-10 bottom-12 h-16 rounded-[16px] border-4 border-[#fffaf0] bg-gradient-to-br from-[#7dcf9f] to-[#1c9c76] shadow-lg" />
                  <div className="absolute inset-x-14 bottom-[110px] h-10 rounded-full bg-[#fff4d8] shadow-md" />
                  <div className="absolute right-7 top-7 flex h-9 w-9 items-center justify-center rounded-full bg-[#fff8df] text-xl shadow-sm">
                    🍱
                  </div>
                  <div className="absolute left-7 top-7 flex h-9 w-9 items-center justify-center rounded-full bg-[#e4fdec] text-xl shadow-sm">
                    🌿
                  </div>
                  <div className="absolute bottom-4 left-5 text-[#f59d13]" style={{ fontSize: '2rem' }}>{current.icon}</div>
                </>
              )}
            </div>
            <div className="absolute left-5 top-4 text-[#fea619] animate-bounce">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: 'FILL 1' }}>
                auto_awesome
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center px-2 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#85f8c4]/40 px-3 py-1 text-[11px] font-semibold text-[#005137]">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: 'FILL 1' }}>
              verified
            </span>
            <span>{current.badge}</span>
          </div>

          <h1 className="mb-3 text-[28px] font-black leading-[1.2] tracking-tight text-[#131b2e]">
            {current.title}
          </h1>

          <p className="max-w-xs text-[14px] leading-relaxed text-[#3d4a42]">
            {current.description}
          </p>
        </div>

        <div className="relative z-10 mt-6 flex flex-col items-center gap-5">
          <div aria-label="مؤشر الصفحات" className="flex items-center justify-center gap-2" role="tablist">
            {activeSlides.map((_, index) => (
              <div
                key={index}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === step ? 'w-8 bg-[#006948]' : 'w-2 bg-[#dae2fd]'
                }`}
              />
            ))}
          </div>

          <div className="flex w-full flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={handleNext}
              className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#006948] px-6 text-[16px] font-bold text-white shadow-md transition active:scale-[0.98] hover:bg-[#005f3f]"
            >
              <span>{isLastStep ? 'ابدأ الآن' : 'التالي'}</span>
              <span className="material-symbols-outlined text-xl transition-transform group-active:-translate-x-1">
                arrow_back
              </span>
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2.5 text-[13px] font-medium text-[#3d4a42] transition hover:text-[#131b2e]"
            >
              تخطي للرئيسية
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
