import React, { useCallback, useEffect, useState } from 'react';
import { Store, Settlement, AdminUsersAnalyticsData, AdminPermission } from '../types';
import { AdminSystemSettingsView } from './AdminSystemSettingsView';
import { AdminPaidStoriesSection } from './AdminPaidStoriesSection';
import { AdminLoyaltySettings } from './AdminLoyaltySettings';
import { AdminAnnouncementSettings } from './AdminAnnouncementSettings';
import { AdminStoresSection } from './AdminStoresSection';
import { AdminPartnerRequestsSection } from './AdminPartnerRequestsSection';
import { AdminPickupsSection } from './AdminPickupsSection';
import { AdminImpactSection } from './AdminImpactSection';
import { AdminUsersSection } from './AdminUsersSection';
import { AdminAccountingSection } from './AdminAccountingSection';

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
}

interface GoogleAuthConfig {
  enabled: boolean;
  clientId: string;
}

interface AdminDashboardViewProps {
  onNotify?: (msg: string) => void;
  onLogout?: () => void;
  authToken?: string;
  // جلسة الأدمن الحالية: الدور داخل لوحة الآدمن (RBAC) والصلاحيات المصرح بها
  sessionUser?: { adminRole?: string; permissions?: string[] };
  projectLogo?: string | null;
  onUpdateLogo?: (logoUrl: string | null) => Promise<boolean>;
  introSlides?: IntroSlideConfig[];
  onUpdateIntroSlides?: (slides: IntroSlideConfig[]) => void;
  googleAuthConfig?: GoogleAuthConfig;
  onUpdateGoogleAuthConfig?: (config: GoogleAuthConfig) => void;
}

