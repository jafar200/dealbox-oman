/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DealBoxHeader } from './components/DealBoxHeader';
import { DealBoxCard } from './components/DealBoxCard';
import { BookingPage } from './components/BookingPage';
import { BottomNav } from './components/BottomNav';
import { DealBoxDetailModal } from './components/DealBoxDetailModal';
import { ReservationsView } from './components/ReservationsView';
import { StoresMapView } from './components/StoresMapView';
import { StoreAvatar } from './components/StoreAvatar';
import { UserProfileView } from './components/UserProfileView';
import { LocationModal } from './components/LocationModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AddBasketModal } from './components/AddBasketModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { MarketingSiteView } from './components/MarketingSiteView';
import { StoreDashboardView } from './components/StoreDashboardView';
import { ArchitectureDocsView } from './components/ArchitectureDocsView';
import { PortalGateView } from './components/PortalGateView';
import { ClientAuthView } from './components/ClientAuthView';
import { IntroOnboardingView } from './components/IntroOnboardingView';
import { PortalAuthView, PortalSessionUser } from './components/PortalAuthView';
import { ResetPasswordView } from './components/ResetPasswordView';
import { INITIAL_DEAL_BOXES } from './data/mockBaskets';
import { fetchDealBoxes } from './data/boxesApi';
import { createOrder, fetchMyOrders } from './data/ordersApi';
import { ClientSession, clearClientSession, readClientSession } from './data/clientSession';
import { getWebPushStatus, isWebPushSupported, enableWebPush, syncWebPushSubscription, WebPushStatus } from './data/webPush';
import { ApprovedStoreStory, StoreStoryDetailModal } from './components/StoreStoryDetailModal';
import { DealBoxItem, StoreStory, Reservation, ActiveNavTab, BasketCategory, PortalMode } from './types';
import { loadProjectLogo, saveProjectLogo } from './logoStorage';

type IntroSlideConfig = {
  id: string;
  title: string;
  description: string;
  badge: string;
  highlight: string;
  tag: string;
  icon: string;
  imageUrl?: string;
  enabled: boolean;
};

type GoogleAuthConfig = {
  enabled: boolean;
  clientId: string;
};

const DEFAULT_INTRO_SLIDES: IntroSlideConfig[] = [
  {
    id: 'intro-1',
    title: 'أهلاً بك في Dealbox! 🎁',
    description: 'وفّر أكثر واستمتع بوجباتك المفضلة! أروع العروض والخصومات من أفضل المطاعم والمقاهي بانتظارك بخصومات تصل إلى 70%.',
    badge: 'الخيار الذكي لمجتمعنا',
    highlight: 'وفر حتى 70%',
    tag: 'وجبات طازجة',
    icon: '✨',
    enabled: true,
  },
  {
    id: 'intro-2',
    title: 'تسوق بذكاء وابدأ فرق التغيير 🌱',
    description: 'اختر أفضل الصناديق المتاحة بالقرب منك، واستفد من خصومات حقيقية مع دعم البيئة والمجتمع المحلي.',
    badge: 'حفظ الطعام، وفر المال',
    highlight: 'خصم فوري',
    tag: 'توصيل ذكي',
    icon: '🌿',
    enabled: true,
  },
  {
    id: 'intro-3',
    title: 'احجز وادفع فقط عند الاستلام ✅',
    description: 'اختر وقت الاستلام المناسب لك، وتأكد من جودة الطلب قبل التفعيل. تجربة سريعة، واضحة، ومريحة في كل خطوة.',
    badge: 'استلام سهل وآمن',
    highlight: 'استلام موثوق',
    tag: 'تجربة مريحة',
    icon: '🛍️',
    enabled: true,
  },
];

const DEFAULT_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const getStoredIntroSlides = (): IntroSlideConfig[] => {
  if (typeof window === 'undefined') return DEFAULT_INTRO_SLIDES;
  try {
    const saved = localStorage.getItem('dealbox_intro_slides_v1');
    if (!saved) return DEFAULT_INTRO_SLIDES;
    const parsed = JSON.parse(saved) as IntroSlideConfig[];
    return parsed.length ? parsed : DEFAULT_INTRO_SLIDES;
  } catch (e) {
    return DEFAULT_INTRO_SLIDES;
  }
};

const getStoredGoogleAuthConfig = (): GoogleAuthConfig => {
  if (typeof window === 'undefined') return { enabled: true, clientId: DEFAULT_GOOGLE_CLIENT_ID };
  try {
    const saved = localStorage.getItem('dealbox_google_auth_v1');
    if (!saved) return { enabled: true, clientId: DEFAULT_GOOGLE_CLIENT_ID };
    const parsed = JSON.parse(saved) as GoogleAuthConfig;
    return {
      enabled: parsed.enabled ?? true,
      clientId: parsed.clientId || DEFAULT_GOOGLE_CLIENT_ID,
    };
  } catch (e) {
    return { enabled: true, clientId: DEFAULT_GOOGLE_CLIENT_ID };
  }
};

