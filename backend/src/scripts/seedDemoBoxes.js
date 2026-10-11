import mongoose from 'mongoose';
import Box from '../models/Box.js';
import Store from '../models/Store.js';

/**
 * Seed demo stores + boxes for the client feed (GET /api/v1/client/boxes).
 * Idempotent: upserts by commercial registration number (crNumber).
 * Run with: npm --prefix backend run db:seed
 */

// المسافات محسوبة من نقطة الخوض (23.6139, 58.1963) وتبقى ضمن فلتر 3 كم الافتراضي
const demoEntries = [
  {
    store: {
      name: 'مخبز مسقط النور - الخوض',
      crNumber: 'DEMO-CR-1001',
      category: 'bakery',
      wilayah: 'السيب',
      area: 'الخوض',
      address: 'شارع مزون التجاري، الخوض، ولاية السيب، محافظة مسقط',
      phone: '+968 2454 1122',
      coordinates: { lat: 23.6185, lng: 58.1995 },
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd_613A13snlgMbl0HxUuzGWg_vdTQjRwxPqvW_McuEAKGQ_ETMpLbdmO2RteBDqOXQ-4Ax3XuN1b5H4dcq0s9_BwZTRk7BMzYmkLQbxaXpH84JhL7DdJSHiaND_6mdrL2qZ1bMWchg_vFIN3IVwGVKo1VaCSntmmLkgT_7isHoWGxtUX1QpJI6KRrf5N45YO-AVFrtDO410tN3Vyplv4dEV3SaFzXqPDlih8lZrpBj3CHSTVubnGF-w',
      status: 'active',
    },
    box: {
      title: 'صندوق المخبوزات الطازجة',
      description: 'فائض صباحي طازج: كرواسون بالزبدة، خبز صمون، باجيت فرنسي، ودونات هشة.',
      category: 'bakery',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAI5aiEBU-E5o-QmNZGMQ2KKZ0OwW95dvh_5OtNLwYvGGV2TKk33WfhKEVUMNozQMCfhWK_foPGZEe4KkBrz6RmmtAAyI2HDBiB3xunz_scYoo8Q6HbuF3NqtM_LAEvR318IzU6qpSQKHFckO_pYdiRlq7LldGGnqiUqzpBGBwvEHzaOQxft8wvaFUOTXAkUK8e65ow82Ye8QSJ3P3PtRFMhWcj4xjNGsmLsnhE4IOHIlQrc_q895K14g',
      expectedItems: ['خبز باجيت فرنسي طازج', '٣ قطع كرواسون بالزبدة والجبن', 'فطائر زعتر ومخبوزات هشة', 'دونات بالسكر والسمسم'],
      originalPrice: 4.5,
      discountedPrice: 1.5,
      remainingCount: 4,
      pickupStart: '20:00',
      pickupEnd: '21:30',
      pickupDate: 'اليوم',
      active: true,
    },
  },
  {
    store: {
      name: 'أسواق البركة العُمانية',
      crNumber: 'DEMO-CR-1002',
      category: 'produce',
      wilayah: 'السيب',
      area: 'الحيل الجنوبية',
      address: 'شارع البركات، الحيل الجنوبية، ولاية السيب، مسقط',
      phone: '+968 2454 3344',
      coordinates: { lat: 23.62, lng: 58.205 },
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmyWzO0F4QC-0W9cR3LXaNVQUs45PvOTlu1njB-cxfK0oWLJJ2Na-Qx3uEhhN48dgCLp_JIrtrSyibGVNP4p1j_otn_7qMc-7UaENfUJhpL8QL5QrKxZMTkZOOdhSg4AVCd0qBa6peaYcALZxSINs1C6aP7omO454FUJjwPINfAoJvzCrhne8Nk_7rhPVj16XrVDscrF4jhoBbRutxw8gFc2PCl_C3_TAXJ1EbqWGg0sbyumoZsnd7mg',
      status: 'active',
    },
    box: {
      title: 'صندوق الخضار وفواكه المزارع',
      description: 'فواكه وخضار منتقاة بعناية من مزارع الباطنة العمانية.',
      category: 'produce',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhTkkH9dhO2SfRBBvfNKZWCxpzriwtgAzh0KKQZNJPQje1MeuIbhcuNcEVmePCl1iSCdO-fEHffIzGPI28_gQl88bTiSuXtTnyIh6G2monZWmPgmyAzorA7Wq52E6ScZ9zukq6S45Cpa_ar9yIFRzscYXVENnxDW2kxCTWVYjUSq_xorffEG6PtESCinlGYsOuav6Z9t6CK71A5Fi9AayFmy_8fi6UAw1GFKEYGciBLlsEbPxFpZwdEQ',
      expectedItems: ['٢ كجم تفاح وبرتقال موسمي', '١.٥ كجم طماطم وخيار طازج', 'خضروات ورقية مبردة', 'بروكلي وجزر محلي'],
      originalPrice: 5.2,
      discountedPrice: 1.8,
      remainingCount: 2,
      pickupStart: '18:00',
      pickupEnd: '22:00',
      pickupDate: 'اليوم',
      active: true,
    },
  },
  {
    store: {
      name: 'مطابخ الضيافة العُمانية',
      crNumber: 'DEMO-CR-1003',
      category: 'cooked',
      wilayah: 'السيب',
      area: 'الغبرة الشمالية',
      address: 'شارع 18 نوفمبر، الغبرة الشمالية، ولاية السيب، مسقط',
      phone: '+968 2461 5566',
      coordinates: { lat: 23.6235, lng: 58.21 },
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXNrT4I7WhJIxXOl5U_WRiC-P7X3QZGooGWCH5xoDcmybkGxB9ydP5BwoTD2N2RLFnn8KTn3MubJfTNIN2dxBQsU2D59D9HbWyGSwPw6NRcoScNmliAhJaQbKz7zpzwUJJ2abOEsSZIa_yXzJM8JL8SNejYixNL8BkumW44yhnj5vMjuX53CeVq1YT7PecFOy0ibj7q_qp-apmIqTqc3UWZaK0TVwTDGNBhfZ6PQFcQ-EO5i3R6ziHTQ',
      status: 'active',
    },
    box: {
      title: 'وجبات عائلية عمانية جاهزة',
      description: 'كبسة دجاج مع أرز بسمتي بالزعفران ومقبلات وخبز عماني ساخن.',
      category: 'cooked',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR0PWqjtX5zq418X_sgqmHH8sBxOVsptzZRqZsP-laHXZEYlibx6zdsjyk026VzBVXcpvmMlSELqxqN2SyBAPVw9gBudk9vCEDBXdWa_ntUgt28eVF8_meNkd8XV6fRwdukS7nglF0aL8naGv690okarz-R7rn5AHBzEiSxBVzNn9jpUuB10bExnEh3NHEWI8sovG3HtjgUVDaYmEGXmLSlIyvLqG4KfxjjvhYIAV7P3awfKgoQZXOuA',
      expectedItems: ['وجبتين كبسة دجاج عمانية مع أرز بالزعفران', 'تشكيلة مقبلات وسلطة خضراء', 'شوربة عدس دافئة مغلفة', 'خبز عماني وصوصات طازجة'],
      originalPrice: 6.8,
      discountedPrice: 2.3,
      remainingCount: 7,
      pickupStart: '21:00',
      pickupEnd: '22:30',
      pickupDate: 'اليوم',
      active: true,
    },
  },
  {
    store: {
      name: 'مقهى الركن - القرم',
      crNumber: 'DEMO-CR-1004',
      category: 'cafe',
      wilayah: 'مطرح',
      area: 'شاطئ القرم',
      address: 'واجهة شاطئ القرم، بالقرب من دار الأوبرا السلطانية، مسقط',
      phone: '+968 2469 8899',
      coordinates: { lat: 23.61, lng: 58.223 },
      logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKSVFV1e2L42cOhFK6Sung1nA8-Wbu_XggWcPZkqnnUw-2OSCI-rvMXjM-u_EuWVWTAyOMfzCAdU5Td8fF0fJWYeqxFZTFVe749tscwxuJYsa6OxhXTkBAdZY3N-EPzzEOx49etwkE0hTA63yJZQmPAq1k4XZvy4SisBF57hV9oV6aUjUaYQsv0L9x3KZa5-BnWH7XtBoQrjpDfIJSsJZg7kti2MG4AQqQ7Pis6w3v39panpGh7KgFIw',
      status: 'active',
    },
    box: {
      title: 'صندوق الحلى والمخبوزات الفرنسية',
      description: 'حلى ومخبوزات فرنسية متبقية من وردية بعد الظهيرة.',
      category: 'cafe',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      expectedItems: ['قطعتين كيك وتارت فواكه طازجة', 'كوكيز برقائق الشوكولاتة', 'مافن فانيلا وتوت أزرق', 'ساندوتش حلوم بالرياحين'],
      originalPrice: 4.2,
      discountedPrice: 1.4,
      remainingCount: 3,
      pickupStart: '19:30',
      pickupEnd: '21:00',
      pickupDate: 'اليوم',
      active: true,
    },
  },
];

