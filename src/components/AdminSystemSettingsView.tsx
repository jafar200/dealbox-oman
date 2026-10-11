import React, { useEffect, useState, useRef } from 'react';
import { loadStoredValue, saveStoredValue } from '../logoStorage';
import type { TeamMember, AdminRole, AdminPermission } from '../types';
import { AdminMarketingEditor } from './AdminMarketingEditor';
import {
  ADMIN_ROLE_KEYS,
  ADMIN_ROLE_CATALOG,
  ADMIN_PERMISSION_LABELS,
  formatLastActive,
} from '../adminRoles';

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

interface AdminSystemSettingsViewProps {
  onNotify?: (msg: string) => void;
  onBackToOverview?: () => void;
  projectLogo?: string | null;
  onUpdateLogo?: (logoUrl: string | null) => Promise<boolean>;
  introSlides?: IntroSlideConfig[];
  onUpdateIntroSlides?: (slides: IntroSlideConfig[]) => void;
  googleAuthConfig?: GoogleAuthConfig;
  onUpdateGoogleAuthConfig?: (config: GoogleAuthConfig) => void;
  authToken?: string;
  // جلسة الأدمن الحالية: دورها داخل لوحة الآدمن (يحدد من يمكنه إدارة الفريق)
  sessionUser?: { adminRole?: string; permissions?: string[] };
}

interface PersistedSystemSettings {
  platformName: string;
  currencySymbol: string;
  currencyDecimals: number;
  defaultRegion: string;
  supportPhone: string;
  emergencyHotline: string;
  isMaintenanceMode: boolean;
  systemLanguage: string;
  commissionRate: number;
  vatRate: number;
  minPayoutAmount: number;
  payoutSchedule: 'weekly' | 'biweekly' | 'monthly';
  centralIban: string;
  centralBankName: string;
  maxHoldTimeMinutes: number;
  maxDailyBasketsPerUser: number;
  autoRelistCancelled: boolean;
  eveningWindowStart: string;
  eveningWindowEnd: string;
  requireBookingCodeScan: boolean;
  smsGateway: string;
  sendSmsOnBooking: boolean;
  whatsappNotifications: boolean;
  googleMapsKeyConfigured: boolean;
}

// Preset brand icons for instant preview
const PRESET_LOGOS = [
  {
    id: 'preset-basket',
    label: 'سلة إنقاذ الغذاء الخضراء (Green Basket)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="%23006948"/><path d="M34 50h52l-6 38H40L34 50z" fill="%23ffffff"/><path d="M48 50c0-10 5-18 12-18s12 8 12 18" stroke="%23ffffff" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M60 56v20M50 64l10 8 10-8" stroke="%23006948" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="82" cy="38" r="6" fill="%23fea619"/></svg>',
  },
  {
    id: 'preset-monogram',
    label: 'رمزية DB الرسمية (Modern Monogram)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="%23006948"/><text x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="44" fill="%23ffffff">DB</text><circle cx="88" cy="32" r="7" fill="%23fea619"/></svg>',
  },
  {
    id: 'preset-sprout',
    label: 'شتلة الاستدامة والنماء (Oman Eco Leaf)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="%23131b2e"/><circle cx="60" cy="60" r="38" fill="%23006948"/><path d="M60 80V46c0-12 16-15 16-15s1 12-7 18-9 8-9 8z" fill="%2371d8ad"/><path d="M60 62c-9-8-14-16-14-16s12-1 16 7" fill="%2332b582"/></svg>',
  },
];