// Read initial portal from URL parameter (?portal=client | store | admin | docs | gate)
// رابط إعادة تعيين كلمة المرور يصل على شكل ?reset=TOKEN ويفتح صفحة تعيين كلمة المرور مباشرة.
const getInitialPortal = (): PortalMode => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset')) return 'reset-password';
    const p = params.get('portal');
    if (p === 'client' || p === 'customer') return 'client-app';
    if (p === 'store' || p === 'partner') return 'store-dashboard';
    if (p === 'admin') return 'admin-dashboard';
    if (p === 'docs') return 'architecture-docs';
    if (p === 'gate' || p === 'login') return 'portal-gate';
    if (p === 'intro') return 'intro';
    if (p === 'marketing' || p === 'home' || p === 'landing' || p === 'site' || p === '') return 'marketing';
  }
  return 'marketing';
};

const getInitialResetToken = (): string => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('reset') || '';
};

/* تطبيق إعدادات السيو (SEO) الخاصة بالموقع التسويقي — تُدار من لوحة الآدمن */
const applyMarketingSeo = (seo?: {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}) => {
  if (typeof document === 'undefined') return;
  if (seo?.title) document.title = seo.title;
  const setMeta = (name: string, content: string, property = false) => {
    if (!content) return;
    const attr = property ? 'property' : 'name';
    let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };
  setMeta('description', seo?.description || '');
  setMeta('keywords', seo?.keywords || '');
  setMeta('og:title', seo?.title || '', true);
  setMeta('og:description', seo?.description || '', true);
  setMeta('og:image', seo?.ogImage || '', true);
  setMeta('og:type', 'website', true);
};