const seedDemoBoxes = async () => {
  let createdStores = 0;
  let createdBoxes = 0;
  let refreshedStores = 0;
  let refreshedBoxes = 0;

  for (const entry of demoEntries) {
    const existingStore = await Store.findOne({ crNumber: entry.store.crNumber });
    let store;
    if (existingStore) {
      // Refresh the demo content so re-running repairs stale photos/logos.
      store = await Store.findByIdAndUpdate(
        existingStore._id,
        { $set: entry.store },
        { new: true, runValidators: true },
      );
      refreshedStores += 1;
    } else {
      store = await Store.create(entry.store);
      createdStores += 1;
    }

    const existingBox = await Box.findOne({ storeId: store._id, title: entry.box.title });
    if (existingBox) {
      await Box.findByIdAndUpdate(
        existingBox._id,
        { $set: { ...entry.box, storeId: store._id } },
        { new: true, runValidators: true },
      );
      refreshedBoxes += 1;
    } else {
      await Box.create({ ...entry.box, storeId: store._id });
      createdBoxes += 1;
    }
  }

  console.log(
    `تم تجهيز بيانات تجريبية: ${createdStores} متجر جديد، ${createdBoxes} صندوق جديد، `
    + `${refreshedStores} متجر تم تحديثه، ${refreshedBoxes} صندوق تم تحديثه`,
  );
};

try {
  await mongoose.connect('mongodb://127.0.0.1:27017/dealbox_oman');
  await seedDemoBoxes();
} catch (error) {
  console.error('فشل تجهيز البيانات التجريبية:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