export const AdminSystemSettingsView: React.FC<AdminSystemSettingsViewProps> = ({
  onNotify,
  onBackToOverview,
  projectLogo,
  onUpdateLogo,
  introSlides,
  onUpdateIntroSlides,
  googleAuthConfig,
  onUpdateGoogleAuthConfig,
  authToken = '',
  sessionUser,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'general' | 'financial' | 'operations' | 'team' | 'integrations' | 'marketing'
  >('general');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // إعدادات استعادة كلمة المرور («نسيت كلمة المرور») — تُقرأ من الخادم
  const [passwordResetEnabled, setPasswordResetEnabled] = useState(true);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [mailFrom, setMailFrom] = useState('');
  const [isSavingResetSettings, setIsSavingResetSettings] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    let isActive = true;
    fetch('/api/v1/admin/password-reset-settings', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const result = await response.json();
        if (!isActive || !response.ok || !result.success) return;
        setPasswordResetEnabled(result.passwordResetEnabled !== false);
        setSmtpConfigured(Boolean(result.smtpConfigured));
        setMailFrom(result.mailFrom || '');
      })
      .catch(() => {
        // إعدادات القراءة اختيارية — تبقى القيم الافتراضية عند فشل الاتصال
      });
    return () => {
      isActive = false;
    };
  }, [authToken]);

  const handleTogglePasswordReset = async () => {
    if (!authToken) {
      if (onNotify) onNotify('لا يوجد توكن أدمن لحفظ الإعداد — أعد تسجيل الدخول');
      return;
    }
    const next = !passwordResetEnabled;
    setIsSavingResetSettings(true);
    try {
      const response = await fetch('/api/v1/admin/password-reset-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ passwordResetEnabled: next }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'تعذر حفظ الإعداد');
      }
      setPasswordResetEnabled(result.passwordResetEnabled !== false);
      setSmtpConfigured(Boolean(result.smtpConfigured));
      setMailFrom(result.mailFrom || '');
      if (onNotify) {
        onNotify(next
          ? 'تم تفعيل خاصية «نسيت كلمة المرور» لجميع الحسابات ✅'
          : 'تم إيقاف خاصية «نسيت كلمة المرور» — لن يستطيع أحد طلب رابط استعادة');
      }
    } catch (error) {
      if (onNotify) onNotify(error instanceof Error ? error.message : 'تعذر حفظ إعداد استعادة كلمة المرور');
    } finally {
      setIsSavingResetSettings(false);
    }
  };

  // Logo Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(() => {
    if (projectLogo !== undefined) return projectLogo;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dealbox_project_logo_v1');
    }
    return null;
  });

  useEffect(() => {
    if (projectLogo !== undefined) setCurrentLogo(projectLogo);
  }, [projectLogo]);

  const [introSlideSettings, setIntroSlideSettings] = useState<IntroSlideConfig[]>(() => {
    if (introSlides && introSlides.length) return introSlides;
    return [
      {
        id: 'intro-1',
        title: 'أهلاً بك في Dealbox! 🎁',
        description: 'وفّر أكثر واستمتع بوجباتك المفضلة!',
        badge: 'الخيار الذكي لمجتمعنا',
        highlight: 'وفر حتى 70%',
        tag: 'وجبات طازجة',
        icon: '✨',
        enabled: true,
      },
      {
        id: 'intro-2',
        title: 'تسوق بذكاء وابدأ فرق التغيير 🌱',
        description: 'اختر أفضل الصناديق المتاحة بالقرب منك.',
        badge: 'حفظ الطعام، وفر المال',
        highlight: 'خصم فوري',
        tag: 'توصيل ذكي',
        icon: '🌿',
        enabled: true,
      },
      {
        id: 'intro-3',
        title: 'احجز وادفع فقط عند الاستلام ✅',
        description: 'تجربة سريعة ومريحة في كل خطوة.',
        badge: 'استلام سهل وآمن',
        highlight: 'استلام موثوق',
        tag: 'تجربة مريحة',
        icon: '🛍️',
        enabled: true,
      },
    ];
  });

  const [googleAuthEnabled, setGoogleAuthEnabled] = useState<boolean>(googleAuthConfig?.enabled ?? true);
  const [googleClientId, setGoogleClientId] = useState<string>(googleAuthConfig?.clientId ?? '');

  const handleProcessLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (onNotify) onNotify('خطأ: يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      if (onNotify) onNotify('تنبيه: حجم الصورة كبير جداً، الحد الأقصى المسموح 3 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (result) {
        const saved = onUpdateLogo ? await onUpdateLogo(result) : true;
        if (saved) {
          setCurrentLogo(result);
          if (onNotify) onNotify('تم رفع وحفظ شعار المشروع بنجاح! 🎨');
        } else if (onNotify) {
          onNotify('تعذر حفظ الشعار. تحقق من مساحة التخزين في المتصفح ثم أعد المحاولة.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleSelectPresetLogo = async (presetUrl: string, presetLabel: string) => {
    const saved = onUpdateLogo ? await onUpdateLogo(presetUrl) : true;
    if (saved) {
      setCurrentLogo(presetUrl);
      if (onNotify) onNotify(`تم حفظ الشعار: ${presetLabel}`);
    } else if (onNotify) {
      onNotify('تعذر حفظ الشعار. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleResetLogo = async () => {
    const saved = onUpdateLogo ? await onUpdateLogo(null) : true;
    if (saved) {
      setCurrentLogo(null);
      if (onNotify) onNotify('تمت استعادة الشعار الافتراضي للمنظومة');
    } else if (onNotify) {
      onNotify('تعذر تحديث الشعار. يرجى المحاولة مرة أخرى.');
    }
  };

  // General Settings State
  const [platformName, setPlatformName] = useState('DealBox عُمان - منصة إنقاذ الغذاء');
  const [currencySymbol, setCurrencySymbol] = useState('ر.ع (OMR)');
  const [currencyDecimals, setCurrencyDecimals] = useState(3);
  const [defaultRegion, setDefaultRegion] = useState('محافظة مسقط - ولاية السيب');
  const [supportPhone, setSupportPhone] = useState('+968 2454 0000');
  const [emergencyHotline, setEmergencyHotline] = useState('+968 8007 0000');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [systemLanguage, setSystemLanguage] = useState('ar-OM');

  // Financial Settings State
  const [commissionRate, setCommissionRate] = useState(15);
  const [vatRate, setVatRate] = useState(0); // Food rescue often exempt
  const [minPayoutAmount, setMinPayoutAmount] = useState(10.0);
  const [payoutSchedule, setPayoutSchedule] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [centralIban, setCentralIban] = useState('OM48BMUS01234567890123');
  const [centralBankName, setCentralBankName] = useState('بنك مسقط (Bank Muscat)');

  // Operations & Reservation Rules
  const [maxHoldTimeMinutes, setMaxHoldTimeMinutes] = useState(45);
  const [maxDailyBasketsPerUser, setMaxDailyBasketsPerUser] = useState(3);
  const [autoRelistCancelled, setAutoRelistCancelled] = useState(true);
  const [eveningWindowStart, setEveningWindowStart] = useState('20:00');
  const [eveningWindowEnd, setEveningWindowEnd] = useState('22:00');
  const [requireBookingCodeScan, setRequireBookingCodeScan] = useState(true);

  // Integrations & SMS
  const [smsGateway, setSmsGateway] = useState('omantel_ooredoo');
  const [sendSmsOnBooking, setSendSmsOnBooking] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [googleMapsKeyConfigured, setGoogleMapsKeyConfigured] = useState(true);

  // فريق المشرفين والصلاحيات الميدانية (RBAC) — بيانات حقيقية من الخادم
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [changingAdminId, setChangingAdminId] = useState<string | null>(null);

  // من يمكنه إدارة الفريق: مدير عام للنظام فقط (يُضبط في الخادم أيضاً)
  const isSuperAdmin = (sessionUser?.adminRole || 'super_admin') === 'super_admin';

  // Modal: Add Admin User
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('+968 ');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('supervisor');

  // تحميل فريق المشرفين الحقيقي (حسابات فعلية لها حق الدخول للوحة الآدمن)
  useEffect(() => {
    if (!authToken) {
      setTeamMembers([]);
      setIsTeamLoading(false);
      return;
    }
    let isActive = true;
    setIsTeamLoading(true);
    setTeamError('');
    fetch('/api/v1/admin/team', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const result = await response.json();
        if (!isActive) return;
        if (!response.ok || !result.success) throw new Error(result.message || 'تعذر تحميل فريق المشرفين');
        setTeamMembers(result.members || []);
      })
      .catch((error) => {
        if (isActive) setTeamError(error instanceof Error ? error.message : 'تعذر تحميل فريق المشرفين');
      })
      .finally(() => {
        if (isActive) setIsTeamLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [authToken]);

  useEffect(() => {
    let isActive = true;
    loadStoredValue<PersistedSystemSettings>('admin-system-settings')
      .then((settings) => {
        if (!settings || !isActive) return;
        setPlatformName(settings.platformName);
        setCurrencySymbol(settings.currencySymbol);
        setCurrencyDecimals(settings.currencyDecimals);
        setDefaultRegion(settings.defaultRegion);
        setSupportPhone(settings.supportPhone);
        setEmergencyHotline(settings.emergencyHotline);
        setIsMaintenanceMode(settings.isMaintenanceMode);
        setSystemLanguage(settings.systemLanguage);
        setCommissionRate(settings.commissionRate);
        setVatRate(settings.vatRate);
        setMinPayoutAmount(settings.minPayoutAmount);
        setPayoutSchedule(settings.payoutSchedule);
        setCentralIban(settings.centralIban);
        setCentralBankName(settings.centralBankName);
        setMaxHoldTimeMinutes(settings.maxHoldTimeMinutes);
        setMaxDailyBasketsPerUser(settings.maxDailyBasketsPerUser);
        setAutoRelistCancelled(settings.autoRelistCancelled);
        setEveningWindowStart(settings.eveningWindowStart);
        setEveningWindowEnd(settings.eveningWindowEnd);
        setRequireBookingCodeScan(settings.requireBookingCodeScan);
        setSmsGateway(settings.smsGateway);
        setSendSmsOnBooking(settings.sendSmsOnBooking);
        setWhatsappNotifications(settings.whatsappNotifications);
        setGoogleMapsKeyConfigured(settings.googleMapsKeyConfigured);
      })
      .catch((error) => console.error('Unable to load admin system settings:', error));
    return () => {
      isActive = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    if (isSavingSettings) return;
    setIsSavingSettings(true);
    try {
      await saveStoredValue<PersistedSystemSettings>('admin-system-settings', {
        platformName,
        currencySymbol,
        currencyDecimals,
        defaultRegion,
        supportPhone,
        emergencyHotline,
        isMaintenanceMode,
        systemLanguage,
        commissionRate,
        vatRate,
        minPayoutAmount,
        payoutSchedule,
        centralIban,
        centralBankName,
        maxHoldTimeMinutes,
        maxDailyBasketsPerUser,
        autoRelistCancelled,
        eveningWindowStart,
        eveningWindowEnd,
        requireBookingCodeScan,
        smsGateway,
        sendSmsOnBooking,
        whatsappNotifications,
        googleMapsKeyConfigured,
      });
      if (onUpdateIntroSlides) onUpdateIntroSlides(introSlideSettings);
      if (onUpdateGoogleAuthConfig) onUpdateGoogleAuthConfig({ enabled: googleAuthEnabled, clientId: googleClientId });
      if (onNotify) onNotify('تم حفظ جميع إعدادات النظام بنجاح! ✅');
    } catch (error) {
      console.error('Unable to save admin system settings:', error);
      if (onNotify) onNotify('تعذر حفظ الإعدادات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const updateIntroSlide = (slideId: string, updates: Partial<IntroSlideConfig>) => {
    setIntroSlideSettings((prev) =>
      prev.map((slide) => (slide.id === slideId ? { ...slide, ...updates } : slide))
    );
  };

  const handleIntroSlideImageUpload = (slideId: string, file: File | null) => {
    if (!file || !file.type.startsWith('image/')) {
      if (onNotify) onNotify('يرجى اختيار صورة صالحة للصفحة التمهيدية');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string | undefined;
      if (result) {
        updateIntroSlide(slideId, { imageUrl: result });
        if (onNotify) onNotify('تم تحديث صورة الصفحة التمهيدية بنجاح');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim() || newAdminPassword.length < 6) {
      if (onNotify) onNotify('أكمل الاسم والبريد وكلمة مرور من 6 أحرف على الأقل');
      return;
    }

    setIsAddingAdmin(true);
    try {
      const response = await fetch('/api/v1/admin/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmail,
          phone: newAdminPhone,
          password: newAdminPassword,
          adminRole: newAdminRole,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'تعذر إنشاء حساب المشرف');
      }
      setTeamMembers((prev) => [...prev, result.member]);
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('+968 ');
      setNewAdminPassword('');
      if (onNotify) {
        onNotify(`تم إنشاء حساب المشرف (${result.member.name}) — يستطيع الدخول للوحة الآن بدور «${result.member.roleTitle}»`);
      }
    } catch (error) {
      if (onNotify) onNotify(error instanceof Error ? error.message : 'تعذر إنشاء حساب المشرف');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleToggleAdminStatus = async (member: TeamMember) => {
    if (!authToken) return;
    setChangingAdminId(member.id);
    try {
      const response = await fetch(`/api/v1/admin/team/${member.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ active: !member.active }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'تعذر تحديث حالة المشرف');
      }
      setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? result.member : m)));
      if (onNotify) {
        onNotify(result.member.active
          ? `تم تنشيط حساب المشرف ${result.member.name} — عاد له حق الدخول للوحة`
          : `تم تجميد حساب المشرف ${result.member.name} — لن يستطيع الدخول للوحة الآن`);
      }
    } catch (error) {
      if (onNotify) onNotify(error instanceof Error ? error.message : 'تعذر تحديث حالة المشرف');
    } finally {
      setChangingAdminId(null);
    }
  };

  const handleChangeAdminRole = async (member: TeamMember, adminRole: AdminRole) => {
    if (!authToken || adminRole === member.adminRole) return;
    setChangingAdminId(member.id);
    try {
      const response = await fetch(`/api/v1/admin/team/${member.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ adminRole }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'تعذر تغيير دور المشرف');
      }
      setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? result.member : m)));
      if (onNotify) onNotify(`تم تغيير دور المشرف (${result.member.name}) إلى «${result.member.roleTitle}»`);
    } catch (error) {
      if (onNotify) onNotify(error instanceof Error ? error.message : 'تعذر تغيير دور المشرف');
    } finally {
      setChangingAdminId(null);
    }
  };

  const handleRemoveAdmin = async (member: TeamMember) => {
    if (!authToken) return;
    const confirmed = window.confirm(
      `إزالة «${member.name}» من فريق لوحة الآدمن؟\n\nسيُفقد الحساب حق الدخول للوحة المركزية (يبقى الحساب نفسه في النظام).`
    );
    if (!confirmed) return;
    setChangingAdminId(member.id);
    try {
      const response = await fetch(`/api/v1/admin/team/${member.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'تعذر إزالة المشرف');
      }
      setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
      if (onNotify) onNotify(result.message || `أُزيل المشرف (${member.name}) من فريق اللوحة`);
    } catch (error) {
      if (onNotify) onNotify(error instanceof Error ? error.message : 'تعذر إزالة المشرف');
    } finally {
      setChangingAdminId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="w-10 h-10 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-stone-700 flex items-center justify-center transition-colors"
              title="العودة للوحة المؤشرات الرئيسية"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#131b2e]">
                إعدادات النظام وإدارة الصلاحيات
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006948] text-xs font-bold border border-emerald-200">
                سلطنة عُمان 🇴🇲
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              تخصيص قواعد المنظومة، نسب العمولات، إدارة فريق المشرفين، وبوابات الدفع والرسائل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="h-10 px-5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:cursor-wait disabled:opacity-70"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSavingSettings ? 'animate-spin' : ''}`}>
              {isSavingSettings ? 'progress_activity' : 'save'}
            </span>
            <span>{isSavingSettings ? 'جارٍ الحفظ...' : 'حفظ كافة التغييرات'}</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#eef0ff] overflow-x-auto scrollbar-none border border-[#dae0ff]">
        <button
          type="button"
          onClick={() => setActiveSettingsTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSettingsTab === 'general'
              ? 'bg-white text-[#006948] shadow-xs'
              : 'text-stone-600 hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>الإعدادات العامة والهوية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('financial')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSettingsTab === 'financial'
              ? 'bg-white text-[#006948] shadow-xs'
              : 'text-stone-600 hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>العمولات والتسويات المالية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('operations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSettingsTab === 'operations'
              ? 'bg-white text-[#006948] shadow-xs'
              : 'text-stone-600 hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">timer</span>
          <span>قواعد الحجز ونوافذ الاستلام</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('team')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSettingsTab === 'team'
              ? 'bg-white text-[#006948] shadow-xs'
              : 'text-stone-600 hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          <span>فريق الإدارة والصلاحيات ({teamMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('integrations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSettingsTab === 'integrations'
              ? 'bg-white text-[#006948] shadow-xs'
              : 'text-stone-600 hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">hub</span>
          <span>الربط وبوابات الرسائل (SMS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('marketing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSettingsTab === 'marketing'
              ? 'bg-white text-[#006948] shadow-xs'
              : 'text-stone-600 hover:text-[#131b2e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">public</span>
          <span>الموقع التسويقي</span>
        </button>
      </div>

      {/* TAB 1: GENERAL SETTINGS */}
      {activeSettingsTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            {/* Card 0: Project Logo Upload & Customization */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-[#006948]">
                    image
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-[#131b2e]">
                      شعار وهوية المشروع (Project Logo & Branding)
                    </h2>
                    <p className="text-[11px] text-stone-500">
                      رفع وتخصيص اللوجو الرسمي الذي يظهر عبر الأنظمة الثلاثة وبوابة الدخول
                    </p>
                  </div>
                </div>

                {currentLogo && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    <span>استعادة الشعار الافتراضي</span>
                  </button>
                )}
              </div>

              {/* Logo Preview Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Preview 1: Light Mode Preview */}
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-[10px] font-bold text-stone-500">معاينة على خلفية فاتحة</span>
                  <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-stone-200/80 shadow-xs flex items-center justify-center">
                    {currentLogo ? (
                      <img
                        src={currentLogo}
                        alt="لوجو المشروع"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#006948] text-white flex items-center justify-center font-black text-lg">
                        DB
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-stone-400">واجهة الزبائن والتقارير</span>
                </div>

                {/* Preview 2: Dark Header Preview */}
                <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#232f48] flex flex-col items-center justify-center text-center gap-2 text-white">
                  <span className="text-[10px] font-bold text-stone-300">معاينة على شريط داكن</span>
                  <div className="w-16 h-16 rounded-2xl bg-white/10 p-2 border border-white/10 flex items-center justify-center">
                    {currentLogo ? (
                      <img
                        src={currentLogo}
                        alt="لوجو المشروع"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#006948] text-white flex items-center justify-center font-black text-lg">
                        DB
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-stone-400">شريط التبديل العلوي</span>
                </div>

                {/* Preview 3: Favicon / App Icon Preview */}
                <div className="p-3.5 rounded-xl bg-[#f2f3ff] border border-[#d9dfff] flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-[10px] font-bold text-stone-600">أيقونة النظام المصغرة</span>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
                    {currentLogo ? (
                      <img
                        src={currentLogo}
                        alt="أيقونة اللوجو"
                        className="w-8 h-8 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#006948] text-white flex items-center justify-center font-black text-xs">
                        DB
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-[#131b2e]">DealBox عُمان</div>
                      <div className="text-[8px] text-stone-400 font-mono">dealbox.om</div>
                    </div>
                  </div>
                  <span className="text-[9px] text-stone-400">شريط المتصفح وتطبيق الهاتف</span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(true);
                }}
                onDragLeave={() => setIsDraggingLogo(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessLogoFile(file);
                }}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2.5 ${
                  isDraggingLogo
                    ? 'border-[#006948] bg-emerald-50/70 scale-[0.99]'
                    : 'border-stone-300 hover:border-[#006948] bg-[#fbfbff]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-[#eaedff] text-[#006948] flex items-center justify-center shadow-2xs">
                  <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#131b2e]">
                    اسحب وأفلت ملف الشعار هنا، أو{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#006948] hover:underline font-extrabold cursor-pointer"
                    >
                      تصفح الملفات من جهازك
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    يدعم تنسيقات: PNG بخلفية شفافة، SVG متجهي عالي الدقة، JPG، أو WebP (الحد الأقصى: 3MB)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                    <span>اختيار ملف شعار جديد</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets Selector */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">
                    أو اختر أحد الشعارات النموذجية المقترحة لإنقاذ الغذاء:
                  </span>
                  <span className="text-[10px] text-stone-400">تطبيق فوري</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PRESET_LOGOS.map((preset) => {
                    const isSelected = currentLogo === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPresetLogo(preset.url, preset.label)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#006948] bg-emerald-50/60 ring-2 ring-[#006948]/20'
                            : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/80'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-stone-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-[#131b2e] truncate">
                            {preset.label.split('(')[0]}
                          </div>
                          <div className="text-[9px] text-stone-400 truncate">
                            {preset.label.includes('(') ? preset.label.split('(')[1].replace(')', '') : ''}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[#006948] text-[18px] shrink-0">
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 1: Intro Onboarding Slides */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <span className="material-symbols-outlined text-[22px] text-[#006948]">view_carousel</span>
                <div>
                  <h2 className="text-sm font-black text-[#131b2e]">الصفحات التمهيدية (Onboarding Screens)</h2>
                  <p className="text-[11px] text-stone-500">
                    تحكم في الصور، العناوين، والوصول إلى كل شاشة تمهيدية قبل الدخول
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {introSlideSettings.map((slide, index) => (
                  <div key={slide.id} className="rounded-2xl border border-stone-200 bg-[#fafbff] p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eafdf4] text-[11px] font-black text-[#006948]">
                          {index + 1}
                        </span>
                        <span className="text-[11px] font-bold text-stone-700">الشاشة {index + 1}</span>
                      </div>

                      <label className="inline-flex items-center gap-2 text-[11px] font-bold text-stone-600">
                        <input
                          type="checkbox"
                          checked={slide.enabled}
                          onChange={(e) => updateIntroSlide(slide.id, { enabled: e.target.checked })}
                          className="h-4 w-4 accent-[#006948]"
                        />
                        <span>تفعيل</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">العنوان</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => updateIntroSlide(slide.id, { title: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-stone-300 text-[12px] font-semibold text-[#131b2e]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">وصف الشاشة</label>
                        <textarea
                          value={slide.description}
                          onChange={(e) => updateIntroSlide(slide.id, { description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-[12px] font-semibold text-[#131b2e]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">الشارة</label>
                        <input
                          type="text"
                          value={slide.badge}
                          onChange={(e) => updateIntroSlide(slide.id, { badge: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-stone-300 text-[12px] font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">تاج / نص صغير</label>
                        <input
                          type="text"
                          value={slide.tag}
                          onChange={(e) => updateIntroSlide(slide.id, { tag: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-stone-300 text-[12px] font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-stone-200 p-2.5">
                      <div className="flex items-center gap-3 text-[11px] font-bold text-stone-600">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#eefbf4] text-lg">
                          {slide.icon}
                        </span>
                        <span>الرمز/الصورة الرئيسية</span>
                      </div>

                      <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#006948] px-3 py-2 text-[10px] font-bold text-white">
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        <span>رفع صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleIntroSlideImageUpload(slide.id, e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>

                    {slide.imageUrl && (
                      <img src={slide.imageUrl} alt={slide.title} className="h-20 w-full rounded-xl object-cover border border-stone-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Google Sign-In Settings */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <span className="material-symbols-outlined text-[22px] text-[#006948]">passkey</span>
                <div>
                  <h2 className="text-sm font-black text-[#131b2e]">إعدادات تسجيل Google</h2>
                  <p className="text-[11px] text-stone-500">تفعيل زر تسجيل الدخول عبر Google داخل التطبيق</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-[#fafbff] p-3">
                  <div>
                    <div className="text-[11px] font-bold text-[#131b2e]">تفعيل تسجيل الدخول عبر Google</div>
                    <div className="text-[10px] text-stone-500">يظهر الزر في شاشة تسجيل الدخول عند التفعيل</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={googleAuthEnabled}
                    onChange={(e) => setGoogleAuthEnabled(e.target.checked)}
                    className="h-5 w-5 accent-[#006948]"
                  />
                </label>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 mb-1">Google Client ID</label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="1234567890-abc123.apps.googleusercontent.com"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-stone-300 text-[12px] font-semibold text-[#131b2e]"
                  />
                </div>

                <div className="rounded-xl border border-[#dfe8df] bg-[#eefaf3] px-3 py-2 text-[10px] text-[#006948] font-bold">
                  يجب أن يطابق Client ID هنا قيمة GOOGLE_CLIENT_ID في إعدادات خادم backend؛ يتحقق الخادم من رمز Google قبل تسجيل الدخول.
                </div>
              </div>
            </div>

            {/* Card 2: Official Identity & Platform Details */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
              <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">
                  badge
                </span>
                معلومات وهوية المنصة الرسمية
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">اسم التطبيق والمنصة بالعربية</label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-bold mb-1">العملة الرسمية المعتمدة</label>
                    <input
                      type="text"
                      disabled
                      value={currencySymbol}
                      className="w-full h-10 px-3.5 rounded-xl bg-stone-100 border border-stone-200 font-bold text-stone-700 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      نظام العملة مقفل على الريال العماني (OMR) مع التقريب لـ 3 منازل
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-bold mb-1">المنازل العشرية للأسعار</label>
                    <select
                      value={currencyDecimals}
                      onChange={(e) => setCurrencyDecimals(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                    >
                      <option value={3}>3 منازل (المعيار العماني: 1.500 ر.ع)</option>
                      <option value={2}>منزلتان (1.50 ر.ع)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-bold mb-1">المركز الإقليمي الرئيسي</label>
                    <input
                      type="text"
                      value={defaultRegion}
                      onChange={(e) => setDefaultRegion(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-bold mb-1">لغة واجهة النظام الافتراضية</label>
                    <select
                      value={systemLanguage}
                      onChange={(e) => setSystemLanguage(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                    >
                      <option value="ar-OM">العربية (سلطنة عمان) - Arabic (RTL)</option>
                      <option value="en-OM">English (Sultanate of Oman)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Support Hotline */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">
                  support_agent
                </span>
                قنوات الاتصال وطوارئ الفائض
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">هاتف مركز خدمة الشركاء والمتاجر</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    dir="ltr"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-mono font-bold text-left focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">الخط الساخن للإغاثة العاجلة وتخفيف الضغط</label>
                  <input
                    type="text"
                    value={emergencyHotline}
                    onChange={(e) => setEmergencyHotline(e.target.value)}
                    dir="ltr"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-mono font-bold text-left focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side Status & System Health */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-stone-600">
                  dns
                </span>
                حالة تشغيل المنظومة
              </h3>

              <div className="p-3.5 rounded-xl bg-[#f2f3ff] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">حالة الخوادم السحابية:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    متصلة (99.9%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">المنطقة السحابية:</span>
                  <span className="font-mono text-stone-700 font-semibold">me-central2 (Oman/GCC)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">التوقيت المعتمد:</span>
                  <span className="font-bold text-[#131b2e]">GMT+4 (مسقط)</span>
                </div>
              </div>

              {/* Maintenance Toggle */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#131b2e]">وضع الصيانة المؤقت</div>
                  <div className="text-[10px] text-stone-400">إيقاف الحجوزات مؤقتاً للتحديث</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMaintenanceMode(!isMaintenanceMode);
                    if (onNotify) {
                      onNotify(!isMaintenanceMode ? 'تم تفعيل وضع الصيانة ⚠️' : 'تم تعطيل وضع الصيانة والعودة للإنتاج المباشر ✅');
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    isMaintenanceMode ? 'bg-amber-600' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isMaintenanceMode ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            </div>

            <div className="bg-[#131b2e] text-white rounded-2xl p-5 border border-[#2c3b59] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="material-symbols-outlined text-[20px]">security</span>
                <span>الحماية والتشفير</span>
              </div>
              <p className="text-stone-300 leading-relaxed text-[11px]">
                جميع معاملات الحجز وكود الاستلام (DB-XXXX) مشفرة عبر قنوات SSL 256-bit ومطابقة لاشتراطات الأمن السيبراني في سلطنة عُمان.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL & COMMISSION SETTINGS */}
      {activeSettingsTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
              <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">
                  percent
                </span>
                سياسة عمولة المنصة واقتطاع الأرباح
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-bold mb-1">
                      نسبة عمولة DealBox القياسية للمتاجر (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        className="w-full h-10 pr-4 pl-8 rounded-xl bg-[#f2f3ff] border border-stone-300 font-bold text-[#006948] text-base focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-sm">
                        %
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      النسبة المعتمدة الحالية: يحصل المتجر على {(100 - commissionRate)}% من قيمة كل سلة، والمنصة على {commissionRate}%.
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-bold mb-1">
                      الحد الأدنى لصرف الرصيد للمتجر (ر.ع)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min={1}
                        value={minPayoutAmount}
                        onChange={(e) => setMinPayoutAmount(Number(e.target.value))}
                        className="w-full h-10 pr-4 pl-14 rounded-xl bg-[#f2f3ff] border border-stone-300 font-bold text-[#131b2e] focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">
                        ر.ع
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      لا يتم إصدار أمر التحويل البنكي إلا بعد بلوغ صافي المستحقات هذا الحد
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">جدولة دورة التسويات والتحويلات البنكية</label>
                  <select
                    value={payoutSchedule}
                    onChange={(e) => setPayoutSchedule(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  >
                    <option value="weekly">أسبوعية - كل يوم خميس نهاية أسبوع العمل العماني (الموصى بها)</option>
                    <option value="biweekly">نصف شهرية - يوم 15 ونهاية كل شهر</option>
                    <option value="monthly">شهرية - اليوم الأول من كل شهر ميلادي</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Central Platform Bank Account */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">
                  account_balance
                </span>
                الحساب البنكي المركزي لمنصة DealBox عُمان
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">اسم البنك المشغل للحساب المركزي</label>
                  <input
                    type="text"
                    value={centralBankName}
                    onChange={(e) => setCentralBankName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-bold text-[#131b2e] focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">
                    رقم الآيبان البنكي العماني المعتمد (IBAN)
                  </label>
                  <input
                    type="text"
                    value={centralIban}
                    onChange={(e) => setCentralIban(e.target.value)}
                    dir="ltr"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-mono font-bold text-left tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Calculation Simulation Box */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-[#131b2e]">محاكاة توزيع سلة نموذجية</h3>
              
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-stone-700">
                  <span>سعر السلة الأصلي:</span>
                  <span className="line-through text-stone-400">4.500 ر.ع</span>
                </div>
                <div className="flex items-center justify-between font-bold text-[#006948] text-sm">
                  <span>سعر البيع المخفض (الإنقاذ):</span>
                  <span>1.500 ر.ع</span>
                </div>
                <div className="pt-2 border-t border-emerald-200/80 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>حصة المتجر الشريك ({(100 - commissionRate)}%):</span>
                    <span className="font-bold text-[#131b2e]">
                      {(1.5 * (1 - commissionRate / 100)).toFixed(3)} ر.ع
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>عمولة المنصة ({commissionRate}%):</span>
                    <span className="font-bold text-[#006948]">
                      {(1.5 * (commissionRate / 100)).toFixed(3)} ر.ع
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-stone-500 leading-relaxed">
                يتم قيد المبالغ تلقائياً في سجل التسويات (`Settlements`)، ويتاح لمدير المتجر تحميل كشف الحساب من لوحة الشريك.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONS & PICKUP RULES */}
      {activeSettingsTab === 'operations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
              <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">
                  schedule
                </span>
                ضوابط الحجز وتوقيتات الاستلام
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-bold mb-1">
                      مهلة صلاحية الحجز المؤقت قبل الإلغاء (بالدقائق)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={120}
                      value={maxHoldTimeMinutes}
                      onChange={(e) => setMaxHoldTimeMinutes(Number(e.target.value))}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                    />
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      إذا لم يحضر الزبون خلال {maxHoldTimeMinutes} دقيقة بعد بدء النافذة، يلغى الحجز تلقائياً
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-bold mb-1">
                      الحد الأقصى للسلال لكل زبون يومياً
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxDailyBasketsPerUser}
                      onChange={(e) => setMaxDailyBasketsPerUser(Number(e.target.value))}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                    />
                    <span className="text-[10px] text-stone-400 mt-1 block">
                      لمنع الاحتكار وضمان وصول فائض الطعام لأكبر عدد من العائلات
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 font-bold mb-1">بداية نافذة الاستلام المسائية الرسمية</label>
                    <input
                      type="time"
                      value={eveningWindowStart}
                      onChange={(e) => setEveningWindowStart(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-bold mb-1">نهاية نافذة الاستلام المسائية الرسمية</label>
                    <input
                      type="time"
                      value={eveningWindowEnd}
                      onChange={(e) => setEveningWindowEnd(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#131b2e]">
                        إعادة الطرح التلقائي للسلال الملغاة (Auto-Relist)
                      </div>
                      <div className="text-[10px] text-stone-400">
                        إرجاع السلة فوراً للمتجر في حال عدم استلامها قبل إغلاق المتجر بساعة
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoRelistCancelled(!autoRelistCancelled)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        autoRelistCancelled ? 'bg-[#006948]' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          autoRelistCancelled ? '-translate-x-6' : 'translate-x-0'
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#131b2e]">
                        إلزام مسح كود الاستلام (DB-XXXX) في المتجر
                      </div>
                      <div className="text-[10px] text-stone-400">
                        لا يمكن للمتجر تأكيد التسليم إلا بعد التحقق من الكود الرقمي للزبون
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRequireBookingCodeScan(!requireBookingCodeScan)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        requireBookingCodeScan ? 'bg-[#006948]' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          requireBookingCodeScan ? '-translate-x-6' : 'translate-x-0'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Food Safety & Ministry Guidelines */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">
                  verified_user
                </span>
                معايير سلامة الغذاء (بلدية مسقط)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                يشترط في جميع سلال الفائض حفظ المخبوزات في درجة حرارة الغرفة (أقل من 24° م)، ونقل منتجات الألبان والأغذية الحساسة داخل مبردات مخصصة (4° م).
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium">
                يمنع منعاً باتاً طرح أي أغذية منتهية الصلاحية؛ المنصة مخصصة فقط لفائض اليوم الصالح للاستهلاك الآدمي.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEAM & ROLES (RBAC) */}
      {activeSettingsTab === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-black text-[#131b2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-[#006948]">
                    shield_person
                  </span>
                  فريق المشرفين والصلاحيات الميدانية (RBAC)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  تحديد أدوار المشرفين ومدراء العمليات المصرح لهم بدخول لوحة الآدمن المركزية
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(true)}
                  disabled={isAddingAdmin}
                  className="h-10 px-4 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>إضافة مشرف جديد</span>
                </button>
              )}
            </div>

            {/* كتالوج الأدوار المعتمدة للدخول إلى اللوحة */}
            <div>
              <h3 className="text-xs font-black text-[#131b2e] flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-[16px] text-[#006948]">workspace_premium</span>
                الأدوار المعتمدة وأقسامها
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {ADMIN_ROLE_KEYS.map((key) => {
                  const role = ADMIN_ROLE_CATALOG[key];
                  return (
                    <div key={key} className="rounded-xl border border-stone-200 bg-[#fafbff] p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${role.color}`}>
                          <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                        </span>
                        <div className="min-w-0">
                          <div className="font-black text-[#131b2e] text-[12px] leading-tight">{role.title}</div>
                          <div className="text-[10px] text-stone-400 leading-snug">{role.description}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission: AdminPermission) => (
                          <span
                            key={permission}
                            className="px-1.5 py-0.5 rounded-md bg-[#eef0ff] text-stone-600 text-[9.5px] font-bold"
                          >
                            {ADMIN_PERMISSION_LABELS[permission]}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* أعضاء الفريق الحقيقيون */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#006948]">group</span>
                  أعضاء الفريق المصرح لهم بدخول اللوحة
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  حسابات حقيقية — تغيير الدور أو التجميد ينعكس فوراً على صلاحية الدخول للوحة المركزية
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#eef0ff] text-stone-600 text-[11px] font-bold w-fit">
                {teamMembers.length} مشرف
              </span>
            </div>

            {isTeamLoading ? (
              <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                جارٍ تحميل فريق المشرفين...
              </div>
            ) : teamError ? (
              <div className="py-12 text-center text-rose-700 text-xs">{teamError}</div>
            ) : teamMembers.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-xs">
                لا يوجد مشرفون بعد — أضف أول مشرف بحساب حقيقي يستطيع الدخول للوحة
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-[#f2f3ff] text-stone-600 border-b border-stone-200 font-bold">
                      <th className="py-3 px-4 rounded-r-xl">المشرف</th>
                      <th className="py-3 px-4">الدور والصلاحية</th>
                      <th className="py-3 px-4">رقم الهاتف</th>
                      <th className="py-3 px-4">آخر نشاط</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4 rounded-l-xl text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {teamMembers.map((member) => {
                      const superAdminsCount = teamMembers.filter(
                        (m) => m.adminRole === 'super_admin' && m.active
                      ).length;
                      const isLastSuperAdmin =
                        member.adminRole === 'super_admin' && member.active && superAdminsCount === 1;
                      const isBusy = changingAdminId === member.id;
                      return (
                        <tr key={member.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#131b2e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {member.name.slice(0, 1)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-[#131b2e] flex items-center gap-1.5">
                                  <span className="truncate">{member.name}</span>
                                  {member.isSelf && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">
                                      أنت
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-stone-400 font-mono" dir="ltr">
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${member.badgeColor}`}>
                                {member.roleTitle}
                              </span>
                              {isBusy && (
                                <span className="material-symbols-outlined text-[14px] text-stone-400 animate-spin">
                                  progress_activity
                                </span>
                              )}
                            </div>
                            {isSuperAdmin && !member.isSelf && (
                              <select
                                value={member.adminRole}
                                onChange={(e) => handleChangeAdminRole(member, e.target.value as AdminRole)}
                                disabled={isBusy}
                                title="تغيير دور المشرف وصلاحياته (ينعكس فوراً)"
                                className="mt-1.5 h-7 px-2 rounded-lg bg-[#f2f3ff] border border-stone-300 text-[10.5px] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#006948] max-w-full"
                              >
                                {ADMIN_ROLE_KEYS.map((key) => (
                                  <option key={key} value={key}>
                                    {ADMIN_ROLE_CATALOG[key].shortTitle}
                                  </option>
                                ))}
                              </select>
                            )}
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {member.permissions.slice(0, 3).map((permission) => (
                                <span
                                  key={permission}
                                  className="px-1.5 py-0.5 rounded-md bg-[#eef0ff] text-stone-600 text-[9px] font-bold"
                                >
                                  {ADMIN_PERMISSION_LABELS[permission]}
                                </span>
                              ))}
                              {member.permissions.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 text-[9px] font-bold">
                                  +{member.permissions.length - 3} أقسام
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-stone-600" dir="ltr">
                            {member.phone || '—'}
                          </td>

                          <td className="py-3.5 px-4 text-stone-500">
                            {formatLastActive(member.lastLoginAt)}
                          </td>

                          <td className="py-3.5 px-4">
                            {member.active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                نشط
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                مجمد
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {member.isSelf ? (
                                <span className="text-[10px] text-stone-400 font-bold">حسابك الحالي</span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy || isLastSuperAdmin}
                                    onClick={() => handleToggleAdminStatus(member)}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                      member.active
                                        ? 'text-amber-700 hover:bg-amber-50'
                                        : 'text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                    title={
                                      isLastSuperAdmin
                                        ? 'لا يمكن تجميد آخر مدير عام للنظام'
                                        : member.active
                                          ? 'تجميد الحساب (فقدان حق الدخول للوحة)'
                                          : 'تنشيط الحساب (العودة لحق الدخول للوحة)'
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      {member.active ? 'lock' : 'lock_open'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy || isLastSuperAdmin}
                                    onClick={() => handleRemoveAdmin(member)}
                                    className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={
                                      isLastSuperAdmin
                                        ? 'لا يمكن إزالة آخر مدير عام للنظام'
                                        : 'إزالة من فريق اللوحة (يبقى الحساب في النظام)'
                                    }
                                  >
                                    <span className="material-symbols-outlined text-[18px]">person_remove</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: INTEGRATIONS & SMS GATEWAY */}
      {activeSettingsTab === 'integrations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">
                  lock_reset
                </span>
                استعادة كلمة المرور («نسيت كلمة المرور»)
              </h2>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${smtpConfigured ? 'bg-emerald-50 text-[#006948]' : 'bg-amber-50 text-[#855300]'}`}>
                  {smtpConfigured ? 'مرسل SMTP مفعّل' : 'مرسل البريد لم يُهيأ بعد — وضع التطوير'}
                </span>
                <button
                  type="button"
                  onClick={handleTogglePasswordReset}
                  disabled={isSavingResetSettings}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 disabled:opacity-50 ${
                    passwordResetEnabled ? 'bg-[#006948]' : 'bg-stone-300'
                  }`}
                  title={passwordResetEnabled ? 'إيقاف خاصية نسيان كلمة المرور' : 'تفعيل خاصية نسيان كلمة المرور'}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      passwordResetEnabled ? '-translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className={`p-3.5 rounded-xl border space-y-1.5 ${passwordResetEnabled ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-stone-50'}`}>
                <div className="flex items-center gap-1.5 font-bold text-[#131b2e]">
                  <span className="material-symbols-outlined text-[18px] text-[#006948]">
                    {passwordResetEnabled ? 'check_circle' : 'toggle_off'}
                  </span>
                  <span>{passwordResetEnabled ? 'خاصية استعادة كلمة المرور مفعّلة' : 'خاصية استعادة كلمة المرور معطّلة'}</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {passwordResetEnabled
                    ? 'يمكن للأدمن ومسؤول المتجر والمستفيد طلب رابط استعادة عبر «نسيت كلمة المرور؟» وتصل رسالة على البريد خلال 30 دقيقة.'
                    : 'عند الإيقاف، ترفض الخدمة طلبات الاستعادة برسالة «تواصل مع الإدارة».'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#f2f3ff]">
                  <span className="text-stone-600 font-medium">البريد المُرسِل (from):</span>
                  <span className="font-mono text-[11px] text-[#131b2e] font-bold truncate" dir="ltr">
                    {mailFrom || 'DealBox عُمان <no-reply@dealbox.om>'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#f2f3ff]">
                  <span className="text-stone-600 font-medium">مدة صلاحية الرابط:</span>
                  <span className="font-bold text-[#131b2e]">30 دقيقة</span>
                </div>
              </div>

              {!smtpConfigured && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <span className="material-symbols-outlined text-[18px]">contact_mail</span>
                    <span>إعداد المرسل الفعلي يضاف لاحقاً عند شراء الدومين</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    حالياً يعمل النظام في «وضع التطوير»: يظهر رابط إعادة التعيين مباشرة في شاشة «نسيت كلمة المرور؟»
                    على لوحات الدخول الثلاث (الأدمن / المتجر / المستفيد). عندما يتوفر الدومين، أضف هذه المتغيرات
                    في <code dir="ltr" className="font-mono font-bold">backend/.env</code> وستُرسل رسائل حقيقية تلقائياً:
                  </p>
                  <pre dir="ltr" className="overflow-x-auto rounded-lg bg-white/70 border border-amber-200 px-3 py-2 font-mono text-[10.5px] leading-5 text-stone-700">
{`MAIL_ENABLED=true
MAIL_HOST=smtp.yourdomain.com
MAIL_PORT=587
MAIL_USER=no-reply@yourdomain.com
MAIL_PASS=******
MAIL_FROM=DealBox عُمان <no-reply@yourdomain.com>
FRONTEND_URL=https://yourdomain.com`}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
            <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#006948]">
                sms
              </span>
              بوابة الرسائل النصية القصيرة (Oman SMS Gateway)
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 font-bold mb-1">مزود خدمة الرسائل المعتمد في عمان</label>
                <select
                  value={smsGateway}
                  onChange={(e) => setSmsGateway(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                >
                  <option value="omantel_ooredoo">بوابة عمانتل وأوريدو المشتركة (Omantel / Ooredoo Telecom)</option>
                  <option value="twilio_oman">Twilio GCC Oman Trunk</option>
                  <option value="unifonic_oman">Unifonic Oman SMS Hub</option>
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#131b2e]">
                      إرسال كود الاستلام الفوري عبر SMS
                    </div>
                    <div className="text-[10px] text-stone-400">
                      يصل للزبون رسالة فور تأكيد الحجز تحمل كود (DB-XXXX)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendSmsOnBooking(!sendSmsOnBooking)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      sendSmsOnBooking ? 'bg-[#006948]' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        sendSmsOnBooking ? '-translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#131b2e]">
                      تنبيهات WhatsApp Business للمتاجر
                    </div>
                    <div className="text-[10px] text-stone-400">
                      إشعار مدير المتجر أو الكاشير لحظياً فور حجز سلة جديدة
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWhatsappNotifications(!whatsappNotifications)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      whatsappNotifications ? 'bg-[#006948]' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        whatsappNotifications ? '-translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-5">
            <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#006948]">
                map
              </span>
              ربط خرائط جوجل والملاحة (Google Maps Platform)
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>خرائط المتاجر مفعلة بنجاح</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  تحديد مواقع المخابز والمتاجر في الخوض، الحيل، السيب، والقرم مع حساب مسافة الكيلومترات المتبقية للمستفيدين.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff]">
                <span className="text-stone-600 font-medium">مفتاح واجهة برمجة التطبيقات (API Key):</span>
                <span className="font-mono text-[11px] text-[#131b2e] font-bold">AIzaSy...DEMO_KEY</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MARKETING SITE CONTENT */}
      {activeSettingsTab === 'marketing' && (
        <div className="animate-in fade-in duration-200">
          <AdminMarketingEditor authToken={authToken} onNotify={onNotify} />
        </div>
      )}

      {/* Modal: Add Admin User */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-200 text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-[#006948]">
                <span className="material-symbols-outlined text-[24px]">person_add</span>
                <h3 className="text-base font-black text-[#131b2e]">إضافة مشرف إداري جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-600 font-bold mb-1">الاسم الكامل للمشرف *</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="مثال: يوسف بن خلفان المعمري"
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">البريد الإلكتروني المؤسسي *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="name@dealbox.om"
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">رقم الهاتف العماني *</label>
                <input
                  type="text"
                  required
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">كلمة المرور (يدخل بها المشرف للوحة) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
                <p className="mt-1 text-[10.5px] text-stone-400">
                  سيُنشأ حساب حقيقي له حق الدخول للوحة الآدمن المركزية بدوره وصلاحياته.
                </p>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">الدور والصلاحيات *</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                >
                  {ADMIN_ROLE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {ADMIN_ROLE_CATALOG[key].title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAddingAdmin}
                  className="px-5 py-2 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold shadow-xs active:scale-95 transition-all disabled:opacity-60 disabled:cursor-wait"
                >
                  {isAddingAdmin ? 'جارٍ الإنشاء...' : 'إضافة المشرف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
