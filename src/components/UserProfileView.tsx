import React, { useEffect, useState } from 'react';
import { readClientSession } from '../data/clientSession';
import { getWebPushStatus, isWebPushSupported, enableWebPush, disableWebPush } from '../data/webPush';

interface UserProfileViewProps {
  totalBoxesSaved: number;
  totalMoneySaved: number;
  currency: string;
  onOpenAddStore: () => void;
  /** اسم العميل المسجل دخوله من حساب `dealbox_user_v1` */
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userPicture?: string;
  /** إخراج العميل من التطبيق: يمسح الجلسة ويعود لشاشة تسجيل الدخول */
  onLogout?: () => void;
  /** تحديث الملف الشخصي محلياً بعد الحفظ على الخادم */
  onProfileUpdate?: (user: { name?: string; email?: string; phone?: string; picture?: string }) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  totalBoxesSaved,
  totalMoneySaved,
  currency,
  onOpenAddStore,
  userName,
  userEmail,
  userPhone,
  userPicture,
  onLogout,
  onProfileUpdate,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => getWebPushStatus() === 'granted');
  const [pushBusy, setPushBusy] = useState(false);
  const pushSupported = isWebPushSupported();
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportStatus, setSupportStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [loyalty, setLoyalty] = useState<{
    purchases: number;
    threshold: number;
    remaining: number;
    loyaltyDiscountPercent: number;
    eligible: boolean;
  } | null>(null);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [confirmedOrders, setConfirmedOrders] = useState<number>(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPicture, setEditPicture] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    let active = true;
    const token = readClientSession()?.token;
    if (!token) return;
    fetch('/api/v1/client/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((result) => {
        if (active && result?.success) {
          setOrdersCount(result.count ?? 0);
          const collected = (result.orders || []).filter((o: any) => o.status === 'collected' || o.status === 'مكتمل').length;
          setConfirmedOrders(collected);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const token = readClientSession()?.token;
    if (!token) return;
    fetch('/api/v1/client/loyalty', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((result) => { if (active && result?.success) setLoyalty(result); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const kgSaved = (totalBoxesSaved * 1.4).toFixed(1);

  const displayName = userName?.trim() || 'المستخدم المعتمد';
  const contactLine = [userEmail, userPhone].filter(Boolean).join(' · ');

  const saveProfile = async () => {
    if (savingProfile) return;
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const token = readClientSession()?.token || '';
      const response = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          ...(editPicture ? { picture: editPicture } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر الحفظ');

      // حدّث الجلسة المحلية والمحلية الصلبة
      try {
        localStorage.setItem('dealbox_user_v1', JSON.stringify(result.user));
      } catch {/* ignore */}
      onProfileUpdate?.(result.user);

      setProfileMsg('تم حفظ التغييرات بنجاح');
      setTimeout(() => { setEditOpen(false); setProfileMsg(''); }, 1200);
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setSavingProfile(false);
    }
  };

  const openEdit = () => {
    setEditName(userName || '');
    setEditEmail(userEmail || '');
    setEditPhone(userPhone || '');
    setEditPicture(userPicture || null);
    setProfileMsg('');
    setEditOpen(true);
  };

  const handlePictureFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && setEditPicture(reader.result);
    reader.readAsDataURL(file);
  };

  const togglePushNotifications = async (next: boolean) => {
    if (!pushSupported || pushBusy) return;
    setPushBusy(true);
    try {
      if (next) {
        const status = await enableWebPush();
        setNotificationsEnabled(status === 'granted');
      } else {
        await disableWebPush();
        setNotificationsEnabled(false);
      }
    } finally {
      setPushBusy(false);
    }
  };

  const sendSupportMessage = async () => {
    if (!supportMessage.trim() || supportSending) return;
    setSupportSending(true);
    setSupportStatus('idle');
    try {
      const token = readClientSession()?.token || '';
      const response = await fetch('/api/v1/client/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: supportMessage.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'تعذر الإرسال');
      setSupportStatus('ok');
      setSupportMessage('');
      setTimeout(() => {
        setShowSupport(false);
        setSupportStatus('idle');
      }, 1800);
    } catch {
      setSupportStatus('error');
    } finally {
      setSupportSending(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-4 border border-[#bccac0]/30 shadow-xs">
        <div className="flex w-full min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={openEdit}
            title="تعديل الصورة / الاسم / البريد / الجوال"
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#006948]/30 bg-[#f2f3ff] text-xl font-bold text-[#006948]"
          >
            {userPicture ? (
              <img src={userPicture} alt="صورة المستخدم" className="h-full w-full object-cover" />
            ) : (
              '👤'
            )}
          </button>
          <div className="min-w-0 flex-1 text-right">
            <h3 className="break-words font-bold text-base leading-6 text-[#131b2e]">
              {displayName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
              <span className="inline-flex max-w-full whitespace-normal break-words rounded-md border border-[#006948]/20 bg-[#f5fff6] px-2 py-0.5 text-[11px] font-medium leading-5 text-[#006948]">
                عضو مبادرة حفظ النعمة 🌿
              </span>
              {contactLine && (
                <span dir="auto" className="max-w-full truncate text-[11px] leading-5 text-stone-500">
                  {contactLine}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={openEdit}
            aria-label="تعديل الملف الشخصي"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2f3ff] text-[#006948] hover:bg-[#e2e7ff]"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-bold text-red-600 transition-colors hover:bg-red-100 active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>تسجيل الخروج من التطبيق</span>
          </button>
        )}
      </div>

      {/* Impact Stats Bento */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-[#bccac0]/30">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#006948] mb-1">
            <span className="material-symbols-outlined text-[16px]">eco</span>
            <span>طعام تم إنقاذه</span>
          </div>
          <div className="text-[20px] font-black text-[#131b2e] font-mono">
            {kgSaved} <span className="text-[11px] font-normal font-sans text-stone-500">كجم</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#bccac0]/30">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#855300] mb-1">
            <span className="material-symbols-outlined text-[16px]">savings</span>
            <span>إجمالي التوفير</span>
          </div>
          <div className="text-[20px] font-black text-[#855300] font-mono">
            {totalMoneySaved.toFixed(3)} <span className="text-[11px] font-normal font-sans text-stone-500">{currency}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#bccac0]/30">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#855300] mb-1">
            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
            <span>طلبات مؤكَّدة</span>
          </div>
          <div className="text-[20px] font-black text-[#131b2e] font-mono">
            {confirmedOrders} <span className="text-[11px] font-normal font-sans text-stone-500">{ordersCount !== null && ordersCount !== confirmedOrders ? `من ${ordersCount} طلب` : ''}</span>
          </div>
        </div>
      </div>

      {/* Partner Store Invitation */}
      <div className="bg-gradient-to-r from-[#006948] to-[#00855d] text-white p-4 rounded-2xl shadow-xs flex items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-[14px] text-white mb-0.5">
            هل تمتلك متجراً أو مخبزاً؟
          </h4>
          <p className="text-[11px] text-[#f5fff6] max-w-[210px] leading-relaxed">
            انضم لمنصة DealBox واعرض فائض طعامك للمستهلكين بدلاً من هدره.
          </p>
        </div>
        <button
          onClick={onOpenAddStore}
          className="px-3 py-2 rounded-xl bg-white text-[#006948] text-[11px] font-bold shrink-0 hover:bg-[#f2f3ff] transition-colors shadow-xs"
        >
          + تسجيل متجر
        </button>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-2xl border border-[#bccac0]/30 overflow-hidden divide-y divide-[#eaedff]">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">
              notifications_active
            </span>
            <span className="text-[13px] font-medium text-[#131b2e]">
              تنبيهات الصناديق الطازجة القريبة
            </span>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            disabled={!pushSupported || pushBusy}
            onChange={(e) => { void togglePushNotifications(e.target.checked); }}
            className="w-4 h-4 accent-[#006948] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">
              verified
            </span>
            <span className="text-[13px] font-medium text-[#131b2e]">
              معايير سلامة الغذاء والاستلام
            </span>
          </div>
          <span className="text-[11px] text-[#006948] font-bold">معتمد 100%</span>
        </div>

        <button
          type="button"
          onClick={() => setShowSupport(true)}
          className="w-full p-3.5 flex items-center justify-between text-right transition-colors hover:bg-[#f2f3ff]"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">
              support_agent
            </span>
            <span className="text-[13px] font-medium text-[#131b2e]">
              الدعم الفني ومساعدة المستفيدين
            </span>
          </div>
          <span className="text-[11px] text-stone-400">24/7</span>
        </button>

        {loyalty && (
          <div className="m-0 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006948] text-[18px]">workspace_premium</span>
              <span className="text-[13px] font-black text-[#006948]">
                {loyalty.eligible ? `مبروك! خصم ولاء ${loyalty.loyaltyDiscountPercent}% فعّال` : 'مكافآت التميز'}
              </span>
            </div>

            <div className="mb-2 flex items-end gap-2">
              <span className="text-[22px] font-black text-[#131b2e] font-mono leading-none">{loyalty.purchases}</span>
              <span className="text-[11px] text-stone-500 mb-0.5">طلب مؤكّد الاستلام{ordersCount !== null ? ` · من إجمالي ${ordersCount}` : ''}</span>
            </div>

            <div className="mb-2 h-2 w-full rounded-full bg-[#e2e7ff] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#006948] transition-all duration-500"
                style={{ width: `${Math.min(100, (loyalty.purchases / loyalty.threshold) * 100)}%` }}
              />
            </div>

            <p className="text-[11px] leading-5 text-stone-600">
              {loyalty.eligible
                ? `أكملتِ ${loyalty.purchases} عمليات استلام مؤكدة — فعّل خصمك ${loyalty.loyaltyDiscountPercent}% على الطلبات القادمة.`
                : `تم تأكيد استلامك لـ ${loyalty.purchases} من أصل ${loyalty.threshold} طلباً — باقٍ ${loyalty.remaining} للحصول على خصم ${loyalty.loyaltyDiscountPercent}%.`}
            </p>

            {!loyalty.eligible && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#006948] border border-[#006948]/20">
                <span className="material-symbols-outlined text-[14px]">local_offer</span>
                بعد {loyalty.threshold} طلب خصم {loyalty.loyaltyDiscountPercent}% إضافي
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {showSupport && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setShowSupport(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#131b2e]">الدعم الفني ومساعدة المستفيدين</h3>
              <button
                type="button"
                onClick={() => setShowSupport(false)}
                aria-label="إغلاق"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="mb-3 text-xs leading-6 text-stone-500">
              اكتب مشكلتك أو استفسارك وسيصل فريق الدعم رسالتك مباشرة.
            </p>

            <textarea
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="مثال: واجهت مشكلة في استلام الطلب…"
              className="w-full rounded-xl border border-stone-200 bg-[#faf8ff] p-3 text-sm leading-6 text-[#131b2e] outline-none focus:border-[#006948]"
            />

            {supportStatus === 'ok' && (
              <p className="mt-2 text-sm font-bold text-[#006948]">تم إرسال رسالتك بنجاح ✅</p>
            )}
            {supportStatus === 'error' && (
              <p className="mt-2 text-sm font-bold text-red-600">تعذر إرسال رسالتك، حاول مجدداً</p>
            )}

            <button
              type="button"
              onClick={sendSupportMessage}
              disabled={supportSending || !supportMessage.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#006948] px-4 py-3 text-sm font-black text-white transition hover:bg-[#005d3f] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              {supportSending ? 'جارٍ الإرسال…' : 'إرسال للدعم'}
            </button>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setEditOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#131b2e]">تعديل الملف الشخصي</h3>
              <button type="button" onClick={() => setEditOpen(false)} aria-label="إغلاق" className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="mb-4 flex flex-col items-center gap-2">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#006948]/30 bg-[#f2f3ff] text-2xl">
                {editPicture ? <img src={editPicture} alt="صورة" className="h-full w-full object-cover" /> : '👤'}
              </div>
              <label className="cursor-pointer rounded-lg bg-[#f2f3ff] px-3 py-1.5 text-xs font-bold text-[#006948]">
                رفع صورة المستخدم
                <input type="file" accept="image/*" onChange={handlePictureFile} className="hidden" />
              </label>
            </div>

            <label className="mb-3 block text-sm font-bold text-stone-700">
              الاسم
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-stone-200 bg-[#faf8ff] px-3 text-sm outline-none focus:border-[#006948]" />
            </label>
            <label className="mb-3 block text-sm font-bold text-stone-700">
              البريد الإلكتروني
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-stone-200 bg-[#faf8ff] px-3 text-sm outline-none focus:border-[#006948]" />
            </label>
            <label className="mb-3 block text-sm font-bold text-stone-700">
              رقم الهاتف
              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} dir="ltr" className="mt-1 h-11 w-full rounded-lg border border-stone-200 bg-[#faf8ff] px-3 text-sm outline-none focus:border-[#006948]" />
            </label>

            {profileMsg && (
              <p className={`mb-2 text-sm font-bold ${profileMsg.includes('نجاح') ? 'text-[#006948]' : 'text-red-600'}`}>{profileMsg}</p>
            )}

            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006948] px-4 py-3 text-sm font-black text-white hover:bg-[#005d3f] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {savingProfile ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
