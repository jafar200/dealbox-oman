import React, { useState, useRef } from 'react';
import { X, PlusCircle, Store, Coins, Clock, MapPin, Check, Sparkles, Upload, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { StoreBasket, BasketCategory, Wilayah } from '../types';

interface AddBasketModalProps {
  onClose: () => void;
  onAddBasket: (basket: StoreBasket) => void | Promise<void>;
  initialStoreName?: string;
}

const DEFAULT_CATEGORY_IMAGES: Record<BasketCategory, string> = {
  all: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  supermarket: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  restaurant: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  cooked: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  cafe: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  produce: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
};

const SUGGESTED_FOOD_PHOTOS = [
  {
    id: 'croissant',
    title: 'مخبوزات وكرواسون',
    category: 'bakery' as BasketCategory,
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'pastry',
    title: 'فطائر ومعجنات طازجة',
    category: 'bakery' as BasketCategory,
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'meals',
    title: 'وجبات وأطباق مطبوخة',
    category: 'cooked' as BasketCategory,
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sweets',
    title: 'حلويات وكيك ومقاهي',
    category: 'cafe' as BasketCategory,
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fruits',
    title: 'خضار وفواكه المزرعة',
    category: 'produce' as BasketCategory,
    url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'grocery',
    title: 'سلة سوبرماركت منوعة',
    category: 'supermarket' as BasketCategory,
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  },
];

export const AddBasketModal: React.FC<AddBasketModalProps> = ({ onClose, onAddBasket, initialStoreName }) => {
  const [storeName, setStoreName] = useState(initialStoreName || 'مخبز مسقط النور - فرع الخوض');
  const [storeLogo, setStoreLogo] = useState('🥖');
  const [category, setCategory] = useState<BasketCategory>('bakery');
  const [wilayah, setWilayah] = useState<Wilayah>('السيب');
  const [area, setArea] = useState('الخوض');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedItemsStr, setExpectedItemsStr] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number>(4.500);
  const [discountedPrice, setDiscountedPrice] = useState<number>(1.500);
  const [remainingBaskets, setRemainingBaskets] = useState<number>(5);
  const [pickupStart, setPickupStart] = useState('20:30');
  const [pickupEnd, setPickupEnd] = useState('22:00');
  const [phone, setPhone] = useState('+968 9123 4567');
  const [addressDetails, setAddressDetails] = useState('شارع مزون التجاري، الخوض');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [basketImage, setBasketImage] = useState<string>(DEFAULT_CATEGORY_IMAGES.bakery);
  const [isCustomImageUploaded, setIsCustomImageUploaded] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const emojis = ['🥖', '🛒', '🍽️', '☕', '🥑', '🍯', '🍕', '🍰', '🥐', '🥗'];

  const handleCategorySelect = (newCategory: BasketCategory) => {
    setCategory(newCategory);
    if (!isCustomImageUploaded) {
      setBasketImage(DEFAULT_CATEGORY_IMAGES[newCategory] || DEFAULT_CATEGORY_IMAGES.all);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، الحد الأقصى المسموح 5 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setBasketImage(result);
        setIsCustomImageUploaded(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleResetImage = () => {
    setBasketImage(DEFAULT_CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGES.all);
    setIsCustomImageUploaded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName || !title || !description) {
      alert('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    const categoryNames: Record<BasketCategory, string> = {
      all: 'عام',
      bakery: 'مخبوزات ومعجنات',
      supermarket: 'سوبرماركت وأغذية',
      restaurant: 'مطاعم وبوفيهات',
      cooked: 'وجبات مطبوخة',
      cafe: 'مقاهي وحلويات',
      produce: 'خضار وفواكه مزارع',
    };

    const newBasket: StoreBasket = {
      id: `bsk-user-${Date.now()}`,
      storeName,
      storeLogo,
      category,
      categoryNameAr: categoryNames[category],
      wilayah,
      area: area || wilayah,
      title,
      description,
      expectedItems: expectedItemsStr 
        ? expectedItemsStr.split(',').map((s) => s.trim()) 
        : ['مأكولات ومخبوزات طازجة متنوعة'],
      originalPrice: Number(originalPrice),
      discountedPrice: Number(discountedPrice),
      remainingBaskets: Number(remainingBaskets),
      pickupStart,
      pickupEnd,
      pickupDate: 'اليوم',
      rating: 5.0,
      reviewCount: 1,
      distanceKm: 2.5,
      coordinates: wilayah === 'صلالة' 
        ? [17.0512, 54.1481] 
        : wilayah === 'صحار' 
        ? [24.3644, 56.7468] 
        : [23.6000, 58.3500],
      badge: 'جديد اليوم',
      verifiedStore: true,
      phone: phone || '+968 2400 0000',
      addressDetails: addressDetails || `${wilayah} - ${area}`,
      imageUrl: basketImage,
    };

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onAddBasket(newBasket);
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'تعذر حفظ الحقيبة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="add-basket-modal"
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl">
              🏪
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                بوابة المتاجر: إضافة سلة فائضة جديدة
              </h3>
              <p className="text-xs text-stone-300">
                أنقذ طعام متجرك من الهدر وشاركه مع المجتمع بأسعار مخفضة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h4 className="text-xl font-bold text-stone-900">
              تم إدراج سلتك في النظام بنجاح!
            </h4>
            <p className="text-sm text-stone-500">
              أصبحت السلة الآن ظاهرة لجميع المشترين في سلطنة عُمان على القائمة والخريطة الحية.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[65vh]">
            {/* Store Name & Emoji Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم المنشأة / المتجر / المخبز *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="مثال: مخبز الأصالة العُماني"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الأيقونة الممثلة
                </label>
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {emojis.slice(0, 5).map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setStoreLogo(em)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                        storeLogo === em ? 'border-emerald-600 bg-emerald-50 scale-105' : 'border-stone-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category & Wilayah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  تصنيف المتجر *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategorySelect(e.target.value as BasketCategory)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                >
                  <option value="bakery">مخبوزات ومعجنات</option>
                  <option value="supermarket">سوبرماركت ومواد غذائية</option>
                  <option value="restaurant">مطاعم ووجبات جاهزة</option>
                  <option value="cafe">مقاهي وحلويات</option>
                  <option value="produce">خضار وفواكه مزارع</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الولاية / المحافظة *
                </label>
                <select
                  value={wilayah}
                  onChange={(e) => setWilayah(e.target.value as Wilayah)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                >
                  <option value="السيب">السيب</option>
                  <option value="بوشر">بوشر</option>
                  <option value="مطرح">مطرح</option>
                  <option value="العامرات">العامرات</option>
                  <option value="بركاء">بركاء</option>
                  <option value="صحار">صحار</option>
                  <option value="صلالة">صلالة</option>
                  <option value="نزوى">نزوى</option>
                </select>
              </div>
            </div>

            {/* Basket Title */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                عنوان السلة المعروضة *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: سلة المخبوزات والكرواسون اليومية الفائضة"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Basket Photo Upload & Selector */}
            <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>صورة السلة الفائضة (Basket Photo) *</span>
                </label>

                {isCustomImageUploaded && (
                  <button
                    type="button"
                    onClick={handleResetImage}
                    className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-700 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الصورة المقترحة</span>
                  </button>
                )}
              </div>

              {/* Photo Preview & Upload Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Visual Card Preview */}
                <div className="relative aspect-4/3 sm:aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs group">
                  <img
                    src={basketImage}
                    alt="معاينة السلة"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    معاينة حية
                  </div>
                  {originalPrice > discountedPrice && (
                    <div className="absolute bottom-2 left-2 bg-[#006948] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      خصم {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}%
                    </div>
                  )}
                </div>

                {/* Upload Action Area */}
                <div className="sm:col-span-2 flex flex-col justify-between gap-2.5">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(true);
                    }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isDraggingPhoto
                        ? 'border-emerald-600 bg-emerald-50/60 scale-[0.99]'
                        : 'border-stone-300 hover:border-emerald-600 bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-stone-800">
                      اسحب وأفلت صورة السلة هنا، أو{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-emerald-700 hover:underline font-extrabold cursor-pointer"
                      >
                        التقط / اختر صورة
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400">
                      PNG أو JPG أو WebP من كاميرا الهاتف أو جهازك (حتى 5MB)
                    </p>
                  </div>

                  {/* Button to trigger file picker */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isCustomImageUploaded ? 'تغيير الصورة المرفوعة' : 'رفع صورة من الكاميرا أو المعرض'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Preset Photos */}
              <div className="pt-2 border-t border-stone-200/70">
                <div className="text-[11px] font-bold text-stone-600 mb-2">
                  أو اختر صورة جاهزة عالية الجودة تناسب محتويات السلة:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {SUGGESTED_FOOD_PHOTOS.map((photo) => {
                    const isSelected = basketImage === photo.url;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => {
                          setBasketImage(photo.url);
                          setIsCustomImageUploaded(true);
                        }}
                        className={`group relative rounded-lg overflow-hidden border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-emerald-600 border-emerald-600 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 opacity-80 hover:opacity-100'
                        }`}
                        title={photo.title}
                      >
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-12 object-cover"
                        />
                        <div className="p-1 bg-white text-[9px] font-bold text-stone-700 truncate text-center">
                          {photo.title.split(' ')[0]}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-emerald-700 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px]">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description & Expected items */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                وصف السلة والمحتويات المحتملة *
              </label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="صف جودة وطزاجة المأكولات وحالتها..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Prices in OMR & Stock */}
            <div className="grid grid-cols-3 gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  السعر الأصلي (ر.ع.)
                </label>
                <input
                  type="number"
                  step="0.100"
                  min="0.500"
                  required
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  سعر السلة المخفض (ر.ع.)
                </label>
                <input
                  type="number"
                  step="0.100"
                  min="0.200"
                  required
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-emerald-400 text-emerald-800 rounded-xl text-sm font-mono font-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  عدد السلال المتاحة
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={remainingBaskets}
                  onChange={(e) => setRemainingBaskets(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm font-mono font-bold"
                />
              </div>
            </div>

            {/* Pickup Windows */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  وقت بدء الاستلام (مثال: 20:30)
                </label>
                <input
                  type="text"
                  required
                  value={pickupStart}
                  onChange={(e) => setPickupStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  وقت انتهاء الاستلام (مثال: 22:30)
                </label>
                <input
                  type="text"
                  required
                  value={pickupEnd}
                  onChange={(e) => setPickupEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            {/* Address Details & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  عنوان الفرع بالتفصيل
                </label>
                <input
                  type="text"
                  value={addressDetails}
                  onChange={(e) => setAddressDetails(e.target.value)}
                  placeholder="مثال: الخوض السابعة، مقابل جامع الكوثر"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  رقم الهاتف للتواصل والاستفسار
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+968 9xxx xxxx"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{submitError}</p>}

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:cursor-wait disabled:opacity-60"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'جارٍ حفظ الحقيبة...' : 'نشر السلة في النظام فوراً'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