type AdminSidebarNav = 
  | 'overview-dashboard'
  | 'stores-and-hubs'
  | 'partner-requests'
  | 'pickups-and-passes'
  | 'impact-and-analytics'
  | 'users-directory'
  | 'accounting-report'
  | 'paid-stories'
  | 'settings-and-roles';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNotify,
  onLogout,
  authToken,
  sessionUser,
  projectLogo,
  onUpdateLogo,
  introSlides,
  onUpdateIntroSlides,
  googleAuthConfig,
  onUpdateGoogleAuthConfig,
}) => {
  // RBAC — الصلاحيات المصرح بها للدور الحالي (لوحات الأقسام في الواجهة تُخفى،
  // والتحقق الحقيقي يحدث في الخادم عبر requirePermissions).
  // إذا كانت القائمة فارغة (جلسة قديمة) تُفتح كل الأقسام حفاظاً على التوافق.
  const sessionPermissions: AdminPermission[] = (sessionUser?.permissions as AdminPermission[]) || [];
  const hasPerm = (permission: AdminPermission): boolean =>
    sessionPermissions.length === 0 || sessionPermissions.includes(permission);
  const NAV_PERMISSION: Record<AdminSidebarNav, AdminPermission> = {
    'overview-dashboard': 'overview',
    'stores-and-hubs': 'stores',
    'partner-requests': 'stores',
    'pickups-and-passes': 'pickups',
    'impact-and-analytics': 'reports',
    'users-directory': 'users',
    'accounting-report': 'accounting',
    'paid-stories': 'stories',
    'settings-and-roles': 'settings',
  };
  const canAccess = (nav: AdminSidebarNav): boolean => hasPerm(NAV_PERMISSION[nav]);

  const [activeNav, setActiveNav] = useState<AdminSidebarNav>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('section') || params.get('tab');
      let requested: AdminSidebarNav | null = null;
      if (s === 'settings' || s === 'roles' || s === 'system-settings') {
        requested = 'settings-and-roles';
      } else if (s === 'stores') requested = 'stores-and-hubs';
      else if (s === 'partners' || s === 'partner-requests') requested = 'partner-requests';
      else if (s === 'pickups') requested = 'pickups-and-passes';
      else if (s === 'impact') requested = 'impact-and-analytics';
      else if (s === 'users') requested = 'users-directory';
      else if (s === 'accounting') requested = 'accounting-report';
      else if (s === 'paid-stories') requested = 'paid-stories';
      if (requested && canAccess(requested)) return requested;
    }
    return 'overview-dashboard';
  });

  const handleNavChange = (nav: AdminSidebarNav) => {
    setActiveNav(nav);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (nav === 'settings-and-roles') {
        url.searchParams.set('section', 'settings');
      } else if (nav === 'stores-and-hubs') {
        url.searchParams.set('section', 'stores');
      } else if (nav === 'partner-requests') {
        url.searchParams.set('section', 'partners');
      } else if (nav === 'pickups-and-passes') {
        url.searchParams.set('section', 'pickups');
      } else if (nav === 'impact-and-analytics') {
        url.searchParams.set('section', 'impact');
      } else if (nav === 'users-directory') {
        url.searchParams.set('section', 'users');
      } else if (nav === 'accounting-report') {
        url.searchParams.set('section', 'accounting');
      } else if (nav === 'paid-stories') {
        url.searchParams.set('section', 'paid-stories');
      } else {
        url.searchParams.delete('section');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const [selectedRegion, setSelectedRegion] = useState('منطقة مسقط - ولاية السيب (الخوض)');
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modals
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedPickupDetail, setSelectedPickupDetail] = useState<any | null>(null);

  // Form states
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreWilayah, setNewStoreWilayah] = useState('السيب');
  const [newStoreArea, setNewStoreArea] = useState('الخوض');
  const [newStoreCategory, setNewStoreCategory] = useState('bakery');
  const [newStoreCR, setNewStoreCR] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('+968 ');
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPhone, setNewManagerPhone] = useState('+968 ');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Live Pickups Data
  const [pickups, setPickups] = useState([
    {
      id: 'RES-84920',
      storeName: 'مخبز مسقط النور المركزي',
      storeIcon: 'bakery_dining',
      beneficiary: 'عبدالله السلمان',
      beneficiaryNote: 'عائلة مستحقة (كود #49)',
      windowTime: '08:30 م - 09:15 م',
      status: 'completed',
      statusText: 'مكتمل الاستلام',
      phone: '+968 9123 4567',
      items: 'صندوق مخبوزات طازجة متنوعة (كرواسون، خبز، دونات)',
      priceOmr: 1.500,
    },
    {
      id: 'RES-84924',
      storeName: 'سوبرماركت البركة العُمانية',
      storeIcon: 'shopping_cart',
      beneficiary: 'فهد المطيري',
      beneficiaryNote: 'مندوب جمعية البر العمانية',
      windowTime: '09:00 م - 09:45 م',
      status: 'pending',
      statusText: 'بانتظار الحضور (15 دقيقة)',
      phone: '+968 9876 5432',
      items: 'سلة خضار وفواكه المزارع العمانية',
      priceOmr: 1.800,
    },
    {
      id: 'RES-84918',
      storeName: 'مطابخ الأندلس للضيافة',
      storeIcon: 'restaurant',
      beneficiary: 'سعد القحطاني',
      beneficiaryNote: 'حجز فردي مباشر',
      windowTime: '07:45 م - 08:30 م',
      status: 'cancelled',
      statusText: 'ملغي (أعيد طرح السلة)',
      phone: '+968 9333 2211',
      items: 'وجبة عائلية عمانية جاهزة',
      priceOmr: 2.300,
    },
    {
      id: 'RES-84929',
      storeName: 'واحة البن والمخبوزات - الخوض',
      storeIcon: 'local_cafe',
      beneficiary: 'أم ريان',
      beneficiaryNote: 'حجز إغاثي معتمد',
      windowTime: '09:15 م - 10:00 م',
      status: 'preparing',
      statusText: 'قيد التجهيز في المتجر',
      phone: '+968 9555 4433',
      items: 'معجنات وكرواسون مع مشروب منعش',
      priceOmr: 1.200,
    },
  ]);

  const [storesList, setStoresList] = useState<Store[]>([
    {
      id: 'st-1',
      name: 'مخبز مسقط النور - فرع الخوض',
      crNumber: 'CR-1049281',
      wilaya: 'السيب',
      area: 'الخوض',
      address: 'شارع مزون التجاري، قرب مجمع السيب الصحي',
      phone: '+968 2454 1122',
      category: 'bakery',
      logoUrl: '',
      managerName: 'يوسف المعمري',
      status: 'active',
      commissionRate: 0.15,
      coordinates: [23.6139, 58.1963],
      bankAccount: {
        bankName: 'بنك مسقط',
        accountHolder: 'مخبز مسقط النور ش.م.م',
        iban: 'OM48BMUS01234567890123',
      },
    },
    {
      id: 'st-2',
      name: 'أسواق البركة العُمانية',
      crNumber: 'CR-2083941',
      wilaya: 'السيب',
      area: 'الحيل الجنوبية',
      address: 'شارع البركات، مقابل حديقة الحيل',
      phone: '+968 2451 8899',
      category: 'produce',
      logoUrl: '',
      managerName: 'خالد العامري',
      status: 'active',
      commissionRate: 0.15,
      coordinates: [23.6288, 58.2144],
      bankAccount: {
        bankName: 'بنك ظفار',
        accountHolder: 'مؤسسة البركة للمواد الغذائية',
        iban: 'OM52BDHF09876543210987',
      },
    },
    {
      id: 'st-3',
      name: 'مطابخ الضيافة العُمانية',
      crNumber: 'CR-3094827',
      wilaya: 'بوشر',
      area: 'الغبرة الشمالية',
      address: 'شارع 18 نوفمبر، بوشر',
      phone: '+968 2449 3344',
      category: 'cooked',
      logoUrl: '',
      managerName: 'سعيد الحارثي',
      status: 'active',
      commissionRate: 0.15,
      coordinates: [23.5932, 58.3842],
      bankAccount: {
        bankName: 'البنك الوطني العماني',
        accountHolder: 'شركة الضيافة للمطاعم',
        iban: 'OM31NBO011223344556677',
      },
    },
    {
      id: 'st-4',
      name: 'مقهى الركن - شاطئ القرم',
      crNumber: 'CR-4019283',
      wilaya: 'مطرح',
      area: 'شاطئ القرم',
      address: 'مجمع الواجهة البحرية، القرم',
      phone: '+968 2460 7711',
      category: 'cafe',
      logoUrl: '',
      managerName: 'أحمد الفارسي',
      status: 'active',
      commissionRate: 0.15,
      coordinates: [23.6195, 58.4682],
      bankAccount: {
        bankName: 'بنك مسقط',
        accountHolder: 'مقهى الركن المتميز',
        iban: 'OM48BMUS09988776655443',
      },
    },
    {
      id: 'st-5',
      name: 'حلويات النزواني الأصيلة',
      crNumber: 'CR-5029184',
      wilaya: 'السيب',
      area: 'الموالح الجنوبية',
      address: 'سوق الخوض التجاري',
      phone: '+968 2453 9900',
      category: 'bakery',
      logoUrl: '',
      managerName: 'مبارك النزواني',
      status: 'pending',
      commissionRate: 0.15,
      coordinates: [23.6080, 58.2300],
      bankAccount: {
        bankName: 'بنك مسقط',
        accountHolder: 'حلويات النزواني',
        iban: 'OM48BMUS05544332211009',
      },
    },
  ]);

  // الإحصائيات الحقيقية المحسوبة من قاعدة البيانات (GET /api/v1/admin/analytics)
  const [adminStats, setAdminStats] = useState<{
    totalStores: number;
    activeStores: number;
    pendingStores: number;
    grossSalesOmr: number;
    platformCommissionOmr: number;
    mealsRescued: number;
    totalOrders: number;
    nonCancelledPct: number;
    todayStat: { total: number; collected: number; pending: number; cancelled: number };
    weekly: { day: string; salesOmr: number; ordersCount: number; isPeak: boolean }[];
    recentOrders: {
      id: string;
      storeName: string;
      beneficiary: string;
      beneficiaryNote: string;
      windowTime: string;
      status: string;
      statusText: string;
      phone: string;
      items: string;
      priceOmr: number;
    }[];
  } | null>(null);

  // تحليلات المستخدمين والحجوزات (GET /api/v1/admin/users-analytics)
  const [usersAnalytics, setUsersAnalytics] = useState<AdminUsersAnalyticsData | null>(null);

  // عداد طلبات انضمام الشركاء الجديدة (شارة زر القسم)
  const [partnerNewCount, setPartnerNewCount] = useState(0);

  useEffect(() => {
    if (!authToken || !hasPerm('stores')) return;
    let isActive = true;
    fetch('/api/v1/admin/partner-requests', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (isActive && response.ok && result?.success) {
          setPartnerNewCount(result.newCount || 0);
        }
      })
      .catch(() => { /* تبقى الشارة مخفية عند التعذر */ });
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // Notifications Feed
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      icon: 'event_busy',
      iconColor: 'text-stone-400',
      bgColor: 'bg-stone-100',
      title: 'تم إلغاء الحجز RES-84920 من قِبل المستفيد، وأعيد إتاحة السلة فوراً بالمتجر',
      time: 'منذ 5 دقائق • عبر تطبيق المستفيد',
    },
    {
      id: 2,
      icon: 'add_box',
      iconColor: 'text-[#006948]',
      bgColor: 'bg-[#006948]/10',
      title: 'سوبرماركت البركة الخيرية أضاف 15 سلة خضار وفواكه طازجة جاهزة للاستلام السريع',
      time: 'منذ 18 دقيقة • الخوض، السيب',
    },
    {
      id: 3,
      icon: 'task_alt',
      iconColor: 'text-[#00855b]',
      bgColor: 'bg-[#00855b]/15',
      title: 'اكتمال استلام 100% من حصص مخبز النور المركزي لليوم بنجاح دون أي هدر مسجل',
      time: 'منذ 34 دقيقة • تصريح رقم RES-84880',
    },
  ]);

  // رسائل الدعم الفني الواردة من المستفيدين (تُحدَّث لحظياً)
  const [supportMessages, setSupportMessages] = useState<any[]>([]);

  // تنبيه جماعي إلخ
  useEffect(() => {
    if (!authToken) return;
    let isActive = true;
    const load = async () => {
      try {
        const response = await fetch('/api/v1/admin/support-messages', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const result = await response.json();
        if (response.ok && isActive) setSupportMessages(result.messages || []);
      } catch {
        /* لا نعرض خطأً — التحديث الآلي سيعيد المحاولة */
      }
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => {
      isActive = false;
      window.clearInterval(id);
    };
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;
    let isActive = true;
    fetch('/api/v1/admin/stores', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'تعذر تحميل المتاجر');
        const stores: Store[] = (result.stores || []).map((store: any) => ({
          id: String(store._id),
          name: store.name,
          wilaya: store.wilayah,
          area: store.area,
          address: store.address,
          phone: store.phone,
          crNumber: store.crNumber,
          category: store.category,
          logoUrl: store.logoUrl || '',
          managerName: store.managerId?.name || 'لم يحدد مدير',
          status: store.status,
          commissionRate: store.commissionRate,
          coordinates: [store.coordinates?.lat || 23.6139, store.coordinates?.lng || 58.1963],
          bankAccount: {
            bankName: store.bankDetails?.bankName || '',
            accountHolder: store.bankDetails?.accountHolder || '',
            iban: store.bankDetails?.iban || '',
          },
        }));
        if (isActive) setStoresList(stores);
      })
      .catch((error) => {
        if (isActive && onNotify) onNotify(error instanceof Error ? error.message : 'تعذر تحميل المتاجر');
      });
    return () => {
      isActive = false;
    };
  }, [authToken]);

  // تحميل الإحصائيات الحقيقية (مبيعات المتاجر، الوجبات، طلبات اليوم، الرسم الأسبوعي)
  const loadAnalytics = useCallback(
    async (showToast = false) => {
      if (!authToken) return false;
      try {
        const response = await fetch('/api/v1/admin/analytics', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'تعذر تحميل الإحصائيات');
        if (result?.data) {
          setAdminStats(result.data);
          // ربط جدول الحجوزات اللحظية بالطلبات الحقيقية من قاعدة البيانات
          if (Array.isArray(result.data.recentOrders)) {
            const mapped = (result.data.recentOrders as {
              id: string;
              storeName: string;
              beneficiary: string;
              beneficiaryNote: string;
              windowTime: string;
              status: string;
              statusText: string;
              phone: string;
              items: string;
              priceOmr: number;
            }[]).map((o) => ({
              id: o.id,
              storeName: o.storeName,
              storeIcon: 'storefront',
              beneficiary: o.beneficiary,
              beneficiaryNote: o.beneficiaryNote,
              windowTime: o.windowTime,
              status: o.status === 'collected' ? 'completed' : o.status, // collected → completed
              statusText: o.statusText,
              phone: o.phone,
              items: o.items,
              priceOmr: o.priceOmr,
            }));
            setPickups(mapped);
          }
          if (showToast && onNotify) onNotify('تمت مزامنة الإحصائيات الحقيقية من قاعدة البيانات');
        }
        return true;
      } catch (error) {
        if (onNotify) onNotify(error instanceof Error ? error.message : 'تعذر تحميل الإحصائيات');
        return false;
      }
    },
    [authToken, onNotify]
  );

  useEffect(() => {
    void loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // تحميل تحليلات المستخدمين والحجوزات (دليل المستخدمين وحجوزات المتاجر)
  useEffect(() => {
    if (!authToken) return;
    if (!hasPerm('users')) {
      setUsersAnalytics(null);
      return;
    }
    let isActive = true;
    fetch('/api/v1/admin/users-analytics', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'تعذر تحميل تحليلات المستخدمين');
        if (isActive && result?.data) setUsersAnalytics(result.data);
      })
      .catch(() => {
        /* التحميل صامت — سيُعاد عند تحديث الصفحة أو إعادة المحاولة */
      });
    return () => {
      isActive = false;
    };
  }, [authToken]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadAnalytics(true).finally(() => {
      setIsRefreshing(false);
    });
  };

  const handleEditStore = async (updated: Store): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const response = await fetch(`/api/v1/admin/stores/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name: updated.name,
          phone: updated.phone,
          address: updated.address,
          area: updated.area,
          wilaya: updated.wilaya,
          category: updated.category,
          crNumber: updated.crNumber,
          status: updated.status,
          commissionRate: updated.commissionRate,
          bankDetails: updated.bankAccount,
          logoUrl: updated.logoUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (onNotify) onNotify(result.message || 'تعذر تحديث المتجر');
        return false;
      }
      setStoresList((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      return true;
    } catch {
      if (onNotify) onNotify('تعذر الاتصال بالخادم');
      return false;
    }
  };

  const handleAddStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !authToken) return;
    if (newManagerPassword.length < 8) {
      if (onNotify) onNotify('كلمة مرور مدير المتجر يجب ألا تقل عن 8 أحرف');
      return;
    }

    setIsCreatingStore(true);
    try {
      const response = await fetch('/api/v1/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          store: {
            name: newStoreName.trim(),
            crNumber: newStoreCR.trim(),
            category: newStoreCategory,
            wilayah: newStoreWilayah,
            area: newStoreArea.trim(),
            address: newStoreAddress.trim(),
            phone: newStorePhone.trim(),
          },
          manager: {
            name: newManagerName.trim(),
            email: newManagerEmail.trim(),
            phone: newManagerPhone.trim(),
            password: newManagerPassword,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر إنشاء المتجر ومديره');

      const newStore: Store = {
        id: result.store.id,
        name: result.store.name,
        wilaya: newStoreWilayah as any,
        area: newStoreArea,
        address: newStoreAddress,
        phone: newStorePhone,
        crNumber: result.store.crNumber,
        category: newStoreCategory as any,
        logoUrl: '',
        managerName: result.store.manager.name,
        status: 'active',
        commissionRate: 0.15,
        coordinates: [23.6139, 58.1963],
        bankAccount: { bankName: 'بنك مسقط', accountHolder: newStoreName, iban: '' },
      };
      setStoresList((prev) => [newStore, ...prev]);
      setShowAddStoreModal(false);
      setNewStoreName('');
      setNewStoreCR('');
      setNewStoreAddress('');
      setNewManagerName('');
      setNewManagerEmail('');
      setNewManagerPassword('');
      if (onNotify) onNotify(`تم إنشاء المتجر وحساب مديره (${result.store.manager.email})`);
    } catch (error) {
      if (onNotify) onNotify(error instanceof Error ? error.message : 'تعذر إنشاء المتجر ومديره');
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setNotifications((prev) => [
      {
        id: Date.now(),
        icon: 'campaign',
        iconColor: 'text-[#855300]',
        bgColor: 'bg-[#fea619]/20',
        title: `تنبيه إداري جماعي: ${broadcastMessage}`,
        time: 'الآن • صادر من مشرف العمليات',
      },
      ...prev,
    ]);

    setShowBroadcastModal(false);
    setBroadcastMessage('');
    if (onNotify) onNotify('تم بث التنبيه لجميع المتاجر الشريكة في مسقط');
  };

  const handleExportPDF = () => {
    if (onNotify) onNotify('جارِ إعداد وتحميل التقرير التنفيذي الشامل (PDF) لمحافظة مسقط...');
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen font-['IBM_Plex_Sans_Arabic','IBM_Plex_Sans',sans-serif]" dir="rtl">
      {/* Right Sidebar */}
      <aside className="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-l border-[#eaedff] z-30 flex flex-col justify-between overflow-y-auto hidden lg:flex">
        <div className="p-5">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#eaedff]">
            {projectLogo ? (
              <img
                src={projectLogo}
                alt="شعار المشروع"
                className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-stone-200 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#006948] text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                DB
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-base font-black text-[#006948] leading-tight">إنقاذ الغذاء</span>
              <span className="text-[11px] text-stone-500 font-medium">DealBox Food Rescue</span>
            </div>
          </div>

          {/* Central Admin Pill */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f3ff] text-stone-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#006948]"></span>
              لوحة الإدارة المركزية
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 text-xs">
            {canAccess('overview-dashboard') && (
            <button
              type="button"
              onClick={() => handleNavChange('overview-dashboard')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'overview-dashboard'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span>لوحة التحكم العامة</span>
              </div>
              {activeNav === 'overview-dashboard' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              )}
            </button>
            )}

            {canAccess('stores-and-hubs') && (
            <button
              type="button"
              onClick={() => handleNavChange('stores-and-hubs')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'stores-and-hubs'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                <span>إدارة المتاجر والمخازن</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006948] text-[10px] font-bold">
                {storesList.length}
              </span>
            </button>
            )}
            {canAccess('partner-requests') && (
            <button
              type="button"
              onClick={() => handleNavChange('partner-requests')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'partner-requests'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">handshake</span>
                <span>طلبات انضمام الشركاء</span>
              </div>
              {partnerNewCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#fea619] text-white text-[10px] font-bold">
                  {partnerNewCount} جديد
                </span>
              )}
            </button>
            )}

            {canAccess('pickups-and-passes') && (
            <button
              type="button"
              onClick={() => handleNavChange('pickups-and-passes')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'pickups-and-passes'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>الحجوزات والاستلام الفوري</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-[#fea619] text-white font-bold text-[10px]">
                {adminStats ? adminStats.todayStat.total : 0}
              </span>
            </button>
            )}

            {canAccess('impact-and-analytics') && (
            <button
              type="button"
              onClick={() => handleNavChange('impact-and-analytics')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'impact-and-analytics'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">monitoring</span>
                <span>تقارير الأثر وهدر الطعام</span>
              </div>
            </button>
            )}

            {canAccess('users-directory') && (
            <button
              type="button"
              onClick={() => handleNavChange('users-directory')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'users-directory'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span>قائمة المستخدمين</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006948] text-[10px] font-bold">
                {usersAnalytics ? usersAnalytics.summary.totalUsers : 0}
              </span>
            </button>
            )}

            {canAccess('accounting-report') && (
            <button
              type="button"
              onClick={() => handleNavChange('accounting-report')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'accounting-report'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                <span>الحسابات والتقرير المحاسبي</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-[#e2e7ff] text-stone-600 text-[10px] font-bold">
                تصدير
              </span>
            </button>
            )}

            {canAccess('paid-stories') && (
            <button
              type="button"
              onClick={() => handleNavChange('paid-stories')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'paid-stories'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">photo_library</span>
                <span>قصص المتاجر المدفوعة</span>
              </div>
            </button>
            )}

            {canAccess('settings-and-roles') && (
            <button
              type="button"
              onClick={() => handleNavChange('settings-and-roles')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${
                activeNav === 'settings-and-roles'
                  ? 'bg-[#006948] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#f2f3ff] hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                <span>الإعدادات والمشرفين</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">
                النظام
              </span>
            </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-[#eaedff] flex flex-col gap-2.5 bg-stone-50/50">
          <div className="p-2.5 rounded-xl bg-white border border-stone-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-stone-600 font-medium">الخوادم متصلة</span>
            </div>
            <span className="font-mono font-bold text-[#006948]">99.9%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-stone-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-stone-600">
              <span className="material-symbols-outlined text-[18px] text-amber-600">support_agent</span>
              <span className="font-medium">طوارئ الفائض</span>
            </div>
            <span className="font-mono font-bold text-[#131b2e]" dir="ltr">+968 244 800</span>
          </div>

          <div className="pt-1">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#e2e7ff]/60">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-[#006948] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-[#131b2e]">م. سارة الخالد</span>
                  <span className="text-[10px] text-stone-500">مشرف العمليات الميدانية</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onNotify) onNotify('تم تسجيل الخروج من لوحة الإدارة');
                  if (onLogout) onLogout();
                }}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-white hover:text-rose-600 transition-colors"
                title="تسجيل الخروج والعودة لبوابة الدخول"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area with Right Padding for Sidebar on Desktop */}
      <div className="lg:pr-72 min-h-screen flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#eaedff] flex items-center justify-between px-4 sm:px-6 shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث سريع في المتاجر، الحجوزات، شحنات الفائض..."
                className="w-full h-10 pr-10 pl-4 bg-[#f2f3ff] rounded-xl text-xs text-[#131b2e] placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#006948]/20 transition-all font-medium"
              />
            </div>
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaedff] text-stone-600 text-xs whitespace-nowrap font-medium">
              <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse"></span>
              <span>نطاق مسقط / الخوض:</span>
              <span className="font-bold text-[#131b2e]">{storesList.length + 19} متجر نشط</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canAccess('settings-and-roles') && (
            <button
              type="button"
              onClick={() => handleNavChange('settings-and-roles')}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-all ${
                activeNav === 'settings-and-roles'
                  ? 'bg-[#131b2e] text-white shadow-xs'
                  : 'bg-[#e2e7ff] hover:bg-[#dae2fd] text-[#131b2e]'
              }`}
              title="إعدادات النظام وإدارة الصلاحيات"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              <span className="hidden sm:inline">إعدادات النظام</span>
            </button>
            )}

            {canAccess('stores-and-hubs') && (
            <button
              type="button"
              onClick={() => setShowAddStoreModal(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>إضافة متجر جديد</span>
            </button>
            )}

            <button
              type="button"
              onClick={handleExportPDF}
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#e2e7ff] hover:bg-[#dae2fd] text-[#131b2e] text-xs font-bold transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>تصدير</span>
            </button>

            <button
              type="button"
              onClick={() => onNotify && onNotify('لديك 3 تنبيهات جديدة حول استلام السلال اليوم')}
              className="relative w-9 h-9 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-stone-600 hover:text-[#131b2e] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fea619] ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-4 sm:p-6 space-y-6 flex-1">
          {activeNav === 'stores-and-hubs' && canAccess('stores-and-hubs') ? (
            <AdminStoresSection
              storesList={storesList as Store[]}
              onAddStore={() => setShowAddStoreModal(true)}
              onNotify={onNotify}
              authToken={authToken || ''}
              onEditStore={handleEditStore}
            />
          ) : activeNav === 'partner-requests' && canAccess('partner-requests') ? (
            <AdminPartnerRequestsSection
              authToken={authToken || ''}
              onNotify={onNotify}
              onCountChange={setPartnerNewCount}
            />
          ) : activeNav === 'pickups-and-passes' && canAccess('pickups-and-passes') ? (
            <AdminPickupsSection
              pickups={pickups}
              setPickups={setPickups}
              adminStats={adminStats}
              usersAnalytics={usersAnalytics}
              onNotify={onNotify}
              onShowDetail={(item) => setSelectedPickupDetail(item)}
            />
          ) : activeNav === 'impact-and-analytics' && canAccess('impact-and-analytics') ? (
            <AdminImpactSection adminStats={adminStats} onNotify={onNotify} />
          ) : activeNav === 'users-directory' && canAccess('users-directory') ? (
            <AdminUsersSection data={usersAnalytics} onNotify={onNotify} />
          ) : activeNav === 'accounting-report' && canAccess('accounting-report') ? (
            <AdminAccountingSection authToken={authToken || ''} onNotify={onNotify} />
          ) : activeNav === 'paid-stories' && canAccess('paid-stories') ? (
            <div className="space-y-6">
              <AdminPaidStoriesSection
                authToken={authToken || ''}
                onNotify={onNotify}
                canManageSettings={canAccess('settings-and-roles')}
              />
              {canAccess('settings-and-roles') && (
                <AdminLoyaltySettings authToken={authToken || ''} onNotify={onNotify} />
              )}
            </div>
          ) : activeNav === 'settings-and-roles' && canAccess('settings-and-roles') ? (
            <div className="space-y-6">
              <AdminAnnouncementSettings authToken={authToken || ''} onNotify={onNotify} />
              <AdminSystemSettingsView
                onNotify={onNotify}
                onBackToOverview={() => handleNavChange('overview-dashboard')}
                projectLogo={projectLogo}
                onUpdateLogo={onUpdateLogo}
                introSlides={introSlides}
                onUpdateIntroSlides={onUpdateIntroSlides}
                googleAuthConfig={googleAuthConfig}
                onUpdateGoogleAuthConfig={onUpdateGoogleAuthConfig}
                authToken={authToken || ''}
                sessionUser={sessionUser}
              />
            </div>
          ) : (
            <>
          {/* Top Welcome Banner & Control Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-[#131b2e]">
                  مرحباً بك مجدداً، مشرف العمليات المركزية 👋
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#e2e7ff] text-stone-600 text-[11px] font-bold">
                  الوردية الصباحية
                </span>
              </div>
              <p className="text-xs text-stone-500">
                لوحة المتابعة الميدانية الحية لعمليات إنقاذ الغذاء والتوزيع الفوري بالمتاجر وشبكة بنوك الطعام في سلطنة عُمان
              </p>
            </div>

            {/* Filters & Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Live Sync Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f2f3ff] text-stone-600 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006948] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006948]"></span>
                </span>
                <span>تحديث مباشر</span>
                <span className="text-stone-400 text-[11px] font-normal">(منذ لحظات)</span>
              </div>

              {/* Region Selector */}
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="appearance-none h-10 pr-8 pl-8 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold cursor-pointer hover:bg-[#eaedff] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#006948]/20"
                >
                  <option>منطقة مسقط - ولاية السيب (الخوض)</option>
                  <option>منطقة مسقط - ولاية السيب (الحيل الجنوبية)</option>
                  <option>منطقة مسقط - ولاية بوشر (الغبرة والعذيبة)</option>
                  <option>منطقة مسقط - ولاية مطرح (القرم وشاطئ القرم)</option>
                  <option>محافظة شمال الباطنة - ولاية صحار</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-[18px] pointer-events-none">
                  location_on
                </span>
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-stone-500 text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>

              {/* Date Range Chips */}
              <div className="flex items-center rounded-xl bg-[#f2f3ff] p-1 text-xs font-semibold text-stone-600">
                <button
                  type="button"
                  onClick={() => setDateRange('today')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    dateRange === 'today' ? 'bg-white text-[#006948] font-bold shadow-xs' : 'hover:text-[#131b2e]'
                  }`}
                >
                  اليوم: {new Date().toLocaleDateString('ar-OM', { day: 'numeric', month: 'long' }) || 'اليوم'}
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('7days')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    dateRange === '7days' ? 'bg-white text-[#006948] font-bold shadow-xs' : 'hover:text-[#131b2e]'
                  }`}
                >
                  آخر 7 أيام
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('month')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    dateRange === 'month' ? 'bg-white text-[#006948] font-bold shadow-xs' : 'hover:text-[#131b2e]'
                  }`}
                >
                  هذا الشهر
                </button>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className={`h-10 w-10 flex items-center justify-center rounded-xl bg-[#e2e7ff] text-[#131b2e] hover:bg-[#dae2fd] transition-colors ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                title="إعادة مزامنة"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Total Rescued Meals */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-stone-500 font-semibold">إجمالي الوجبات المنقذة</span>
                  <span className="text-3xl font-black text-[#131b2e] font-mono tracking-tight" dir="ltr">
                    {adminStats ? adminStats.mealsRescued.toLocaleString('en-US') : '—'}
                  </span>
                  <span className="text-[11px] text-stone-400">{adminStats ? `من ${adminStats.totalOrders} طلباً مكتملاً` : 'وجبة جاهزة صالحة للاستهلاك'}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">eco</span>
                </div>
              </div>
              <div className="mt-4 pt-2 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-[#006948] font-bold">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    {adminStats ? `${adminStats.nonCancelledPct}%` : '—'} طلبات غير ملغاة
                  </span>
                  <span className="text-stone-400 text-[11px]">نسبة الطلبات المكتملة أو النشطة</span>
                </div>
                {/* Sparkline SVG */}
                <svg className="w-full h-7 text-[#006948] overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 200 35">
                  <path d="M0 28 Q 25 22, 50 25 T 100 15 T 150 18 T 200 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                  <path d="M0 28 Q 25 22, 50 25 T 100 15 T 150 18 T 200 4 L 200 35 L 0 35 Z" fill="currentColor" fillOpacity="0.08"></path>
                </svg>
              </div>
            </div>

            {/* Card 2: Active Stores & Hubs */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-stone-500 font-semibold">المتاجر والمخازن النشطة</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#131b2e] font-mono" dir="ltr">
                      {adminStats ? adminStats.activeStores : 0}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">من أصل {adminStats ? adminStats.totalStores : 0} شريك</span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ffddb8] text-[#855300] text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#855300]"></span>
                      {(adminStats ? adminStats.pendingStores : 0)} متاجر قيد الانضمام
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#e2e7ff] text-[#131b2e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">storefront</span>
                </div>
              </div>
              <div className="mt-4 pt-2 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00855b]"></span>
                  {adminStats && adminStats.totalStores > 0
                    ? `${Math.round((adminStats.activeStores / adminStats.totalStores) * 100)}% متاجر نشطة`
                    : '— متاجر نشطة'}
                </span>
                <span className="font-bold text-[#006948]">سلطنة عُمان</span>
              </div>
            </div>

            {/* Card 3: Daily Pickup Passes */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-stone-500 font-semibold">حجوزات الاستلام اليومية</span>
                  <span className="text-3xl font-black text-[#131b2e] font-mono" dir="ltr">
                    {adminStats ? adminStats.todayStat.total : 0}
                  </span>
                  <span className="text-[11px] text-stone-400">إجمالي تصاريح اليوم</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#e2e7ff] text-[#131b2e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">qr_code_2</span>
                </div>
              </div>
              <div className="mt-4 pt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006948]"></span>
                  {(adminStats ? adminStats.todayStat.collected : 0)} مكتمل
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffddb8] text-[#855300] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#855300] animate-pulse"></span>
                  {(adminStats ? adminStats.todayStat.pending : 0)} قيد الاستلام
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium">
                  {(adminStats ? adminStats.todayStat.cancelled : 0)} ملغاة
                </span>
              </div>
            </div>

            {/* Card 4: Total Store Sales (real data) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-stone-500 font-semibold">إجمالي مبيعات المتاجر</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#006948] font-mono font-bold" dir="ltr">
                      {adminStats ? adminStats.grossSalesOmr.toLocaleString('en-US', { minimumFractionDigits: 3 }) : '—'}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">ر.ع</span>
                  </div>
                  <span className="text-[11px] text-stone-400">إجمالي قيمة الطلبات غير الملغاة (حجم مبيعات المتاجر كاملاً)</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">payments</span>
                </div>
              </div>
              <div className="mt-4 pt-2 flex items-center justify-between text-xs text-stone-500">
                <span>عمولة المنصة (15%):</span>
                <span className="font-bold text-[#131b2e]" dir="ltr">{adminStats ? adminStats.platformCommissionOmr.toLocaleString('en-US', { minimumFractionDigits: 3 }) : '—'} ر.ع</span>
              </div>
            </div>
          </div>

          {/* Main Analytical & Operations Bento Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Main Column (8 cols): Flow Chart & Active Permits Table */}
            <div className="xl:col-span-8 flex flex-col gap-6">
              {/* Card A: Rescue Flow Trends Chart */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-base sm:text-lg font-black text-[#131b2e]">
                      معدل تدفق مبيعات المتاجر الأسبوعي
                    </h2>
                    <p className="text-xs text-stone-500">
                      حجم مبيعات المتاجر بالريال العماني خلال آخر 7 أيام (بيانات حقيقية من الطلبات غير الملغاة)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#f2f3ff] text-stone-700 text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">schedule</span>
                      إجمالي {adminStats ? adminStats.grossSalesOmr.toLocaleString('en-US', { minimumFractionDigits: 3 }) : '—'} ر.ع
                    </span>
                  </div>
                </div>

                {/* Inline Visual Bar Chart (real weekly data) */}
                <div className="w-full flex flex-col gap-3 pt-3">
                  <div className="grid grid-cols-7 gap-2 sm:gap-4 h-56 items-end px-2">
                    {(() => {
                      const weekly = adminStats?.weekly?.length ? adminStats.weekly : [];
                      const maxSales = weekly.reduce((m, d) => Math.max(m, d.salesOmr), 0);
                      const totalSales = weekly.reduce((s, d) => s + d.salesOmr, 0);
                      return weekly.map((day) => {
                        const isPeak = day.isPeak;
                        const pct = maxSales > 0 ? Math.max((day.salesOmr / maxSales) * 95, 3) : 3;
                        return (
                          <div key={day.day} className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                            <div className={`text-[11px] ${isPeak ? 'text-[#006948] font-bold opacity-100' : 'text-stone-500 opacity-0 group-hover:opacity-100'} transition-opacity whitespace-nowrap font-mono`}>
                              {day.salesOmr > 0 ? `${day.salesOmr.toLocaleString('en-US', { maximumFractionDigits: 3 })} ر.ع` : '0'} {isPeak ? '⭐' : ''}
                            </div>
                            <div className={`w-full max-w-[48px] rounded-xl transition-colors ${isPeak ? 'bg-[#006948] shadow-xs relative' : 'bg-[#e2e7ff] group-hover:bg-[#85f8c4]'}`} style={{ height: `${pct}%` }}>
                              {isPeak && <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#fea619]"></span>}
                            </div>
                            <span className={`text-xs ${isPeak ? 'font-bold text-[#006948]' : 'text-stone-500 font-medium'}`}>{day.day}</span>
                            <span className="text-[10px] text-stone-400">{day.ordersCount} طلب</span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Axis baseline & legends */}
                  <div className="h-1 w-full bg-[#e2e7ff] rounded-full mt-2"></div>
                  <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-2 px-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-[#006948]"></span>
                        ذروة المبيعات
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-[#e2e7ff]"></span>
                        المعدل الاعتيادي
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-400 text-[11px]">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      بيانات حقيقية مباشرة من الطلبات • {adminStats ? adminStats.totalOrders : 0} طلب
                    </div>
                  </div>
                </div>
              </div>

              {/* Card B: Real-time Pickups & Permits Table */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[#131b2e]">
                        المتابعة اللحظية للحجوزات وتصاريح الاستلام النشطة
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] text-xs font-bold">
                        مباشر
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">
                      تدفق المستفيدين والمندوبين المعتمدين عند بوابات التسليم بالمتاجر
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNotify && onNotify('تم تطبيق معايير التصفية للحجوزات')}
                      className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff] transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">filter_list</span>
                      <span>تصفية</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNotify && onNotify('تم تصدير قائمة الحجوزات بنجاح بصيغة CSV')}
                      className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] text-xs font-semibold hover:bg-[#eaedff] transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">ios_share</span>
                      <span>تصدير القائمة</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#f2f3ff] text-stone-600 text-xs font-bold">
                        <th className="py-3 px-4 rounded-r-xl">رقم التصريح</th>
                        <th className="py-3 px-4">المتجر الشريك</th>
                        <th className="py-3 px-4">المستفيد / المندوب</th>
                        <th className="py-3 px-4">نافذة الاستلام</th>
                        <th className="py-3 px-4">الحالة</th>
                        <th className="py-3 px-4 rounded-l-xl text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y-0 text-[#131b2e]">
                      {pickups.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-[#f2f3ff]/60 transition-colors ${
                            idx % 2 === 1 ? 'bg-[#f2f3ff]/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-[#006948]" dir="ltr">
                            {item.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#e2e7ff] flex items-center justify-center text-stone-600">
                                <span className="material-symbols-outlined text-[16px]">
                                  {item.storeIcon}
                                </span>
                              </div>
                              <span className="font-semibold">{item.storeName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold">{item.beneficiary}</span>
                              <span className="text-[10px] text-stone-400">{item.beneficiaryNote}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 ${item.status === 'cancelled' ? 'line-through text-stone-400' : 'text-stone-600 font-medium'}`} dir="ltr">
                              <span className="material-symbols-outlined text-[14px]">
                                {item.status === 'cancelled' ? 'close' : item.status === 'pending' ? 'hourglass_top' : 'timer'}
                              </span>
                              {item.windowTime}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {item.status === 'completed' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#006948]/10 text-[#006948] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#006948] animate-pulse"></span>
                                {item.statusText}
                              </span>
                            )}
                            {item.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffddb8] text-[#855300] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#855300] animate-ping"></span>
                                {item.statusText}
                              </span>
                            )}
                            {item.status === 'cancelled' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                                {item.statusText}
                              </span>
                            )}
                            {item.status === 'preparing' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffddb8] text-[#855300] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#855300]"></span>
                                {item.statusText}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedPickupDetail(item)}
                                className="w-8 h-8 rounded-lg text-stone-500 hover:bg-[#eaedff] hover:text-[#131b2e] flex items-center justify-center transition-colors"
                                title="تفاصيل السلة"
                              >
                                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onNotify && onNotify(`جارِ الاتصال بالمستفيد (${item.beneficiary}): ${item.phone}`)}
                                className="w-8 h-8 rounded-lg text-stone-500 hover:bg-[#eaedff] hover:text-[#006948] flex items-center justify-center transition-colors"
                                title="اتصال بالمتلقي"
                              >
                                <span className="material-symbols-outlined text-[18px]">phone</span>
                              </button>
                              {item.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => onNotify && onNotify(`تم إرسال تذكير SMS للمستفيد (${item.beneficiary}) للاستلام قبل إغلاق النافذة`)}
                                  className="w-8 h-8 rounded-lg text-stone-500 hover:bg-[#eaedff] hover:text-[#006948] flex items-center justify-center transition-colors"
                                  title="إرسال تذكير SMS"
                                >
                                  <span className="material-symbols-outlined text-[18px]">sms</span>
                                </button>
                              )}
                              {item.status === 'preparing' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPickups((prev) =>
                                      prev.map((p) => (p.id === item.id ? { ...p, status: 'completed', statusText: 'مكتمل الاستلام' } : p))
                                    );
                                    if (onNotify) onNotify(`تم تأكيد تجهيز واستلام تصريح (${item.id}) بنجاح`);
                                  }}
                                  className="w-8 h-8 rounded-lg text-stone-500 hover:bg-[#eaedff] hover:text-[#006948] flex items-center justify-center transition-colors"
                                  title="تأكيد التجهيز"
                                >
                                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 text-xs text-stone-500">
                  <span>عرض {pickups.length} من أصل {adminStats ? Math.max(adminStats.totalOrders, pickups.length) : 0} تصريح حجز</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-stone-400 flex items-center justify-center disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px] rotate-180">chevron_right</span>
                    </button>
                    <span className="px-3 py-1 rounded-lg bg-[#006948] text-white font-bold">1</span>
                    <button type="button" className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-stone-700 flex items-center justify-center hover:bg-[#eaedff]">
                      2
                    </button>
                    <button type="button" className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-stone-700 flex items-center justify-center hover:bg-[#eaedff]">
                      3
                    </button>
                    <button type="button" className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-stone-700 flex items-center justify-center hover:bg-[#eaedff]">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Column (4 cols): Live Feed, Quick Admin Actions */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              {/* Card D: Live Dispatch & Partner Notifications Feed */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-[#131b2e]">التنبيهات الميدانية الحية</h3>
                    <span className="w-2 h-2 rounded-full bg-[#fea619] animate-ping"></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNotify && onNotify('عرض سجل التنبيهات الميدانية المؤرشفة')}
                    className="text-xs text-[#006948] font-bold hover:underline"
                  >
                    عرض السجل
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg ${notif.bgColor} ${notif.iconColor} flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-[18px]">{notif.icon}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-[#131b2e] font-medium leading-relaxed">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-stone-400">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Inbox from beneficiaries (live) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-[#131b2e]">رسائل الدعم الفني</h3>
                    {supportMessages.length > 0 && (
                      <span className="rounded-full bg-[#006948]/10 px-2 py-0.5 text-[11px] font-bold text-[#006948]">{supportMessages.length}</span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    مباشر
                  </span>
                </div>

                {supportMessages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-stone-300 bg-[#faf8ff] p-6 text-center text-xs text-stone-400">
                    لا توجد رسائل بعد. ستظهر هنا مباشرةً عند إرسال مستفيد رسالة دعم.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {supportMessages.map((msg) => (
                      <div key={msg._id} className="rounded-xl bg-[#f2f3ff] p-3.5">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-[#131b2e]">{msg.name || msg.email || 'مستفيد'}</span>
                          <span className="text-[10px] text-stone-400" dir="ltr">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed text-stone-700">{msg.message}</p>
                        {msg.phone && (
                          <span className="mt-1 block text-[10px] text-stone-400" dir="ltr">{msg.phone}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card E: Quick Admin Action Shortcuts */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col">
                <h3 className="text-sm sm:text-base font-black text-[#131b2e] mb-3">إجراءات إدارية سريعة</h3>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] hover:bg-[#006948] hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-[#006948] group-hover:text-white">
                        broadcast_on_personal
                      </span>
                      <span className="text-xs font-bold">إرسال تنبيه جماعي للمتاجر</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-stone-400 group-hover:text-white">
                      chevron_left
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDispatchModal(true)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] hover:bg-[#006948] hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-[#006948] group-hover:text-white">
                        local_shipping
                      </span>
                      <span className="text-xs font-bold">جدولة شحنة إغاثة طارئة</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-stone-400 group-hover:text-white">
                      chevron_left
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff] text-[#131b2e] hover:bg-[#006948] hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-[#006948] group-hover:text-white">
                        picture_as_pdf
                      </span>
                      <span className="text-xs font-bold">تحميل التقرير الشامل (PDF)</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-stone-400 group-hover:text-white">
                      download
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </main>
      </div>

      {/* Modal: Add New Store */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-[#006948]">
                <span className="material-symbols-outlined text-[24px]">add_business</span>
                <h3 className="text-base font-black text-[#131b2e]">إضافة واعتماد متجر شريك جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddStoreSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-600 font-bold mb-1">اسم المتجر أو المنشأة التجارية *</label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="مثال: مخبز القرم الذهبي"
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">الولاية *</label>
                  <select
                    value={newStoreWilayah}
                    onChange={(e) => setNewStoreWilayah(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  >
                    <option value="السيب">السيب</option>
                    <option value="بوشر">بوشر</option>
                    <option value="مطرح">مطرح</option>
                    <option value="العامرات">العامرات</option>
                    <option value="صحار">صحار</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1">المنطقة / الحي *</label>
                  <input
                    type="text"
                    required
                    value={newStoreArea}
                    onChange={(e) => setNewStoreArea(e.target.value)}
                    placeholder="مثال: الخوض أو الحيل"
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">عنوان المتجر *</label>
                  <input
                    type="text"
                    required
                    value={newStoreAddress}
                    onChange={(e) => setNewStoreAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1">هاتف المتجر *</label>
                  <input
                    type="tel"
                    required
                    value={newStorePhone}
                    onChange={(e) => setNewStorePhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
                <h4 className="font-black text-[#131b2e]">حساب مدير المتجر</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                    placeholder="اسم المدير"
                    className="h-10 min-w-0 rounded-xl border border-stone-300 bg-white px-3"
                  />
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={newManagerEmail}
                    onChange={(e) => setNewManagerEmail(e.target.value)}
                    placeholder="manager@example.com"
                    className="h-10 min-w-0 rounded-xl border border-stone-300 bg-white px-3 text-left"
                  />
                  <input
                    type="tel"
                    required
                    value={newManagerPhone}
                    onChange={(e) => setNewManagerPhone(e.target.value)}
                    placeholder="هاتف المدير"
                    className="h-10 min-w-0 rounded-xl border border-stone-300 bg-white px-3"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newManagerPassword}
                    onChange={(e) => setNewManagerPassword(e.target.value)}
                    placeholder="كلمة مرور مؤقتة (8 أحرف+)"
                    className="h-10 min-w-0 rounded-xl border border-stone-300 bg-white px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">الفئة الغذائية *</label>
                  <select
                    value={newStoreCategory}
                    onChange={(e) => setNewStoreCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  >
                    <option value="bakery">مخبوزات وحلويات</option>
                    <option value="supermarket">سوبرماركت وتموين</option>
                    <option value="produce">خضار وفواكه مزارع</option>
                    <option value="restaurant">مطاعم ووجبات جاهزة</option>
                    <option value="cafe">مقاهي ومشروبات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 font-bold mb-1">رقم السجل التجاري (CR)</label>
                  <input
                    type="text"
                    required
                    value={newStoreCR}
                    onChange={(e) => setNewStoreCR(e.target.value)}
                    placeholder="CR-1049281"
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
                سيتم تفعيل نسبة عمولة DealBox القياسية (15%) تلقائياً وربط المتجر بالخريطة التفاعلية ونظام التحقق من كود الاستلام (DB-XXXX).
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStore}
                  className="px-5 py-2 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold shadow-xs active:scale-95 transition-all disabled:opacity-60"
                >
                  {isCreatingStore ? 'جارٍ إنشاء المتجر...' : 'إنشاء المتجر وحساب المدير'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Broadcast Alert */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-[#855300]">
                <span className="material-symbols-outlined text-[24px]">broadcast_on_personal</span>
                <h3 className="text-base font-black text-[#131b2e]">إرسال تنبيه جماعي للمتاجر</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-600 font-bold mb-1">نص التنبيه الإداري الميداني *</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="مثال: يرجى من جميع مخابز ومتاجر الخوض تأكيد تحديث كميات الصناديق الفائضة قبل الساعة 8:00 مساءً لاستيعاب تدفق المستفيدين..."
                  className="w-full p-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>المستلمون: 28 متجر شريك في مسقط</span>
                <span className="text-emerald-700 font-bold">بث مباشر فوري</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold shadow-xs active:scale-95 transition-all"
                >
                  إرسال البث الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dispatch Emergency Relief */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-[#006948]">
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                <h3 className="text-base font-black text-[#131b2e]">جدولة شحنة إغاثة وتوزيع طارئة</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  تنبيه ضغط في مبردات الحيل الجنوبية (88%)
                </div>
                <p className="text-[11px] leading-relaxed">
                  سيتم توجيه شاحنة التبريد لنقل 350 كجم من الفائض إلى مستودع الخوض المركزي وبنك الطعام.
                </p>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">السائق والمندوب المكلّف</label>
                <div className="p-2.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-medium text-stone-700">
                  سالم الهنائي (مركبة تبريد #OM-4921)
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDispatchModal(false);
                    if (onNotify) onNotify('تم تأكيد انطلاق شحنة النقل الإغاثي وتخفيف الضغط بنجاح');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold shadow-xs active:scale-95 transition-all"
                >
                  تأكيد وانطلاق الشحنة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pickup Details */}
      {selectedPickupDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-[#006948]">
                <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                <h3 className="text-base font-black text-[#131b2e]">
                  تفاصيل تصريح الاستلام ({selectedPickupDetail.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPickupDetail(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">المتجر:</span>
                  <span className="font-bold text-[#131b2e]">{selectedPickupDetail.storeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">المستفيد:</span>
                  <span className="font-bold text-[#131b2e]">{selectedPickupDetail.beneficiary}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">الهاتف:</span>
                  <span className="font-mono font-bold text-stone-700" dir="ltr">{selectedPickupDetail.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">نافذة الاستلام:</span>
                  <span className="font-bold text-stone-700">{selectedPickupDetail.windowTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">المبلغ المدفوع:</span>
                  <span className="font-mono font-black text-[#006948]">{selectedPickupDetail.priceOmr.toFixed(3)} ر.ع</span>
                </div>
              </div>

              <div>
                <span className="text-stone-500 font-bold block mb-1">محتويات السلة:</span>
                <div className="p-2.5 rounded-xl bg-[#f2f3ff] text-stone-700 font-medium">
                  {selectedPickupDetail.items}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPickupDetail(null)}
                  className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold w-full"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
