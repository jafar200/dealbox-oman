import React, { useState, useEffect, useRef } from 'react';
import { DealBoxItem, Reservation } from '../types';

interface StoreDashboardViewProps {
  dealBoxes: DealBoxItem[];
  reservations: Reservation[];
  onOpenAddBox: () => void;
  onVerifyBookingCode: (code: string) => boolean;
  onUpdateBoxStock: (boxId: string, newCount: number) => void;
  onLogout?: () => void;
  authToken: string;
  storeName?: string;
}

type StoreSection = 'overview' | 'baskets' | 'orders' | 'stories' | 'settings';

interface ManagedStoreStory {
  id: string;
  imageData: string;
  caption: string;
  feeOmr: number;
  paymentReference: string;
  reviewStatus: 'pending_payment' | 'pending_review' | 'approved' | 'rejected';
  rejectionReason: string;
  expiresAt: string | null;
}

export const StoreDashboardView: React.FC<StoreDashboardViewProps> = ({
  dealBoxes,
  reservations,
  onOpenAddBox,
  onVerifyBookingCode,
  onUpdateBoxStock,
  authToken,
  storeName: authenticatedStoreName = '',
  onLogout,
}) => {
  // Determine active section from URL query (?portal=store&section=settings)
  const getInitialSection = (): StoreSection => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sec = params.get('section');
      if (sec === 'settings') return 'settings';
      if (sec === 'baskets') return 'baskets';
      if (sec === 'orders') return 'orders';
      if (sec === 'stories') return 'stories';
    }
    return 'overview';
  };

  const [activeSection, setActiveSection] = useState<StoreSection>(getInitialSection);
  const [codeInput, setCodeInput] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Store Settings Form State
  const [storeName, setStoreName] = useState(authenticatedStoreName || 'متجر DealBox');
  const [crNumber, setCrNumber] = useState('CR-1049281');
  const [storePhone, setStorePhone] = useState('+968 9123 4567');
  const [storeAddress, setStoreAddress] = useState('شارع مزون التجاري، الخوض السابعة، ولاية السيب، مسقط');
  const [pickupStart, setPickupStart] = useState('20:00');
  const [pickupEnd, setPickupEnd] = useState('22:30');
  const [bankName, setBankName] = useState('بنك مسقط - فرع الخوض');
  const [iban, setIban] = useState('OM48BMUS01234567890123');
  const [autoNotifyWhatsApp, setAutoNotifyWhatsApp] = useState(true);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);
  const [storeStories, setStoreStories] = useState<ManagedStoreStory[]>([]);
  const [storyFeeOmr, setStoryFeeOmr] = useState(0);
  const [storyFeePeriod, setStoryFeePeriod] = useState('weekly');
  const [storyImageData, setStoryImageData] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [paymentReferences, setPaymentReferences] = useState<Record<string, string>>({});
  const [storyError, setStoryError] = useState('');
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);

  // Store Logo State
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);
  const storeLogoInputRef = useRef<HTMLInputElement>(null);
  const storyImageInputRef = useRef<HTMLInputElement>(null);

  // بيانات المتجر الحقيقية من قاعدة البيانات (متجر جديد = فارغ تماماً)
  const [storeBoxes, setStoreBoxes] = useState<DealBoxItem[]>([]);
  const [storeStats, setStoreStats] = useState<{
    storeName: string;
    activeBoxesCount: number;
    todayPendingPickups: number;
    todayCollectedCount: number;
    weeklyGrossRevenueOmr: number;
    netPayoutPendingOmr: number;
  } | null>(null);
  const [storeOrders, setStoreOrders] = useState<Array<{
    id: string;
    bookingCode: string;
    clientName: string;
    clientPhone: string;
    boxTitle: string;
    quantity: number;
    pricePaidOmr: number;
    status: string;
    pickupWindow: string;
    createdAt: string;
  }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // جلب سلال المتجر وإحصائياته وطلباته من الخادم
  useEffect(() => {
    if (!authToken) return;
    let isActive = true;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        const [boxesRes, statsRes, ordersRes] = await Promise.all([
          fetch('/api/v1/store/boxes', { headers }),
          fetch('/api/v1/store/stats', { headers }),
          fetch('/api/v1/store/orders', { headers }),
        ]);
        if (!isActive) return;

        if (boxesRes.ok) {
          const d = await boxesRes.json();
          if (d?.success && Array.isArray(d.boxes)) {
            setStoreBoxes(d.boxes.map((b: Record<string, unknown>) => ({
              id: b.id,
              title: b.title,
              description: b.description,
              category: b.category,
              imageUrl: b.imageUrl,
              originalPrice: b.originalPrice,
              discountedPrice: b.discountedPrice,
              currency: b.currency,
              remainingCount: b.remainingCount,
              pickupStart: b.pickupStart,
              pickupEnd: b.pickupEnd,
              pickupDate: b.pickupDate,
            })));
          }
        }
        if (statsRes.ok) {
          const d = await statsRes.json();
          if (d?.success && d.data) {
            setStoreStats(d.data);
          }
        }
        if (ordersRes.ok) {
          const d = await ordersRes.json();
          if (d?.success && Array.isArray(d.orders)) {
            setStoreOrders(d.orders);
          }
        }
      } catch {
        // يبقى المتجر فارغاً عند تعذر الجلب
      } finally {
        if (isActive) setIsLoadingData(false);
      }
    };

    fetchData();
    return () => { isActive = false; };
  }, [authToken]);

  // Sync active section to URL
  const handleSectionChange = (section: StoreSection) => {
    setActiveSection(section);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', 'store');
      if (section === 'overview') {
        url.searchParams.delete('section');
      } else {
        url.searchParams.set('section', section);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveSection(getInitialSection());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadStoreStories = async () => {
    if (!authToken) return;
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [storiesResponse, settingsResponse] = await Promise.all([
        fetch('/api/v1/store/stories', { headers }),
        fetch('/api/v1/store/story-settings', { headers }).then(r => (r.ok ? r.json() : null)),
      ]);
      const storiesResult = await storiesResponse.json();
      const settingsResult = settingsResponse || {};
      if (!storiesResponse.ok) {
        throw new Error(storiesResult.message || 'تعذر تحميل القصص');
      }
      setStoreStories(storiesResult.stories || []);
      setStoryFeeOmr(settingsResult.storyPromotionFeeOmr || 0);
      setStoryFeePeriod(settingsResult.storyFeePeriod || 'weekly');
    } catch (error) {
      setStoryError(error instanceof Error ? error.message : 'تعذر الاتصال بالخادم');
    }
  };

  useEffect(() => {
    void loadStoreStories();
  }, [authToken]);

  const handleStoryImageSelect = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
      setStoryError('اختر صورة PNG أو JPG أو WebP بحجم لا يتجاوز 3 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setStoryImageData(String(reader.result || ''));
    reader.onerror = () => setStoryError('تعذر قراءة الصورة المختارة');
    reader.readAsDataURL(file);
  };

  const handleSubmitStory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!storyImageData) {
      setStoryError('اختر صورة القصة أولًا');
      return;
    }
    if (storyFeeOmr <= 0) {
      setStoryError('لم يحدد الأدمن رسوم نشر القصة بعد');
      return;
    }

    setIsSubmittingStory(true);
    setStoryError('');
    try {
      const response = await fetch('/api/v1/store/stories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: storyImageData, caption: storyCaption }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'تعذر إرسال القصة');
      setStoryImageData('');
      setStoryCaption('');
      if (storyImageInputRef.current) storyImageInputRef.current.value = '';
      await loadStoreStories();
    } catch (error) {
      setStoryError(error instanceof Error ? error.message : 'تعذر الاتصال بالخادم');
    } finally {
      setIsSubmittingStory(false);
    }
  };

  const handleSubmitStoryPayment = async (storyId: string) => {
    setStoryError('');
    try {
      const response = await fetch(`/api/v1/store/stories/${storyId}/payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: paymentReferences[storyId] || '' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'تعذر إرسال مرجع التحويل');
      await loadStoreStories();
    } catch (error) {
      setStoryError(error instanceof Error ? error.message : 'تعذر الاتصال بالخادم');
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;

    const success = onVerifyBookingCode(codeInput.trim());
    if (success) {
      setVerifyMessage({
        type: 'success',
        text: `✓ تم التحقق بنجاح من كود الحجز (${codeInput.toUpperCase()})! سلّم الصندوق للزبون الآن.`,
      });
      setCodeInput('');
    } else {
      setVerifyMessage({
        type: 'error',
        text: `✕ لم يتم العثور على حجز صالح بالكود (${codeInput.toUpperCase()}) أو تم استلامه مسبقاً.`,
      });
    }

    setTimeout(() => {
      setVerifyMessage(null);
    }, 5000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedAlert(true);
    setTimeout(() => {
      setSettingsSavedAlert(false);
    }, 4000);
  };

  const handleStoreLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، الحد الأقصى 3 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setStoreLogoUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // طلبات المتجر من قاعدة البيانات (متجر جديد = بدون طلبات)
  const pendingOrders = storeOrders.filter((o) => o.status === 'pending');
  const completedOrders = storeOrders.filter((o) => o.status === 'collected');

  // الإحصائيات الحقيقية من الخادم (متجر جديد = أصفار)
  const todayPendingCount = storeStats?.todayPendingPickups ?? pendingOrders.length;
  const todayCollectedCount = storeStats?.todayCollectedCount ?? completedOrders.reduce((sum, o) => sum + o.quantity, 0);
  const grossRevenue = storeStats?.weeklyGrossRevenueOmr ?? completedOrders.reduce((sum, o) => sum + o.pricePaidOmr, 0);
  const netStorePayout = storeStats?.netPayoutPendingOmr ?? grossRevenue * 0.85;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 space-y-6 text-right font-['IBM_Plex_Sans_Arabic','IBM_Plex_Sans',sans-serif]" dir="rtl">
      {/* Store Header Banner */}
      <div className="bg-gradient-to-r from-[#131b2e] to-[#1c2a44] text-white p-5 rounded-3xl border border-[#2c3b59] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt="لوجو المتجر" className="w-full h-full object-contain" />
            ) : (
              <span className="material-symbols-outlined text-[34px] text-[#006948]">
                bakery_dining
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">{storeName}</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                شريك موثّق
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1">
              ولاية السيب · شارع مزون التجاري · السجل التجاري: {crNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAddBox}
            className="h-11 px-4 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            <span>إضافة سلة فائضة جديدة</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="h-11 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
              title="الرجوع لبوابة اختيار النظام وتغيير الحساب"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">تبديل البوابة</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => handleSectionChange('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'overview'
              ? 'bg-[#006948] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          <span>لوحة العمليات</span>
        </button>

        <button
          type="button"
          onClick={() => handleSectionChange('baskets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'baskets'
              ? 'bg-[#006948] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          <span>السلال المعروضة ({storeBoxes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSectionChange('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'orders'
              ? 'bg-[#006948] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span>طلبات واستلام اليوم ({pendingOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSectionChange('stories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'stories'
              ? 'bg-[#006948] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          <span>قصص المتجر ({storeStories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSectionChange('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'settings'
              ? 'bg-[#006948] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span>إعدادات المتجر والفرع</span>
        </button>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Code Verification Quick Tool */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#006948]">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              <h2 className="text-sm font-black">تحقق من كود استلام الزبون (Booking Code)</h2>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              يُظهر الزبون كود الاستلام (مثل: DB-4821) عند حضوره للمحل في الخوض. أدخل الكود لتأكيد التسليم فورياً.
            </p>

            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="أدخل كود الاستلام (مثال: DB-4821)"
                  className="w-full h-11 px-4 text-center sm:text-right font-mono font-bold text-base bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>تأكيد التسليم والتسجيل</span>
              </button>
            </form>

            {verifyMessage && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  verifyMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{verifyMessage.text}</span>
              </div>
            )}
          </div>

          {/* Bento Grid: Today's Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <div className="text-[11px] text-stone-500 font-semibold mb-1">صناديق بانتظار الاستلام</div>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {todayPendingCount} <span className="text-xs font-sans text-stone-400">طلب</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-1">قبل إغلاق نافذة الاستلام ({pickupEnd})</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <div className="text-[11px] text-stone-500 font-semibold mb-1">صناديق تم تسليمها اليوم</div>
              <div className="text-2xl font-black text-[#006948] font-mono">
                {todayCollectedCount} <span className="text-xs font-sans text-stone-400">صندوق</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">من إجمالي {storeBoxes.length} سلة معروضة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <div className="text-[11px] text-stone-500 font-semibold mb-1">مبيعات اليوم الإجمالية</div>
              <div className="text-2xl font-black text-[#131b2e] font-mono">
                {grossRevenue.toFixed(3)} <span className="text-xs font-sans text-stone-500">ر.ع</span>
              </div>
              <div className="text-[10px] text-stone-400 mt-1">قبل خصم عمولة المنصة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <div className="text-[11px] text-stone-500 font-semibold mb-1">صافي أرباح المحل الأسبوعية</div>
              <div className="text-2xl font-black text-[#006948] font-mono">
                {netStorePayout.toFixed(3)} <span className="text-xs font-sans text-stone-500">ر.ع</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">تُحوّل أسبوعياً لـ {bankName}</div>
            </div>
          </div>

          {/* Quick Active Baskets preview */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">inventory_2</span>
                <h2 className="text-sm font-black text-[#131b2e]">السلال المعروضة في المتجر حالياً</h2>
              </div>
              <button
                type="button"
                onClick={onOpenAddBox}
                className="text-xs font-bold text-[#006948] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>إضافة سلة جديدة</span>
              </button>
            </div>

            {storeBoxes.length === 0 ? (
              <div className="p-8 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/50 text-center">
                <span className="material-symbols-outlined text-[36px] text-stone-300">inventory_2</span>
                <h3 className="text-sm font-black text-stone-500 mt-2">لا توجد سلال معروضة بعد</h3>
                <p className="text-[11px] text-stone-400 mt-1">ابدأ بإضافة أول سلة فائضة لمتجرك</p>
                <button
                  type="button"
                  onClick={onOpenAddBox}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#006948] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  إضافة أول سلة
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {storeBoxes.slice(0, 4).map((box) => (
                <div
                  key={box.id}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={box.imageUrl}
                      alt={box.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#131b2e]">{box.title}</h4>
                      <div className="text-[11px] font-mono font-bold text-[#006948] mt-0.5">
                        {Number(box.discountedPrice).toFixed(3)} {box.currency}{' '}
                        <span className="line-through text-stone-400 font-normal mr-1">
                          {Number(box.originalPrice).toFixed(3)} {box.currency}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        وقت الاستلام: {box.pickupWindow}
                      </div>
                    </div>
                  </div>

                  {/* Stock controls */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-stone-500 font-medium">الكمية</span>
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateBoxStock(box.id, Math.max(0, box.remainingCount - 1))}
                        className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs">
                        {box.remainingCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateBoxStock(box.id, box.remainingCount + 1)}
                        className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: BASKETS MANAGEMENT */}
      {activeSection === 'baskets' && (
        <div className="space-y-5">
          {/* Header Action Card */}
          <div className="bg-gradient-to-l from-emerald-50 to-white p-5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[#131b2e]">إدارة السلال الفائضة والأسهم المتاحة</h2>
              <p className="text-xs text-stone-500 mt-1">
                يمكنك تحديث كميات السلال فوراً أو إضافة سلة جديدة مع رفع الصور الحقيقية لزيادة ثقة الزبائن.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddBox}
              className="h-11 px-5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              <span>إضافة سلة فائضة جديدة (مع الصور)</span>
            </button>
          </div>

          {storeBoxes.length === 0 ? (
            <div className="p-10 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 text-center">
              <span className="material-symbols-outlined text-[40px] text-stone-300">shopping_basket</span>
              <h3 className="text-sm font-black text-stone-500 mt-3">متجرك جديد — لا توجد سلال بعد</h3>
              <p className="text-[11px] text-stone-400 mt-1">أضف سلالك الفائضة لتظهر للزبائن في التطبيق</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storeBoxes.map((box) => (
              <div
                key={box.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col justify-between gap-3 hover:shadow-xs transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-stone-200">
                    <img
                      src={box.imageUrl}
                      alt={box.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {box.remainingCount > 0 ? 'متاح' : 'نفد'}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-[#131b2e] leading-snug">{box.title}</h3>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-1">{box.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-mono font-black text-[#006948]">
                        {Number(box.discountedPrice).toFixed(3)} {box.currency}
                      </span>
                      <span className="text-[11px] font-mono line-through text-stone-400">
                        {Number(box.originalPrice).toFixed(3)} {box.currency}
                      </span>
                      <span className="bg-emerald-100 text-[#006948] text-[10px] font-bold px-1.5 py-0.5 rounded">
                        خصم {Math.round(((box.originalPrice - box.discountedPrice) / box.originalPrice) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-stone-500">
                    وقت الاستلام: <span className="font-semibold text-stone-700">{box.pickupWindow}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-500 font-medium">الكمية:</span>
                    <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateBoxStock(box.id, Math.max(0, box.remainingCount - 1))}
                        className="w-6 h-6 rounded bg-white hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">
                        {box.remainingCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateBoxStock(box.id, box.remainingCount + 1)}
                        className="w-6 h-6 rounded bg-white hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* SECTION 3: ORDERS */}
      {activeSection === 'orders' && (
        <div className="space-y-5">
          {/* Quick Verification Banner */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#006948]">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              <h2 className="text-sm font-black">تسليم الطلبات عبر كود الحجز</h2>
            </div>
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="أدخل كود استلام الزبون (مثال: DB-4821)"
                className="flex-1 h-11 px-4 text-center sm:text-right font-mono font-bold text-base bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase"
              />
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>تأكيد التسليم</span>
              </button>
            </form>
            {verifyMessage && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  verifyMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{verifyMessage.text}</span>
              </div>
            )}
          </div>

          {/* Orders Table */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">receipt_long</span>
                <h2 className="text-sm font-black text-[#131b2e]">سجل حجوزات وطلبات المتجر</h2>
              </div>
              <span className="text-xs text-stone-400">{storeOrders.length} طلبات مسجلة</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-2.5 font-bold">كود الاستلام</th>
                    <th className="pb-2.5 font-bold">الزبون</th>
                    <th className="pb-2.5 font-bold">السلة</th>
                    <th className="pb-2.5 font-bold">المبلغ (ر.ع)</th>
                    <th className="pb-2.5 font-bold">نافذة الاستلام</th>
                    <th className="pb-2.5 font-bold">الحالة</th>
                    <th className="pb-2.5 font-bold">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {storeOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <span className="material-symbols-outlined text-[32px] text-stone-300">receipt_long</span>
                        <p className="text-xs font-bold text-stone-400 mt-2">لا توجد طلبات بعد — متجرك جديد</p>
                      </td>
                    </tr>
                  ) : (
                    storeOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/50">
                      <td className="py-3 font-mono font-black text-emerald-800">
                        {ord.bookingCode || 'DB-7392'}
                      </td>
                      <td className="py-3">{ord.clientName || 'زبون DealBox'}</td>
                      <td className="py-3">{ord.boxTitle}</td>
                      <td className="py-3 font-mono font-bold">
                        {Number(ord.pricePaidOmr).toFixed(3)} ر.ع
                      </td>
                      <td className="py-3 text-stone-500">{ord.pickupWindow}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'collected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status === 'collected' ? 'تم الاستلام ✓' : 'معلق الاستلام'}
                        </span>
                      </td>
                      <td className="py-3">
                        {ord.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => {
                              onVerifyBookingCode(ord.bookingCode);
                              setVerifyMessage({
                                type: 'success',
                                text: `✓ تم تأكيد تسليم كود ${ord.bookingCode} بنجاح!`,
                              });
                            }}
                            className="px-2.5 py-1 bg-[#006948] hover:bg-[#00855d] text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                          >
                            تسليم الطلب
                          </button>
                        ) : (
                          <span className="text-stone-400 text-[11px]">مكتمل</span>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'stories' && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="mb-4">
              <h2 className="text-base font-black text-[#131b2e]">إعلان قصة مدفوعة</h2>
              <p className="mt-1 text-sm text-stone-600">
                الرسوم الحالية <bdi dir="ltr" className="font-mono font-bold text-[#006948]">{storyFeeOmr.toFixed(3)} ر.ع</bdi>
                {' '}<span className="rounded-full bg-[#f2f3ff] px-2 py-0.5 text-xs font-bold text-[#006948]">
                  {storyFeePeriod === 'daily' ? 'يومي' : storyFeePeriod === 'weekly' ? 'أسبوعي' : 'شهري'}
                </span>{' '}
                لكل قصة. لا تظهر للعملاء قبل إرسال التحويل واعتماد الأدمن.
              </p>
            </div>

            <form onSubmit={handleSubmitStory} className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
              <div className="space-y-2">
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 bg-stone-50">
                  {storyImageData ? (
                    <img src={storyImageData} alt="معاينة القصة" className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-stone-400">add_photo_alternate</span>
                  )}
                </div>
                <input
                  ref={storyImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleStoryImageSelect(event.target.files?.[0])}
                  className="hidden"
                />
                <button type="button" onClick={() => storyImageInputRef.current?.click()} className="h-10 w-full rounded-lg border border-stone-300 text-sm font-bold text-[#006948] hover:bg-emerald-50">
                  اختيار صورة للقصة
                </button>
                <p className="text-center text-[11px] text-stone-500">PNG أو JPG أو WebP، حد أقصى 3 ميجابايت</p>
              </div>

              <div className="flex flex-col gap-3">
                <label className="space-y-1 text-sm font-bold text-stone-700">
                  <span>وصف قصير (اختياري)</span>
                  <textarea
                    rows={3}
                    maxLength={180}
                    value={storyCaption}
                    onChange={(event) => setStoryCaption(event.target.value)}
                    placeholder="أبرز حقائب المتجر المتاحة اليوم"
                    className="w-full rounded-lg border border-stone-300 bg-stone-50 p-3 font-normal outline-none focus:border-[#006948]"
                  />
                </label>
                <button type="submit" disabled={isSubmittingStory || storyFeeOmr <= 0} className="h-11 rounded-lg bg-[#006948] px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmittingStory ? 'جارٍ إرسال القصة...' : 'إرسال للمراجعة وطلب التحويل'}
                </button>
                {storyFeeOmr <= 0 && <p className="text-xs text-amber-800">لم يحدد الأدمن رسوم القصة بعد.</p>}
              </div>
            </form>
            {storyError && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{storyError}</p>}
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-[#131b2e]">قصصي وطلبات الدفع</h3>
            {storeStories.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">لم ترفع أي قصة بعد.</p>
            ) : storeStories.map((story) => (
              <article key={story.id} className="grid grid-cols-1 gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                <img src={story.imageData} alt="صورة قصة المتجر" className="h-24 w-full rounded-lg object-cover sm:w-24" />
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#131b2e]">{story.caption || 'قصة المتجر'}</span>
                    <span className="rounded-full bg-[#f2f3ff] px-2.5 py-1 text-xs font-bold text-[#006948]">
                      {story.reviewStatus === 'pending_payment' ? 'بانتظار التحويل'
                        : story.reviewStatus === 'pending_review' ? 'بانتظار اعتماد الأدمن'
                          : story.reviewStatus === 'approved' ? 'منشورة'
                            : 'مرفوضة'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">الرسوم: <bdi dir="ltr" className="font-mono">{story.feeOmr.toFixed(3)} ر.ع</bdi></p>
                  {story.rejectionReason && <p className="text-xs text-red-700">سبب الرفض: {story.rejectionReason}</p>}
                  {(story.reviewStatus === 'pending_payment' || story.reviewStatus === 'rejected') && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={paymentReferences[story.id] || ''}
                        onChange={(event) => setPaymentReferences((previous) => ({ ...previous, [story.id]: event.target.value }))}
                        placeholder="مرجع التحويل البنكي"
                        className="h-10 min-w-0 flex-1 rounded-lg border border-stone-300 px-3 text-sm"
                      />
                      <button type="button" onClick={() => void handleSubmitStoryPayment(story.id)} className="h-10 rounded-lg bg-[#131b2e] px-4 text-sm font-bold text-white">
                        أرسلت التحويل
                      </button>
                    </div>
                  )}
                  {story.reviewStatus === 'pending_review' && <p className="text-xs font-semibold text-amber-800">سيتم نشر القصة بعد تأكيد الأدمن استلام الرسوم.</p>}
                  {story.reviewStatus === 'approved' && story.expiresAt && <p className="text-xs text-emerald-800">تنتهي في {new Date(story.expiresAt).toLocaleString('ar-OM')}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: SETTINGS (إعدادات المتجر والفرع والتسويات) */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          {/* Banner with Add Basket shortcut */}
          <div className="bg-gradient-to-r from-emerald-950 to-[#131b2e] text-white p-5 rounded-2xl border border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                <span>إعدادات الفرع وسلال الفائض اليومية</span>
              </div>
              <h2 className="text-lg font-black text-white">
                تخصيص بيانات {storeName}
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                تتيح لك هذه الصفحة إدارة هوية المتجر، نافذة الاستلام، وبيانات التسوية البنكية في سلطنة عُمان.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenAddBox}
              className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              <span>إضافة سلة فائضة جديدة (رفع الصور)</span>
            </button>
          </div>

          {settingsSavedAlert && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#006948]">check_circle</span>
              <span>تم حفظ وتحديث إعدادات المتجر والفرع بنجاح!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Card 1: Store Identity & Logo */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">badge</span>
                <h3 className="text-sm font-black text-[#131b2e]">هوية المنشأة والشعار</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                {/* Logo Preview and Upload */}
                <div className="sm:col-span-1 flex flex-col items-center gap-2 text-center">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center overflow-hidden relative group">
                    {storeLogoUrl ? (
                      <img src={storeLogoUrl} alt="شعار المتجر" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="material-symbols-outlined text-[42px] text-stone-400">
                        store
                      </span>
                    )}
                  </div>
                  <input
                    ref={storeLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleStoreLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => storeLogoInputRef.current?.click()}
                    className="text-[11px] font-bold text-[#006948] hover:underline cursor-pointer"
                  >
                    {storeLogoUrl ? 'تغيير لوجو المتجر' : 'رفع لوجو المتجر'}
                  </button>
                </div>

                <div className="sm:col-span-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        اسم المنشأة والفرع *
                      </label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full h-10 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        رقم السجل التجاري في عُمان (CR Number) *
                      </label>
                      <input
                        type="text"
                        required
                        value={crNumber}
                        onChange={(e) => setCrNumber(e.target.value)}
                        className="w-full h-10 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        رقم الهاتف / الواتساب للتواصل
                      </label>
                      <input
                        type="text"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        className="w-full h-10 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        عنوان الفرع الجغرافي
                      </label>
                      <input
                        type="text"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        className="w-full h-10 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Pickup Windows & Operational Hours */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">schedule</span>
                <h3 className="text-sm font-black text-[#131b2e]">نافذة الاستلام الافتراضية للسلال</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    وقت بدء استلام سلال الفائض (مساءً)
                  </label>
                  <input
                    type="time"
                    value={pickupStart}
                    onChange={(e) => setPickupStart(e.target.value)}
                    className="w-full h-10 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    عادة ما يكون بعد فرز بقايا المخبوزات والوجبات المسائية.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    وقت انتهاء استلام السلال وإغلاق المحل
                  </label>
                  <input
                    type="time"
                    value={pickupEnd}
                    onChange={(e) => setPickupEnd(e.target.value)}
                    className="w-full h-10 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    قبل موعد إغلاق المحل الرسمي بـ 30 دقيقة لضمان التسليم.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Bank Account for Weekly Settlements */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#006948]">account_balance</span>
                  <h3 className="text-sm font-black text-[#131b2e]">حساب التسوية المصرفية الأسبوعية</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  تحويل آلي كل ثلاثاء
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    البنك المستفيد *
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full h-10 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  >
                    <option value="بنك مسقط - فرع الخوض">بنك مسقط (Bank Muscat)</option>
                    <option value="بنك ظفار">بنك ظفار (Bank Dhofar)</option>
                    <option value="البنك الوطني العماني">البنك الوطني العماني (NBO)</option>
                    <option value="بنك نزوى">بنك نزوى الإسلامي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    رقم الآيبان البنكي (IBAN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="w-full h-10 px-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Notification preferences */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#131b2e]">تنبيهات فورية عند قيام زبون بحجز سلة</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  استلام رسالة واتساب وإشعار صوتي فوري عند تأكيد دفع الزبون لحجز الصندوق.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoNotifyWhatsApp}
                  onChange={(e) => setAutoNotifyWhatsApp(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006948]"></div>
              </label>
            </div>

            {/* Submit / Save Button */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onOpenAddBox}
                className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                <span>إضافة سلة فائضة الآن (مع رفع الصور)</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>حفظ إعدادات المتجر</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
