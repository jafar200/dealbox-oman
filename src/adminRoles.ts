import type { AdminPermission, AdminRole, AdminRoleCatalogItem } from './types';

/**
 * كتالوج أدوار لوحة الآدمن المركزية (عرض فقط).
 * المرجع الحقيقي للصلاحيات هو الخادم: backend/src/config/adminRoles.js —
 * تُعرض هنا البيانات (العنوان/اللون/الأيقونة) ويتحقق الخادم من الصلاحيات فعلياً.
 */
export const ADMIN_ROLE_KEYS: AdminRole[] = [
  'super_admin',
  'operations_manager',
  'supervisor',
  'logistics_manager',
  'financial_officer',
  'food_safety',
];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  overview: 'لوحة التحكم العامة',
  stores: 'إدارة المتاجر والمخازن',
  pickups: 'الحجوزات والاستلام الفوري',
  reports: 'تقارير الأثر وهدر الطعام',
  users: 'قائمة المستخدمين',
  accounting: 'الحسابات والتقرير المحاسبي',
  stories: 'قصص المتاجر المدفوعة',
  settings: 'الإعدادات وإدارة الفريق',
};

export const ADMIN_ROLE_CATALOG: Record<AdminRole, AdminRoleCatalogItem> = {
  super_admin: {
    key: 'super_admin',
    title: 'مدير عام للنظام (Super Admin)',
    shortTitle: 'مدير عام',
    color: 'bg-emerald-100 text-[#006948]',
    icon: 'shield_person',
    description: 'صلاحيات كاملة على كافة أقسام لوحة الآدمن المركزية وإدارة فريق المشرفين',
    permissions: ['overview', 'stores', 'pickups', 'reports', 'users', 'accounting', 'stories', 'settings'],
  },
  operations_manager: {
    key: 'operations_manager',
    title: 'مدير العمليات',
    shortTitle: 'مدير عمليات',
    color: 'bg-cyan-100 text-cyan-900',
    icon: 'business_center',
    description: 'يشرف على عمليات المتاجر والحجوزات والاستلام اليومي وقائمة المستفيدين',
    permissions: ['overview', 'stores', 'pickups', 'reports', 'users'],
  },
  supervisor: {
    key: 'supervisor',
    title: 'مشرف ميداني',
    shortTitle: 'مشرف ميداني',
    color: 'bg-teal-100 text-teal-900',
    icon: 'supervisor_account',
    description: 'متابعة الاستلام الميداني وتقارير الأثر والتوزيع لحظياً',
    permissions: ['overview', 'pickups', 'reports'],
  },
  logistics_manager: {
    key: 'logistics_manager',
    title: 'مشرف النقل الميداني والإغاثة',
    shortTitle: 'مشرف نقل',
    color: 'bg-blue-100 text-blue-900',
    icon: 'local_shipping',
    description: 'إدارة نقل السلل والتنسيق مع المتاجر والحجوزات الميدانية',
    permissions: ['overview', 'stores', 'pickups', 'reports'],
  },
  financial_officer: {
    key: 'financial_officer',
    title: 'مسؤول التسويات والتدقيق المالي',
    shortTitle: 'مسؤول مالي',
    color: 'bg-amber-100 text-amber-900',
    icon: 'account_balance',
    description: 'التسويات المالية والعمولات والتقرير المحاسبي وقائمة المستفيدين',
    permissions: ['overview', 'stores', 'users', 'accounting'],
  },
  food_safety: {
    key: 'food_safety',
    title: 'مراقب جودة وسلامة الأغذية',
    shortTitle: 'مراقب جودة',
    color: 'bg-purple-100 text-purple-900',
    icon: 'health_and_safety',
    description: 'فحص جودة السلل وقصص الإنقاذ وسلامة المتاجر الغذائية',
    permissions: ['overview', 'stores', 'stories'],
  },
};

/** نص عربي مقروء لوقت آخر نشاط (بالنسبة للعرض في جدول الفريق). */
export const formatLastActive = (lastLoginAt: string | null): string => {
  if (!lastLoginAt) return 'لم يسجل الدخول بعد';
  const then = new Date(lastLoginAt).getTime();
  if (Number.isNaN(then)) return 'غير معروف';
  const diffMinutes = Math.floor((Date.now() - then) / 60000);
  if (diffMinutes < 1) return 'الآن (متصّل)';
  if (diffMinutes < 60) return `قبل ${diffMinutes} دقيقة`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `قبل ${diffDays} يوم`;
  return new Date(lastLoginAt).toLocaleDateString('ar-OM', { day: 'numeric', month: 'short', year: 'numeric' });
};