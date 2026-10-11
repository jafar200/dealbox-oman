import { useState, useRef } from 'react';
import { Store, Wilayah, BasketCategory } from '../types';

interface AdminStoresSectionProps {
  storesList: Store[];
  onAddStore: () => void;
  onEditStore?: (store: Store) => Promise<boolean>;
  onNotify?: (msg: string) => void;
  authToken?: string;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  bakery: { label: 'مخبوزات ومعجنات', icon: 'bakery_dining' },
  supermarket: { label: 'سوبرماركت وأغذية', icon: 'shopping_cart' },
  restaurant: { label: 'مطاعم وبوفيهات', icon: 'restaurant' },
  cooked: { label: 'وجبات مطبوخة', icon: 'ramen_dining' },
  cafe: { label: 'مقاهي وحلويات', icon: 'local_cafe' },
  produce: { label: 'خضار وفواكه مزارع', icon: 'eco' },
};

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  active: { label: 'نشط', dot: 'bg-emerald-500', badge: 'bg-[#006948]/10 text-[#006948]' },
  pending: { label: 'قيد الانضمام', dot: 'bg-amber-500', badge: 'bg-[#ffddb8] text-[#855300]' },
  suspended: { label: 'موقوف', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' },
};

const WILAYAH_OPTIONS: Wilayah[] = ['السيب', 'بوشر', 'مطرح', 'العامرات', 'صحار', 'صلالة', 'نزوى', 'بركاء'];
const CATEGORY_OPTIONS: { value: BasketCategory; label: string }[] = [
  { value: 'bakery', label: 'مخبوزات ومعجنات' },
  { value: 'supermarket', label: 'سوبرماركت وأغذية' },
  { value: 'restaurant', label: 'مطاعم وبوفيهات' },
  { value: 'cooked', label: 'وجبات مطبوخة' },
  { value: 'cafe', label: 'مقاهي وحلويات' },
  { value: 'produce', label: 'خضار وفواكه مزارع' },
];

interface EditFormState {
  name: string;
  phone: string;
  address: string;
  area: string;
  wilaya: Wilayah;
  category: BasketCategory;
  crNumber: string;
  status: 'active' | 'pending' | 'suspended';
  commissionRate: number;
  bankName: string;
  accountHolder: string;
  iban: string;
}

const emptyForm = (store: Store): EditFormState => ({
  name: store.name,
  phone: store.phone,
  address: store.address,
  area: store.area,
  wilaya: store.wilaya,
  category: store.category,
  crNumber: store.crNumber,
  status: store.status,
  commissionRate: store.commissionRate,
  bankName: store.bankAccount.bankName,
  accountHolder: store.bankAccount.accountHolder,
  iban: store.bankAccount.iban,
});

