import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Box from '../models/Box.js';
import Store from '../models/Store.js';
import StoreStory from '../models/StoreStory.js';
import User from '../models/User.js';

const email = 'qa-story-ui@example.invalid';
const password = 'qa-story-ui-password-123';
const commercialNumber = 'CR-QA-STORY-UI';
const imageData = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80';
const storeLogoUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd_613A13snlgMbl0HxUuzGWg_vdTQjRwxPqvW_McuEAKGQ_ETMpLbdmO2RteBDqOXQ-4Ax3XuN1b5H4dcq0s9_BwZTRk7BMzYmkLQbxaXpH84JhL7DdJSHiaND_6mdrL2qZ1bMWchg_vFIN3IVwGVKo1VaCSntmmLkgT_7isHoWGxtUX1QpJI6KRrf5N45YO-AVFrtDO410tN3Vyplv4dEV3SaFzXqPDlih8lZrpBj3CHSTVubnGF-w';
const HOME_STORY_REFERENCE = 'QA-HOME-UI';

await mongoose.connect('mongodb://127.0.0.1:27017/dealbox_oman');
const oldStore = await Store.findOne({ crNumber: commercialNumber });
if (oldStore) {
  await StoreStory.deleteMany({ storeId: oldStore.id });
  await Box.deleteMany({ storeId: oldStore.id });
  await Store.deleteOne({ _id: oldStore.id });
}
await User.deleteOne({ email });
const store = await Store.create({
  name: 'متجر اختبار القصص',
  crNumber: commercialNumber,
  category: 'bakery',
  wilayah: 'السيب',
  area: 'الخوض',
  address: 'عنوان اختبار',
  phone: '+968 90001234',
  logoUrl: storeLogoUrl,
  status: 'active',
});
await User.create({
  name: 'عميل اختبار القصص',
  email,
  password: await bcrypt.hash(password, 10),
  role: 'client',
  active: true,
});
await StoreStory.create({
  storeId: store.id,
  imageData,
  caption: 'قصة اختبارية معتمدة',
  feeOmr: 0.25,
  paymentStatus: 'confirmed',
  paymentReference: 'QA-UI-REF',
  reviewStatus: 'approved',
  paidAt: new Date(),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
});
await Box.create({
  storeId: store.id,
  title: 'حقيبة اختبار المتجر',
  description: 'حقيبة ظاهرة من خلال القصة المعتمدة',
  category: 'bakery',
  imageUrl: imageData,
  expectedItems: ['مخبوزات اختبارية'],
  originalPrice: 2,
  discountedPrice: 1,
  remainingCount: 2,
  pickupStart: '20:00',
  pickupEnd: '21:00',
  active: true,
});

// -------------------------------------------------------------------------
// قصص معتمدة لواجهة الصفحة الرئيسية (تجاهل `npm run db:seed:story-qa`)
// تُحدَّث تواريخ الانتهاء عند كل تشغيل حتى يبقى قسم "عروض المتاجر الحصرية"
// معروضاً في التطبيق.
// -------------------------------------------------------------------------
await StoreStory.deleteMany({ paymentReference: HOME_STORY_REFERENCE });

const homeStories = [
  { caption: 'فطائر وخبز طازج يخرج من الفرن كل صباح', expiresInDays: 6 },
  { caption: 'خضار وفواكه من مزارع عُمان تصل يومياً', expiresInDays: 4 },
  { caption: 'وجبات منزلية جاهزة للاستلام دون هدر', expiresInDays: 3 },
  { caption: 'قهوة مختصة وحلويات تُحضَّر عند الطلب', expiresInDays: 1 },
];

const demoStores = await Store.find({
  status: 'active',
  logoUrl: { $exists: true, $ne: '' },
})
  .sort({ createdAt: 1 })
  .limit(homeStories.length);

for (const [index, demoStore] of demoStores.entries()) {
  const box = await Box.findOne({ storeId: demoStore.id, active: true })
    .sort({ createdAt: -1 })
    .lean();

  await StoreStory.create({
    storeId: demoStore.id,
    imageData: box?.imageUrl || imageData,
    caption: homeStories[index].caption,
    feeOmr: 0.25,
    paymentStatus: 'confirmed',
    paymentReference: HOME_STORY_REFERENCE,
    reviewStatus: 'approved',
    paidAt: new Date(),
    expiresAt: new Date(Date.now() + homeStories[index].expiresInDays * 24 * 60 * 60 * 1000),
  });
}

console.log(`QA story UI fixture prepared (${demoStores.length} public stories)`);
await mongoose.disconnect();