export default function App() {
  // Deal Boxes State
  const [dealBoxes, setDealBoxes] = useState<DealBoxItem[]>(() => {
    const saved = localStorage.getItem('dealbox_items_oman_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_DEAL_BOXES;
      }
    }
    return INITIAL_DEAL_BOXES;
  });

  // Reservations State
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('dealbox_reservations_oman_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Selected filters
  const [selectedDistance, setSelectedDistance] = useState<number>(3);
  const [selectedCategory, setSelectedCategory] = useState<BasketCategory>('all');
  const [approvedStories, setApprovedStories] = useState<ApprovedStoreStory[]>([]);
  const [selectedStoryForStore, setSelectedStoryForStore] = useState<ApprovedStoreStory | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('الخوض، السيب');

  // Navigation & Modals
  const [currentPortal, setCurrentPortal] = useState<PortalMode>(getInitialPortal);
  // رمز إعادة تعيين كلمة المرور القادم من رابط البريد (?reset=TOKEN)
  const [resetPasswordToken, setResetPasswordToken] = useState<string>(getInitialResetToken);
  // تُستعاد الجلسة المحفوظة عند التحميل، وإلا فإن أي تحديث للصفحة
  // يعيد المستخدم إلى شاشة الدخول رغم أن التوكن ما زال صالحاً.
  const [isClientAuthenticated, setIsClientAuthenticated] = useState(() => readClientSession() !== null);
  // جلسة الزبون المسجّل دخوله (الاسم/البريد/الجوال) — تُقرأ من dealbox_user_v1
  const [clientSession, setClientSession] = useState<ClientSession | null>(() => readClientSession());
  const [portalSession, setPortalSession] = useState<{ token: string; user: PortalSessionUser } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('explore-home');
  const [selectedBoxForModal, setSelectedBoxForModal] = useState<DealBoxItem | null>(null);
  const [selectedBookingBox, setSelectedBookingBox] = useState<DealBoxItem | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [hasUnreadAlert, setHasUnreadAlert] = useState(true);

  // التنبيه العام المنشور من لوحة الأدمن — يظهر للمستفيد على هاتفه
  const [generalAnnouncement, setGeneralAnnouncement] = useState<{ title: string; body: string; publishedAt: string | null } | null>(null);
  const [announcementSeenAt, setAnnouncementSeenAt] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dealbox_announcement_seen_v1');
    return null;
  });

  // حالة إشعارات المتصفح (Web Push): unsupported/default/granted/denied
  const [pushStatus, setPushStatus] = useState<WebPushStatus>(() => getWebPushStatus());
  // عرض شريط «تفعيل إشعارات الهاتف» عندما يكون الإذن لم يُطلب بعد
  const [pushPromptDismissed, setPushPromptDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dealbox_push_prompt_dismissed_v1') === '1';
    return false;
  });

  // Project Logo State (synchronized with localStorage)
  const [projectLogo, setProjectLogo] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dealbox_project_logo_v1') || null;
    }
    return null;
  });
  const [introSlides, setIntroSlides] = useState<IntroSlideConfig[]>(() => getStoredIntroSlides());
  const [googleAuthConfig, setGoogleAuthConfig] = useState<GoogleAuthConfig>(() => getStoredGoogleAuthConfig());

  useEffect(() => {
    let isActive = true;
    loadProjectLogo()
      .then((savedLogo) => {
        if (isActive && savedLogo) setProjectLogo(savedLogo);
      })
      .catch((error) => console.error('Unable to load saved project logo:', error));
    return () => {
      isActive = false;
    };
  }, []);

  // جلب التنبيه العام المنشور من الأدمن (مسار عام) — يُعاد كل 30 ثانية
  // ليصل التنبيه الجديد للمستفيد على هاتفه دون إعادة تحميل الصفحة.
  useEffect(() => {
    let isActive = true;
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch('/api/v1/client/announcement');
        const result = await response.json();
        if (!isActive) return;
        if (result?.success) {
          const incoming = result.announcement || null;
          setGeneralAnnouncement((prev) =>
            incoming && prev && incoming.publishedAt === prev.publishedAt ? prev : incoming,
          );
          setHasUnreadAlert((prev) => {
            if (!incoming) return prev;
            const seen = localStorage.getItem('dealbox_announcement_seen_v1');
            return incoming.publishedAt ? seen !== incoming.publishedAt : prev;
          });
        }
      } catch {
        // الاتصال بالخادم اختياري هنا: التنبيه لا يمنع استخدام التطبيق
      }
    };
    void fetchAnnouncement();
    const timer = window.setInterval(fetchAnnouncement, 30000);
    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, []);

  // مزامنة اشتراك Web Push عند فتح التطبيق (إن كان الإذن ممنوحاً مسبقاً)
  useEffect(() => {
    if (getWebPushStatus() === 'granted') {
      void syncWebPushSubscription();
    }
  }, []);

  // تفعيل إشعارات الهاتف (Web Push) — يُستدعى من تفاعل المستخدم
  const handleEnablePush = async () => {
    const status = await enableWebPush();
    setPushStatus(status);
    return status;
  };

  const dismissPushPrompt = () => {
    try { localStorage.setItem('dealbox_push_prompt_dismissed_v1', '1'); } catch { /* ignore */ }
    setPushPromptDismissed(true);
  };

  // تعليم التنبيه العام كمقروء عند فتح نافذة التنبيهات
  const markAnnouncementSeen = () => {
    if (generalAnnouncement?.publishedAt) {
      localStorage.setItem('dealbox_announcement_seen_v1', generalAnnouncement.publishedAt);
      setAnnouncementSeenAt(generalAnnouncement.publishedAt);
    }
  };

  const handleUpdateProjectLogo = async (newLogo: string | null): Promise<boolean> => {
    try {
      await saveProjectLogo(newLogo);
      localStorage.removeItem('dealbox_project_logo_v1');
      setProjectLogo(newLogo);
      return true;
    } catch (error) {
      console.error('Unable to save project logo:', error);
      return false;
    }
  };

  // Sync portal changes to URL
  const handlePortalChange = (mode: PortalMode) => {
    setCurrentPortal(mode);
    setSelectedBookingBox(null);
    setSelectedStoryForStore(null);
    if (mode === 'portal-gate' || mode === 'client-app') setPortalSession(null);
    if (mode === 'client-app') {
      setIsClientAuthenticated(false);
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (mode === 'intro') url.searchParams.set('portal', 'intro');
      else if (mode === 'marketing') url.searchParams.set('portal', 'marketing');
      else if (mode === 'client-app') url.searchParams.set('portal', 'client');
      else if (mode === 'store-dashboard') url.searchParams.set('portal', 'store');
      else if (mode === 'admin-dashboard') url.searchParams.set('portal', 'admin');
      else if (mode === 'architecture-docs') url.searchParams.set('portal', 'docs');
      else if (mode === 'reset-password') {
        // لا نغيّر portal حتى يبقى رابط إعادة التعيين (?reset=TOKEN) هو الوجهة
        if (!url.searchParams.get('reset')) url.searchParams.set('portal', 'gate');
      } else url.searchParams.set('portal', 'gate');
      // عند مغادرة صفحة إعادة التعيين ننظّف الرمز من الرابط
      if (mode !== 'reset-password') url.searchParams.delete('reset');
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPortal(getInitialPortal());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentPortal !== 'client-app' || !isClientAuthenticated) {
      setApprovedStories([]);
      return;
    }
    let isActive = true;
    fetch('/api/v1/client/stories')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'تعذر تحميل قصص المتاجر');
        if (isActive) setApprovedStories(result.stories || []);
      })
      .catch((error) => console.error('Unable to load approved store stories:', error));
    return () => {
      isActive = false;
    };
  }, [currentPortal, isClientAuthenticated]);

  // تحميل صناديق العرض من قاعدة البيانات (GET /api/v1/client/boxes)
  useEffect(() => {
    if (currentPortal !== 'client-app' || !isClientAuthenticated) return;
    const controller = new AbortController();

    fetchDealBoxes({ signal: controller.signal })
      .then((boxes) => setDealBoxes(boxes))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // في حال تعذر الاتصال بالخادم نحتفظ بالبيانات المحلية كخيار احتياطي
        console.error('Unable to load deal boxes from API:', error);
      });

    return () => controller.abort();
  }, [currentPortal, isClientAuthenticated]);

  // تحميل حجوزات الزبون من قاعدة البيانات (GET /api/v1/client/orders)
  useEffect(() => {
    if (currentPortal !== 'client-app' || !isClientAuthenticated) return;
    const controller = new AbortController();

    fetchMyOrders({ signal: controller.signal })
      .then((orders) => {
        // الحجوزات القادمة من الخادم تُدمج مع الحجوزات المحلية غير المتاحة بعد
        setReservations((prev) => {
          const localIds = new Set(prev.map((r) => r.id));
          return [...orders.filter((o) => !localIds.has(o.id)), ...prev];
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Unable to load client orders:', error);
      });

    return () => controller.abort();
  }, [currentPortal, isClientAuthenticated]);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Verify Booking Code from Store Dashboard
  const handleVerifyBookingCode = (code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    const found = reservations.find(
      (r) => r.pickupCode.toUpperCase() === normalized && r.status === 'pending'
    );
    if (found) {
      setReservations((prev) =>
        prev.map((r) => (r.id === found.id ? { ...r, status: 'completed' } : r))
      );
      showToast(`✓ تم التحقق بنجاح من كود الحجز (${normalized})! تم تسليم الصندوق للزبون.`);
      return true;
    }
    // Also support demo code DB-4821
    if (normalized === 'DB-4821') {
      showToast(`✓ تم التحقق بنجاح من كود الحجز (${normalized})! سلّم الصندوق للزبون.`);
      return true;
    }
    return false;
  };

  // Update box stock from store manager
  const handleUpdateBoxStock = (boxId: string, newCount: number) => {
    setDealBoxes((prev) =>
      prev.map((b) =>
        b.id === boxId
          ? {
              ...b,
              remainingCount: newCount,
              remainingText:
                newCount <= 1 ? 'باقي صندوق واحد' : `باقي ${newCount} صناديق`,
            }
          : b
      )
    );
    showToast('تم تحديث كمية الصناديق المتوفرة في المتجر بنجاح');
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('dealbox_items_oman_v1', JSON.stringify(dealBoxes));
  }, [dealBoxes]);

  useEffect(() => {
    localStorage.setItem('dealbox_reservations_oman_v1', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('dealbox_intro_slides_v1', JSON.stringify(introSlides));
  }, [introSlides]);

  useEffect(() => {
    localStorage.setItem('dealbox_google_auth_v1', JSON.stringify(googleAuthConfig));
  }, [googleAuthConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Filter deal boxes
  const filteredBoxes = useMemo(() => {
    return dealBoxes.filter((box) => {
      // Filter by distance
      if (box.distanceKm > selectedDistance) {
        return false;
      }

      // Filter by category
      if (selectedCategory !== 'all' && box.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [dealBoxes, selectedDistance, selectedCategory]);

  // Claim Deal Box handler — the booking is persisted by the backend (Order collection)
  const handleClaimBox = async (box: DealBoxItem, quantity: number = 1) => {
    const currentBox = dealBoxes.find((item) => item.id === box.id);
    if (!currentBox || quantity < 1 || quantity > currentBox.remainingCount) {
      showToast('تعذر تأكيد الحجز، يرجى اختيار كمية متاحة.');
      return;
    }

    let newReservation: Reservation;
    try {
      newReservation = await createOrder(currentBox.id, quantity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تأكيد الحجز';
      showToast(message);
      return;
    }

    // Decrement stock (the backend already decremented it; this keeps the UI in sync)
    setDealBoxes((prev) =>
      prev.map((b) =>
        b.id === currentBox.id
          ? {
              ...b,
              remainingCount: Math.max(0, b.remainingCount - quantity),
              remainingText:
                b.remainingCount - quantity <= 1
                  ? 'باقي صندوق واحد'
                  : `باقي ${b.remainingCount - quantity} صناديق`,
            }
          : b
      )
    );

    setReservations((prev) => [newReservation, ...prev]);
    setSelectedBoxForModal(null);
    setSelectedBookingBox(null);
    showToast(
      `تم تأكيد الحجز! كود الاستلام: ${newReservation.pickupCode} - يرجى التوجه للمتجر للاستلام`
    );
  };

  /**
   * تسجيل الخروج: يمسح توكن الجلسة وبيانات العميل والحجوزات المحلية المحفوظة
   * على هذا الجهاز، ثم يعيد التطبيق لشاشة تسجيل الدخول.
   */
  const handleClientLogout = () => {
    clearClientSession();
    setClientSession(null);
    setReservations([]);
    setSelectedBoxForModal(null);
    setSelectedBookingBox(null);
    setApprovedStories([]);
    setActiveTab('explore-home');
    setIsClientAuthenticated(false);
    showToast('تم تسجيل الخروج من التطبيق');
  };

  const handleOpenBooking = (box: DealBoxItem) => {
    setSelectedBoxForModal(null);
    setSelectedBookingBox(box);
    setSelectedStoryForStore(null);
  };

  // Complete Reservation
  const handleCompleteReservation = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'completed' } : r))
    );
    showToast('شكراً لك! تم تأكيد استلام الصندوق بنجاح وحفظ النعمة.');
  };

  // Cancel Reservation
  const handleCancelReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    showToast('تم إلغاء الحجز بنجاح.');
  };

  // Total savings
  const totalMoneySaved = reservations.reduce(
    (acc, r) => acc + (r.originalPrice - r.pricePaid),
    0
  );

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] flex flex-col min-h-screen font-['IBM_Plex_Sans_Arabic','IBM_Plex_Sans',sans-serif]">
      {currentPortal === 'reset-password' ? (
        <main className="flex-1 bg-[#faf8ff]">
          <ResetPasswordView
            token={resetPasswordToken}
            onOpenLogin={() => handlePortalChange('portal-gate')}
          />
        </main>
      ) : currentPortal === 'intro' ? (
        <main className="flex-1 bg-[#faf8ff]">
          <IntroOnboardingView
            slides={introSlides}
            projectLogo={projectLogo}
            onContinue={() => handlePortalChange('client-app')}
            onSkip={() => handlePortalChange('client-app')}
          />
        </main>
      ) : currentPortal === 'marketing' ? (
        /* [0] الموقع التسويقي — صفحة هبوط المشروع */
        <main className="flex-1 bg-[#faf8ff]">
          <MarketingSiteView projectLogo={projectLogo} onNavigate={handlePortalChange} onSeoChange={applyMarketingSeo} />
        </main>
      ) : currentPortal === 'portal-gate' ? (
        <main className="flex-1 pb-16 bg-[#faf8ff]">
          <PortalGateView onSelectPortal={handlePortalChange} projectLogo={projectLogo} />
        </main>
      ) : currentPortal === 'store-dashboard' && portalSession?.user.role !== 'store_manager' ? (
        <PortalAuthView
          role="store_manager"
          onBack={() => handlePortalChange('portal-gate')}
          onAuthenticated={(token, user) => setPortalSession({ token, user })}
        />
      ) : currentPortal === 'store-dashboard' ? (
        /* [2] Store Dashboard (لوحة تحكم مسؤول المتجر) */
        <main className="flex-1 pb-16 bg-[#faf8ff]">
          <StoreDashboardView
            dealBoxes={dealBoxes}
            reservations={reservations}
            onOpenAddBox={() => setShowAddStoreModal(true)}
            onVerifyBookingCode={handleVerifyBookingCode}
            onUpdateBoxStock={handleUpdateBoxStock}
            authToken={portalSession?.token || ''}
            storeName={portalSession?.user.storeName || ''}
            onLogout={() => handlePortalChange('portal-gate')}
          />
        </main>
      ) : currentPortal === 'client-app' && !isClientAuthenticated ? (
        <main className="flex-1 bg-[#faf8ff]">
          <ClientAuthView
            projectLogo={projectLogo}
            googleAuthEnabled={googleAuthConfig.enabled}
            googleClientId={googleAuthConfig.clientId}
            onBack={() => handlePortalChange('intro')}
            onContinue={() => {
              setClientSession(readClientSession());
              setIsClientAuthenticated(true);
              setActiveTab('explore-home');
            }}
          />
        </main>
      ) : currentPortal === 'admin-dashboard' && portalSession?.user.role !== 'admin' ? (
        <PortalAuthView
          role="admin"
          onBack={() => handlePortalChange('portal-gate')}
          onAuthenticated={(token, user) => setPortalSession({ token, user })}
        />
      ) : currentPortal === 'admin-dashboard' ? (
        /* [3] Admin Dashboard (لوحة تحكم الآدمن) */
        <main className="flex-1 pb-16 bg-[#faf8ff]">
          <AdminDashboardView
            onNotify={showToast}
            onLogout={() => handlePortalChange('portal-gate')}
            authToken={portalSession?.token || ''}
            sessionUser={portalSession?.user}
            projectLogo={projectLogo}
            onUpdateLogo={handleUpdateProjectLogo}
            introSlides={introSlides}
            onUpdateIntroSlides={setIntroSlides}
            googleAuthConfig={googleAuthConfig}
            onUpdateGoogleAuthConfig={setGoogleAuthConfig}
          />
        </main>
      ) : currentPortal === 'architecture-docs' ? (
        /* [4] Architecture & Mongoose Docs */
        <main className="flex-1 pb-16 bg-[#faf8ff]">
          <ArchitectureDocsView />
        </main>
      ) : (
        /* [1] Client Customer App (تطبيق الزبون) */
        <>
          {selectedBookingBox ? (
            <BookingPage
              box={selectedBookingBox}
              onBack={() => setSelectedBookingBox(null)}
              onConfirm={(quantity) => handleClaimBox(selectedBookingBox, quantity)}
            />
          ) : (
            <>
          {/* Sticky DealBox Header */}
          <DealBoxHeader
            currentLocation={currentLocation}
            onOpenLocationModal={() => setShowLocationModal(true)}
            onOpenNotifications={() => {
              setHasUnreadAlert(false);
              markAnnouncementSeen();
              setShowNotificationsModal(true);
            }}
            unreadNotifications={
              hasUnreadAlert ||
              Boolean(
                generalAnnouncement?.publishedAt &&
                  announcementSeenAt !== generalAnnouncement.publishedAt,
              )
            }
            projectLogo={projectLogo}
          />

          {/* Main Client App Container */}
          <main className="flex flex-col relative w-full pt-2 pb-24 bg-[#faf8ff] min-h-screen">
            <div className="max-w-md w-full mx-auto flex flex-col">
          {activeTab === 'explore-home' ? (
            <>
              {/* Notice Banner */}
              <div className="px-4 pt-2 pb-1">
                <div className="bg-[#f2f3ff] rounded-xl px-3 py-2 flex items-center justify-between text-[#3d4a42]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006948] text-[18px]">
                      storefront
                    </span>
                    <span className="text-[12px] font-medium text-[#131b2e]">
                      الاستلام الذاتي من المتاجر فقط لحماية البيئة
                    </span>
                  </div>
                  <span className="text-[11px] text-[#006948] font-semibold shrink-0">
                    بدون توصيل
                  </span>
                </div>
              </div>

              {/* التنبيه العام من الأدمن — يظهر للجميع على هواتفهم */}
              {generalAnnouncement && (
                <div className="px-4 pt-2 pb-0">
                  <div
                    className="rounded-2xl border border-[#006948]/25 bg-gradient-to-l from-[#eefaf1] to-[#f2f3ff] px-3.5 py-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[#006948] text-[20px] shrink-0">campaign</span>
                        <span className="text-[12px] font-black text-[#131b2e] truncate">
                          {generalAnnouncement.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label="عرض التفاصيل"
                        onClick={() => {
                          setHasUnreadAlert(false);
                          markAnnouncementSeen();
                          setShowNotificationsModal(true);
                        }}
                        className="shrink-0 rounded-full bg-[#006948] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#005d3f]"
                      >
                        التفاصيل
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-5 text-[#3d4a42] line-clamp-2">
                      {generalAnnouncement.body}
                    </p>
                  </div>
                </div>
              )}

              {/* تفعيل إشعارات الهاتف (Web Push) — يظهر حتى يمنح المستخدم الإذن أو يتجاهله */}
              {isWebPushSupported() && pushStatus === 'default' && !pushPromptDismissed && (
                <div className="px-4 pt-2 pb-0">
                  <div className="rounded-2xl border border-[#006948]/25 bg-white px-3.5 py-3 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[#006948] text-[20px] shrink-0">notifications_active</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-[#131b2e]">فعّل إشعارات الهاتف</p>
                        <p className="text-[10px] text-stone-500 leading-4">لتصلك التنبيهات الجديدة حتى لو كان التطبيق مغلقاً</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          const status = await handleEnablePush();
                          if (status === 'granted') showToast('تم تفعيل إشعارات الهاتف ✅');
                          else if (status === 'denied') showToast('تم رفض الإشعارات — يمكنك تفعيلها من إعدادات المتصفح');
                        }}
                        className="rounded-full bg-[#006948] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#005d3f]"
                      >
                        تفعيل
                      </button>
                      <button
                        type="button"
                        aria-label="إخفاء"
                        onClick={dismissPushPrompt}
                        className="rounded-full bg-stone-100 px-2 py-1.5 text-[10px] font-bold text-stone-500 hover:bg-stone-200"
                      >
                        لاحقاً
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {pushStatus === 'denied' && (
                <div className="px-4 pt-2 pb-0">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] leading-5 text-amber-800">
                    إشعارات الهاتف مرفوضة من إعدادات المتصفح. فعّلها من أيقونة القفل بجانب العنوان ← «الإشعارات» ← «السماح».
                  </div>
                </div>
              )}

              {/* Nearby Stores Circle Avatars ("المتاجر القريبة") */}
              {approvedStories.length > 0 && <div className="py-2 flex flex-col gap-2">
                <div className="px-4 flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-[#131b2e]">
                    المتاجر القريبة
                  </span>
                  <button 
                    onClick={() => {
                      showToast('تم تحديث قائمة المتاجر القريبة بنجاح');
                    }}
                    className="text-[11px] text-[#006948] hover:underline"
                  >
                    تحديث مباشر
                  </button>
                </div>

                <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar px-4 py-0.5">
                  {approvedStories.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => setSelectedStoryForStore(store)}
                        aria-label={`فتح متجر ${store.storeName}`}
                        className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-hidden"
                      >
                        <div className="w-14 h-14 rounded-full p-0.5 overflow-hidden ring-1 ring-[#bccac0] ring-offset-1 ring-offset-[#faf8ff] transition-transform group-hover:scale-105">
                          <StoreAvatar
                            name={store.storeName}
                            logoUrl={store.storeLogoUrl}
                            fallbackImageUrl={store.imageData}
                            className="w-full h-full rounded-full object-cover"
                            initialsClassName="bg-[#edf5f0] text-[11px] font-bold text-[#006948]"
                          />
                        </div>
                        <span className="text-[11px] text-[#131b2e] truncate max-w-[64px] font-medium">
                          {store.storeName}
                        </span>
                      </button>
                    ))}
                </div>
              </div>}

              {/* Distance Pills & Available count */}
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {[3, 5, 10].map((dist) => {
                    const isSelected = selectedDistance === dist;
                    return (
                      <button
                        key={dist}
                        onClick={() => {
                          setSelectedDistance(dist);
                          showToast(`تم تحديث نطاق البحث للاستلام: ضمن ${dist} كم`);
                        }}
                        className={`distance-pill px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                          isSelected
                            ? 'bg-[#006948] text-white shadow-xs font-semibold'
                            : 'bg-[#f2f3ff] text-[#3d4a42] hover:bg-[#eaedff]'
                        }`}
                      >
                        {dist === 3 ? 'ضمن 3 كم' : `${dist} كم`}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-[#3d4a42]">
                  {filteredBoxes.length} متاجر متوفرة
                </span>
              </div>

              {/* Category Chips */}
              <div className="py-1 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 px-4 min-w-max">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'bakery', label: 'مخابز' },
                    { id: 'produce', label: 'خضار وفواكه' },
                    { id: 'cooked', label: 'وجبات مطبوخة' },
                    { id: 'cafe', label: 'حلويات ومقاهي' },
                  ].map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id as BasketCategory)}
                        className={`category-chip px-3.5 py-1.5 rounded-full text-[12px] font-medium shrink-0 transition-all ${
                          isSelected
                            ? 'bg-[#131b2e] text-white font-semibold'
                            : 'bg-[#eaedff] text-[#131b2e] hover:bg-[#dae2fd]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deal Cards Feed */}
              <div className="px-4 flex flex-col gap-4 mt-2">
                {filteredBoxes.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#bccac0]/30 shadow-xs my-2">
                    <span className="material-symbols-outlined text-[36px] text-[#006948] mb-2">
                      search_off
                    </span>
                    <h4 className="text-[15px] font-bold text-[#131b2e]">
                      لا توجد صناديق في هذا النطاق
                    </h4>
                    <p className="text-[12px] text-[#3d4a42] mt-1 mb-4">
                      جرب توسيع المسافة أو اختيار تصنيف آخر لعرض الصناديق الفائضة المتاحة.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedDistance(10);
                        setSelectedCategory('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#006948] text-white text-[12px] font-semibold"
                    >
                      عرض جميع الصناديق
                    </button>
                  </div>
                ) : (
                  filteredBoxes.map((box) => (
                    <DealBoxCard
                      key={box.id}
                      box={box}
                      onOpenDetails={(b) => setSelectedBoxForModal(b)}
                      onClaim={handleOpenBooking}
                      isClaimed={reservations.some(r => r.boxId === box.id && r.status === 'pending')}
                    />
                  ))
                )}
              </div>

              {/* Environmental Daily Impact Bar */}
              <div className="px-4 pt-4 pb-2">
                <div className="bg-[#f2f3ff] rounded-xl p-3 flex items-center gap-3 border border-[#eaedff]">
                  <div className="w-9 h-9 rounded-full bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      eco
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#131b2e] font-semibold">
                      أثرك البيئي اليومي
                    </span>
                    <p className="text-[12px] text-[#3d4a42]">
                      وفّرت 4.2 كجم من هدر الأطعمة عبر الاستلام المباشر
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'my-reservations' ? (
            <div className="px-4 pt-3">
              <ReservationsView
                reservations={reservations}
                onComplete={handleCompleteReservation}
                onCancel={handleCancelReservation}
                onBrowse={() => setActiveTab('explore-home')}
              />
            </div>
          ) : activeTab === 'stores-map' ? (
            <div className="px-4 pt-3">
              <StoresMapView
                boxes={dealBoxes}
                onSelectBox={(b) => setSelectedBoxForModal(b)}
              />
            </div>
          ) : (
            <div className="px-4 pt-3">
              <UserProfileView
                totalBoxesSaved={reservations.length}
                totalMoneySaved={totalMoneySaved}
                currency="ر.ع"
                onOpenAddStore={() => handlePortalChange('store-dashboard')}
                userName={clientSession?.name}
                userEmail={clientSession?.email}
                userPhone={clientSession?.phone}
                userPicture={clientSession?.picture}
                onLogout={handleClientLogout}
                onProfileUpdate={(user) => {
                  setClientSession((prev) =>
                    prev
                      ? {
                          ...prev,
                          name: user.name ?? prev.name,
                          email: user.email ?? prev.email,
                          phone: user.phone ?? prev.phone,
                          picture: user.picture ?? prev.picture,
                        }
                      : prev,
                  );
                }}
              />
            </div>
          )}
        </div>

        </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        reservationsCount={reservations.filter((r) => r.status === 'pending').length}
      />
          </>
        )}
      </>
      )}

      {/* Floating Toast Notification — تُعرض فوق كل بوابات المنصة (زبون/متجر/أدمن) */}
      <div
        id="toast"
        className={`fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-[#283044] text-[#eef0ff] p-3 rounded-xl shadow-xl flex items-center justify-between transition-all duration-300 z-50 ${
          toastMessage
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#6ffbbe] text-[20px]">
            check_circle
          </span>
          <span className="text-[12px] font-medium line-clamp-1" id="toast-text">
            {toastMessage}
          </span>
        </div>
        <button 
          onClick={() => setToastMessage(null)}
          className="text-[#eef0ff]/80 hover:text-[#eef0ff] p-1"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Modals */}
      {selectedBoxForModal && (
        <DealBoxDetailModal
          box={selectedBoxForModal}
          onClose={() => setSelectedBoxForModal(null)}
          onConfirmClaim={(box) => handleOpenBooking(box)}
        />
      )}

      {selectedStoryForStore && (
        <StoreStoryDetailModal
          stories={approvedStories}
          initialIndex={Math.max(0, approvedStories.findIndex((s) => s.id === selectedStoryForStore.id))}
          onClose={() => setSelectedStoryForStore(null)}
          onClaim={handleOpenBooking}
          isClaimed={(boxId) => reservations.some((reservation) => reservation.boxId === boxId && reservation.status === 'pending')}
        />
      )}

      {showLocationModal && (
        <LocationModal
          currentLocation={currentLocation}
          onSelectLocation={(loc) => {
            setCurrentLocation(loc);
            showToast(`تم تحديث موقعك إلى: ${loc}`);
          }}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {showNotificationsModal && (
        <NotificationsModal
          onClose={() => setShowNotificationsModal(false)}
          announcement={generalAnnouncement}
        />
      )}

      {showAddStoreModal && (
        <AddBasketModal
          onClose={() => setShowAddStoreModal(false)}
          initialStoreName={portalSession?.user.storeName || ''}
          onAddBasket={async (newBsk) => {
            if (currentPortal !== 'store-dashboard' || !portalSession?.token) {
              throw new Error('إضافة الحقائب متاحة بعد تسجيل دخول مدير المتجر');
            }

            const response = await fetch('/api/v1/store/boxes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${portalSession.token}`,
              },
              body: JSON.stringify({
                title: newBsk.title,
                description: newBsk.description,
                category: newBsk.category,
                imageUrl: newBsk.imageUrl,
                expectedItems: newBsk.expectedItems,
                originalPrice: newBsk.originalPrice,
                discountedPrice: newBsk.discountedPrice,
                remainingCount: newBsk.remainingBaskets,
                pickupStart: newBsk.pickupStart,
                pickupEnd: newBsk.pickupEnd,
                pickupDate: newBsk.pickupDate,
              }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
              throw new Error(result.message || 'تعذر حفظ الحقيبة في قاعدة البيانات');
            }

            const newItem: DealBoxItem = {
              id: String(result.data._id),
              storeId: String(result.data.storeId),
              storeName: result.data.storeName,
              storeLogoUrl: result.data.storeLogoUrl || '',
              imageUrl: newBsk.imageUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
              category: newBsk.category,
              categoryNameAr: newBsk.categoryNameAr,
              title: newBsk.title,
              description: newBsk.description,
              expectedItems: newBsk.expectedItems,
              remainingCount: newBsk.remainingBaskets,
              remainingText: `باقي ${newBsk.remainingBaskets} صناديق`,
              distanceKm: 1.2,
              distanceText: '1.2 كم · ولاية السيب',
              pickupTimeText: `اليوم ${newBsk.pickupStart} - ${newBsk.pickupEnd}`,
              pickupWindow: `${newBsk.pickupStart} - ${newBsk.pickupEnd}`,
              originalPrice: newBsk.originalPrice,
              discountedPrice: newBsk.discountedPrice,
              currency: 'ر.ع',
              locationArea: newBsk.area || 'الخوض، السيب',
              coordinates: [23.6139, 58.1963],
              phone: newBsk.phone || '+968 9123 4567',
              addressDetails: newBsk.addressDetails || 'شارع مزون، الخوض، السيب، مسقط',
              verifiedStore: true,
            };

            setDealBoxes((prev) => [newItem, ...prev]);
            setShowAddStoreModal(false);
            showToast(`تم إضافة صندوق ${newItem.storeName} بنجاح!`);
          }}
        />
      )}
    </div>
  );
}