export function AdminStoresSection({ storesList, onAddStore, onEditStore, onNotify, authToken = '' }: AdminStoresSectionProps) {
  const activeCount = storesList.filter((s) => s.status === 'active').length;
  const pendingCount = storesList.filter((s) => s.status === 'pending').length;

  // حالة نموذج التعديل
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const openEdit = (store: Store) => {
    setEditingStore(store);
    setForm(emptyForm(store));
    setEditError('');
  };

  const closeEdit = () => {
    setEditingStore(null);
    setForm(null);
    setEditError('');
  };

  const patchForm = (p: Partial<EditFormState>) => {
    if (form) setForm({ ...form, ...p });
  };

  // رفع الشعار
  const handleLogoFile = async (file: File | undefined) => {
    if (!file || !editingStore || !authToken) return;
    const form = new FormData();
    form.append('image', file);
    setUploadingLogo(true);
    try {
      const r = await fetch(`/api/v1/admin/stores/${editingStore.id}/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form,
      });
      const result = await r.json();
      if (!r.ok || !result.success) {
        onNotify?.(result.message || 'تعذر رفع الشعار');
        return;
      }
      // تحديث الشعار في البطاقة مباشرة
      setEditingStore((s) => (s ? { ...s, logoUrl: result.url } : s));
      onNotify?.('تم رفع شعار المتجر بنجاح');
    } catch {
      onNotify?.('تعذر رفع الشعار');
    } finally {
      setUploadingLogo(false);
    }
  };

  // حفظ التعديلات
  const saveEdit = async () => {
    if (!editingStore || !form || !onEditStore) return;
    setIsSavingEdit(true);
    setEditError('');
    try {
      const ok = await onEditStore({
        ...editingStore,
        name: form.name,
        phone: form.phone,
        address: form.address,
        area: form.area,
        wilaya: form.wilaya,
        category: form.category,
        crNumber: form.crNumber,
        status: form.status,
        commissionRate: form.commissionRate,
        bankAccount: { bankName: form.bankName, accountHolder: form.accountHolder, iban: form.iban },
      });
      if (ok) {
        onNotify?.('تم حفظ تعديلات المتجر بنجاح');
        closeEdit();
      } else {
        setEditError('تعذر حفظ التعديلات — تحقق من البيانات');
      }
    } catch {
      setEditError('تعذر الاتصال بالخادم');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg sm:text-xl font-black text-[#131b2e]">إدارة المتاجر والمخازن</h1>
          <p className="text-xs text-stone-500">
            بيانات المتاجر الشريكة الحقيقية المسجلة في المنصة (الولاية، الفئة، الحالة، العمولة)
          </p>
        </div>
        <button
          type="button"
          onClick={onAddStore}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add_business</span>
          <span>إضافة متجر جديد</span>
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-600">إجمالي المتاجر</span>
          <span className="text-2xl font-black text-[#131b2e] font-mono" dir="ltr">{storesList.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-600">المتاجر النشطة</span>
          <span className="text-2xl font-black text-[#006948] font-mono" dir="ltr">{activeCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-600">قيد الانضمام</span>
          <span className="text-2xl font-black text-[#855300] font-mono" dir="ltr">{pendingCount}</span>
        </div>
      </div>

      {/* Stores grid */}
      {storesList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-xs text-stone-400">
          لا توجد متاجر مسجلة بعد. اضغط "إضافة متجر جديد" لإضافة أول شريك.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {storesList.map((store) => {
            const cat = CATEGORY_META[store.category] || { label: 'متجر', icon: 'storefront' };
            const stat = STATUS_META[store.status] || STATUS_META.active;
            return (
              <div
                key={store.id}
                className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* شعار المتجر أو أيقونة الفئة */}
                    <div className="w-11 h-11 rounded-2xl bg-[#e2e7ff] text-[#006948] flex items-center justify-center shrink-0 overflow-hidden border border-stone-200">
                      {store.logoUrl ? (
                        <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#131b2e] leading-tight">{store.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono" dir="ltr">{store.crNumber}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${stat.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`}></span>
                    {stat.label}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-stone-400">location_on</span>
                    {store.wilaya} — {store.area}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-stone-400">person</span>
                    {store.managerName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-stone-400">call</span>
                    <span dir="ltr">{store.phone}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-stone-400">sell</span>
                    <span>{cat.label}</span>
                    <span className="mr-auto inline-flex items-center gap-1 rounded-full bg-[#f2f3ff] px-2 py-0.5 font-bold text-[#006948]">
                      {(store.commissionRate * 100).toFixed(0)}% عمولة
                    </span>
                  </span>
                </div>

                <div className="pt-2 mt-auto border-t border-stone-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(store)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    تعديل المتجر
                  </button>
                  <button
                    type="button"
                    onClick={() => onNotify && onNotify(`ملف المتجر: ${store.name} — السجل التجاري ${store.crNumber}`)}
                    className="px-3 py-2 rounded-xl bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff] text-xs font-bold transition-colors"
                    title="عرض ملف المتجر"
                  >
                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نموذج تعديل المتجر */}
      {editingStore && form && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-[#006948]">
                <span className="material-symbols-outlined text-[24px]">edit</span>
                <h3 className="text-base font-black text-[#131b2e]">تعديل متجر: {editingStore.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* الشعار */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#fcfcff] border border-[#eeeaf7]">
                <div className="w-16 h-16 rounded-2xl bg-[#e2e7ff] flex items-center justify-center overflow-hidden shrink-0 border border-stone-200">
                  {editingStore.logoUrl ? (
                    <img src={editingStore.logoUrl} alt="شعار المتجر" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[28px] text-stone-300">storefront</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-[#131b2e] mb-1">شعار المتجر</div>
                  <p className="text-[10.5px] text-stone-400 mb-2">يظهر للزبائن في التطبيق وفي لوحة الإدارة</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#131b2e] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#283044] disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined text-[14px] ${uploadingLogo ? 'animate-spin' : ''}`}>
                        {uploadingLogo ? 'sync' : 'upload'}
                      </span>
                      {uploadingLogo ? 'جارٍ الرفع…' : 'رفع شعار'}
                    </button>
                    {editingStore.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingStore((s) => (s ? { ...s, logoUrl: '' } : s))}
                        className="rounded-lg border border-[#e6e2f2] px-3 py-1.5 text-[11px] font-bold text-stone-500 transition hover:border-red-200 hover:text-red-600"
                      >
                        إزالة
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      handleLogoFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block font-bold text-stone-600">اسم المتجر *</span>
                  <input
                    value={form.name}
                    onChange={(e) => patchForm({ name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-bold text-stone-600">رقم السجل التجاري *</span>
                  <input
                    value={form.crNumber}
                    onChange={(e) => patchForm({ crNumber: e.target.value })}
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block font-bold text-stone-600">الولاية</span>
                  <select
                    value={form.wilaya}
                    onChange={(e) => patchForm({ wilaya: e.target.value as Wilayah })}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  >
                    {WILAYAH_OPTIONS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block font-bold text-stone-600">المنطقة *</span>
                  <input
                    value={form.area}
                    onChange={(e) => patchForm({ area: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block font-bold text-stone-600">العنوان الكامل *</span>
                <input
                  value={form.address}
                  onChange={(e) => patchForm({ address: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block font-bold text-stone-600">الفئة</span>
                  <select
                    value={form.category}
                    onChange={(e) => patchForm({ category: e.target.value as BasketCategory })}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block font-bold text-stone-600">الحالة</span>
                  <select
                    value={form.status}
                    onChange={(e) => patchForm({ status: e.target.value as 'active' | 'pending' | 'suspended' })}
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  >
                    <option value="active">نشط</option>
                    <option value="pending">قيد الانضمام</option>
                    <option value="suspended">موقوف</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block font-bold text-stone-600">رقم الهاتف *</span>
                  <input
                    value={form.phone}
                    onChange={(e) => patchForm({ phone: e.target.value })}
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-bold text-stone-600">العمولة %</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={(form.commissionRate * 100).toFixed(0)}
                    onChange={(e) => patchForm({ commissionRate: (Number(e.target.value) || 0) / 100 })}
                    dir="ltr"
                    className="w-full h-10 px-3 rounded-xl bg-[#f2f3ff] border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                  />
                </label>
              </div>

              {/* التفاصيل البنكية */}
              <div className="p-3 rounded-xl bg-[#f2f3ff] space-y-2.5">
                <div className="text-[11px] font-black text-[#131b2e] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#006948]">account_balance</span>
                  التفاصيل البنكية
                </div>
                <input
                  value={form.bankName}
                  onChange={(e) => patchForm({ bankName: e.target.value })}
                  placeholder="اسم البنك"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
                <input
                  value={form.accountHolder}
                  onChange={(e) => patchForm({ accountHolder: e.target.value })}
                  placeholder="اسم صاحب الحساب"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
                <input
                  value={form.iban}
                  onChange={(e) => patchForm({ iban: e.target.value })}
                  placeholder="IBAN"
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-stone-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                  {editError}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={saveEdit}
                disabled={isSavingEdit || !form.name.trim() || !form.crNumber.trim() || !form.phone.trim()}
                className="flex-1 h-11 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isSavingEdit ? 'animate-spin' : ''}`}>
                  {isSavingEdit ? 'sync' : 'save'}
                </span>
                {isSavingEdit ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
              </button>
              <button
                type="button"
                onClick={closeEdit}
                className="h-11 px-5 rounded-xl border border-stone-300 text-stone-600 text-xs font-bold hover:bg-stone-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
