/**
 * DealBox RBAC — كتالوج أدوار لوحة الآدمن المركزية وصلاحياتها.
 *
 * الأدوار هنا تحدد من «المصرح له بدخول لوحة الآدمن المركزية» وما يراه فيها:
 * - كل من يحمل role: 'admin' في جدول المستخدمين يمكنه الدخول للوحة،
 *   لكن الصلاحيات الفعلية تُشتق من adminRole أدناه.
 * - الفريق يُدار من تبويب «فريق المشرفين والصلاحيات الميدانية (RBAC)»
 *   في إعدادات النظام، ويقتصر التعديل على مدير عام للنظام (super_admin).
 */

export const ADMIN_ROLE_KEYS = [
  'super_admin',
  'operations_manager',
  'supervisor',
  'logistics_manager',
  'financial_officer',
  'food_safety',
];

export const ALL_ADMIN_PERMISSIONS = [
  'overview',
  'stores',
  'pickups',
  'reports',
  'users',
  'accounting',
  'stories',
  'settings',
];

/**
 * كل دور: العنوان، الوصف، اللون (يُطابَق في واجهة الأدمن)، والصلاحيات.
 * المفتاح `permissions` هو مصدر الحقيقة الوحيد للصلاحيات.
 */
export const ADMIN_ROLE_CATALOG = {
  super_admin: {
    key: 'super_admin',
    title: 'مدير عام للنظام (Super Admin)',
    shortTitle: 'مدير عام',
    color: 'bg-emerald-100 text-[#006948]',
    icon: 'shield_person',
    description: 'صلاحيات كاملة على كافة أقسام لوحة الآدمن المركزية وإدارة فريق المشرفين',
    permissions: [...ALL_ADMIN_PERMISSIONS],
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

/**
 * يعيد معلومات الدور مع بديل آمن (super_admin) للقيم غير المعروفة.
 * @param {string|null|undefined} key
 */
export const adminRoleInfo = (key) => ADMIN_ROLE_CATALOG[key] || ADMIN_ROLE_CATALOG.super_admin;

/**
 * صلاحيات دور معيّن (مصدر الحقيقة الوحيد).
 * المستخدمون الأقدم دون adminRole يعاملون كمدير عام للحفاظ على التوافق.
 */
export const permissionsForRole = (key) => (
  ADMIN_ROLE_CATALOG[key]?.permissions || ALL_ADMIN_PERMISSIONS
);

/** نص عربي مقروء لصلاحية معينة (تُستخدم في واجهة وتوثيق). */
export const ADMIN_PERMISSION_LABELS = {
  overview: 'لوحة التحكم العامة',
  stores: 'إدارة المتاجر والمخازن',
  pickups: 'الحجوزات والاستلام الفوري',
  reports: 'تقارير الأثر وهدر الطعام',
  users: 'قائمة المستخدمين',
  accounting: 'الحسابات والتقرير المحاسبي',
  stories: 'قصص المتاجر المدفوعة',
  settings: 'الإعدادات وإدارة الفريق',
};