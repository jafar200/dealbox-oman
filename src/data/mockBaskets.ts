import { DealBoxItem, StoreStory } from '../types';

/**
 * Fallback brand mark used until the admin uploads a real logo
 * (admin dashboard -> logo upload). It is an inline SVG so the header never
 * depends on a remote host — the previous Google URL returned 403 and
 * rendered as a broken image on every portal.
 */
export const DEALBOX_LOGO_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiMwMDY5NDgiLz48cGF0aCBkPSJNMTUgMjdoMzR2MTlhNSA1IDAgMCAxLTUgNUgyMGE1IDUgMCAwIDEtNS01VjI3WiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0xMyAyNyAzMiAxM2wxOSAxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjQuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTMyIDM0YzUgMCA5IDMgOSA3LjVTMzcgNDkgMzIgNDlzLTktMy05LTcuNVMyNyAzNCAzMiAzNFoiIGZpbGw9IiMwMDY5NDgiIG9wYWNpdHk9Ii4yMiIvPjwvc3ZnPg==';

export const STORE_STORIES: StoreStory[] = [
  {
    id: 'st-1',
    name: 'مخبز مسقط النور',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd_613A13snlgMbl0HxUuzGWg_vdTQjRwxPqvW_McuEAKGQ_ETMpLbdmO2RteBDqOXQ-4Ax3XuN1b5H4dcq0s9_BwZTRk7BMzYmkLQbxaXpH84JhL7DdJSHiaND_6mdrL2qZ1bMWchg_vFIN3IVwGVKo1VaCSntmmLkgT_7isHoWGxtUX1QpJI6KRrf5N45YO-AVFrtDO410tN3Vyplv4dEV3SaFzXqPDlih8lZrpBj3CHSTVubnGF-w',
    active: true,
    boxCount: 4,
    category: 'bakery'
  },
  {
    id: 'st-2',
    name: 'أسواق البركة',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmyWzO0F4QC-0W9cR3LXaNVQUs45PvOTlu1njB-cxfK0oWLJJ2Na-Qx3uEhhN48dgCLp_JIrtrSyibGVNP4p1j_otn_7qMc-7UaENfUJhpL8QL5QrKxZMTkZOOdhSg4AVCd0qBa6peaYcALZxSINs1C6aP7omO454FUJjwPINfAoJvzCrhne8Nk_7rhPVj16XrVDscrF4jhoBbRutxw8gFc2PCl_C3_TAXJ1EbqWGg0sbyumoZsnd7mg',
    active: false,
    boxCount: 2,
    category: 'produce'
  },
  {
    id: 'st-3',
    name: 'مطابخ الضيافة',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXNrT4I7WhJIxXOl5U_WRiC-P7X3QZGooGWCH5xoDcmybkGxB9ydP5BwoTD2N2RLFnn8KTn3MubJfTNIN2dxBQsU2D59D9HbWyGSwPw6NRcoScNmliAhJaQbKz7zpzwUJJ2abOEsSZIa_yXzJM8JL8SNejYixNL8BkumW44yhnj5vMjuX53CeVq1YT7PecFOy0ibj7q_qp-apmIqTqc3UWZaK0TVwTDGNBhfZ6PQFcQ-EO5i3R6ziHTQ',
    active: false,
    boxCount: 7,
    category: 'cooked'
  },
  {
    id: 'st-4',
    name: 'مقهى الركن',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKSVFV1e2L42cOhFK6Sung1nA8-Wbu_XggWcPZkqnnUw-2OSCI-rvMXjM-u_EuWVWTAyOMfzCAdU5Td8fF0fJWYeqxFZTFVe749tscwxuJYsa6OxhXTkBAdZY3N-EPzzEOx49etwkE0hTA63yJZQmPAq1k4XZvy4SisBF57hV9oV6aUjUaYQsv0L9x3KZa5-BnWH7XtBoQrjpDfIJSsJZg7kti2MG4AQqQ7Pis6w3v39panpGh7KgFIw',
    active: false,
    boxCount: 3,
    category: 'cafe'
  }
];

export const INITIAL_DEAL_BOXES: DealBoxItem[] = [
  {
    id: 'box-1',
    storeName: 'مخبز مسقط النور - الخوض',
    storeLogoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd_613A13snlgMbl0HxUuzGWg_vdTQjRwxPqvW_McuEAKGQ_ETMpLbdmO2RteBDqOXQ-4Ax3XuN1b5H4dcq0s9_BwZTRk7BMzYmkLQbxaXpH84JhL7DdJSHiaND_6mdrL2qZ1bMWchg_vFIN3IVwGVKo1VaCSntmmLkgT_7isHoWGxtUX1QpJI6KRrf5N45YO-AVFrtDO410tN3Vyplv4dEV3SaFzXqPDlih8lZrpBj3CHSTVubnGF-w',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAI5aiEBU-E5o-QmNZGMQ2KKZ0OwW95dvh_5OtNLwYvGGV2TKk33WfhKEVUMNozQMCfhWK_foPGZEe4KkBrz6RmmtAAyI2HDBiB3xunz_scYoo8Q6HbuF3NqtM_LAEvR318IzU6qpSQKHFckO_pYdiRlq7LldGGnqiUqzpBGBwvEHzaOQxft8wvaFUOTXAkUK8e65ow82Ye8QSJ3P3PtRFMhWcj4xjNGsmLsnhE4IOHIlQrc_q895K14g',
    category: 'bakery',
    categoryNameAr: 'مخابز',
    title: 'صندوق المخبوزات الطازجة',
    description: 'تشكيلة فاخرة خُبزت في الصباح ولم تُبع: خبز صمون وريفي، خبز الباغيت الفرنسي، كرواسون بالزبدة والجبن، فطائر ومعجنات طازجة ومحفوظة بمعايير نظافة فائقة.',
    expectedItems: ['خبز باجيت فرنسي طازج', '٣ قطع كرواسون بالزبدة والجبن', 'فطائر زعتر ومخبوزات هشة', 'دونات بالسكر والسمسم'],
    remainingCount: 4,
    remainingText: 'باقي 4 صناديق',
    distanceKm: 0.85,
    distanceText: '850 م · مشي 10 دقائق',
    pickupTimeText: 'اليوم 8:00 - 9:30 م',
    pickupWindow: '20:00 - 21:30',
    originalPrice: 4.5,
    discountedPrice: 1.5,
    currency: 'ر.ع',
    locationArea: 'الخوض، شارع مزون، السيب',
    coordinates: [23.6139, 58.1963],
    phone: '+968 2454 1122',
    addressDetails: 'شارع مزون التجاري، الخوض، ولاية السيب، محافظة مسقط',
    verifiedStore: true
  },
  {
    id: 'box-2',
    storeName: 'أسواق البركة العُمانية',
    storeLogoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmyWzO0F4QC-0W9cR3LXaNVQUs45PvOTlu1njB-cxfK0oWLJJ2Na-Qx3uEhhN48dgCLp_JIrtrSyibGVNP4p1j_otn_7qMc-7UaENfUJhpL8QL5QrKxZMTkZOOdhSg4AVCd0qBa6peaYcALZxSINs1C6aP7omO454FUJjwPINfAoJvzCrhne8Nk_7rhPVj16XrVDscrF4jhoBbRutxw8gFc2PCl_C3_TAXJ1EbqWGg0sbyumoZsnd7mg',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhTkkH9dhO2SfRBBvfNKZWCxpzriwtgAzh0KKQZNJPQje1MeuIbhcuNcEVmePCl1iSCdO-fEHffIzGPI28_gQl88bTiSuXtTnyIh6G2monZWmPgmyAzorA7Wq52E6ScZ9zukq6S45Cpa_ar9yIFRzscYXVENnxDW2kxCTWVYjUSq_xorffEG6PtESCinlGYsOuav6Z9t6CK71A5Fi9AayFmy_8fi6UAw1GFKEYGciBLlsEbPxFpZwdEQ',
    category: 'produce',
    categoryNameAr: 'خضار وفواكه',
    title: 'صندوق الخضار وفواكه المزارع',
    description: 'صندوق خشبي ممتلئ بخيرات مزارع الباطنة والداخلية: تفاح وبرتقال ورمان، جزر وخيار وطماطم نضرة، صالحة وشهية تماماً ومفروزة بعناية اليوم.',
    expectedItems: ['٢ كجم تفاح وبرتقال موسمي', '١.٥ كجم طماطم وخيار طازج', 'خضروات ورقية مبردة', 'بروكلي وجزر محلي'],
    remainingCount: 2,
    remainingText: 'باقي صندوقين',
    distanceKm: 1.4,
    distanceText: '1.4 كم · شارع البركات',
    pickupTimeText: 'اليوم حتى 10:00 م',
    pickupWindow: '18:00 - 22:00',
    originalPrice: 5.2,
    discountedPrice: 1.8,
    currency: 'ر.ع',
    locationArea: 'الحيل الجنوبية، السيب',
    coordinates: [23.6210, 58.2250],
    phone: '+968 2454 3344',
    addressDetails: 'شارع البركات، الحيل الجنوبية، ولاية السيب، مسقط',
    verifiedStore: true
  },
  {
    id: 'box-3',
    storeName: 'مطابخ الضيافة العُمانية',
    storeLogoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXNrT4I7WhJIxXOl5U_WRiC-P7X3QZGooGWCH5xoDcmybkGxB9ydP5BwoTD2N2RLFnn8KTn3MubJfTNIN2dxBQsU2D59D9HbWyGSwPw6NRcoScNmliAhJaQbKz7zpzwUJJ2abOEsSZIa_yXzJM8JL8SNejYixNL8BkumW44yhnj5vMjuX53CeVq1YT7PecFOy0ibj7q_qp-apmIqTqc3UWZaK0TVwTDGNBhfZ6PQFcQ-EO5i3R6ziHTQ',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR0PWqjtX5zq418X_sgqmHH8sBxOVsptzZRqZsP-laHXZEYlibx6zdsjyk026VzBVXcpvmMlSELqxqN2SyBAPVw9gBudk9vCEDBXdWa_ntUgt28eVF8_meNkd8XV6fRwdukS7nglF0aL8naGv690okarz-R7rn5AHBzEiSxBVzNn9jpUuB10bExnEh3NHEWI8sovG3HtjgUVDaYmEGXmLSlIyvLqG4KfxjjvhYIAV7P3awfKgoQZXOuA',
    category: 'cooked',
    categoryNameAr: 'وجبات مطبوخة',
    title: 'وجبات عائلية عمانية جاهزة',
    description: 'أطباق ساخنة ومحكمة الإغلاق معبأة في علب مخصصة لحفظ الحرارة: كبسة دجاج مع أرز بسمتي بالزعفران، مقبلات مشكلة، خضار مشوية، شوربة وخبز عماني طازج محضر بعناية اليوم.',
    expectedItems: ['وجبتين كبسة دجاج عمانية مع أرز بالزعفران', 'تشكيلة مقبلات وسلطة خضراء', 'شوربة عدس دافئة مغلفة', 'خبز عماني وصوصات طازجة'],
    remainingCount: 7,
    remainingText: 'متوفر 7 وجبات',
    distanceKm: 2.1,
    distanceText: '2.1 كم · الغبرة الشمالية',
    pickupTimeText: 'اليوم 9:00 - 10:30 م',
    pickupWindow: '21:00 - 22:30',
    originalPrice: 6.8,
    discountedPrice: 2.3,
    currency: 'ر.ع',
    locationArea: 'شارع 18 نوفمبر، الغبرة الشمالية',
    coordinates: [23.5970, 58.3850],
    phone: '+968 2461 5566',
    addressDetails: 'شارع 18 نوفمبر، الغبرة الشمالية، ولاية بوشر، مسقط',
    verifiedStore: true
  },
  {
    id: 'box-4',
    storeName: 'مقهى الركن - القرم',
    storeLogoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKSVFV1e2L42cOhFK6Sung1nA8-Wbu_XggWcPZkqnnUw-2OSCI-rvMXjM-u_EuWVWTAyOMfzCAdU5Td8fF0fJWYeqxFZTFVe749tscwxuJYsa6OxhXTkBAdZY3N-EPzzEOx49etwkE0hTA63yJZQmPAq1k4XZvy4SisBF57hV9oV6aUjUaYQsv0L9x3KZa5-BnWH7XtBoQrjpDfIJSsJZg7kti2MG4AQqQ7Pis6w3v39panpGh7KgFIw',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAI5aiEBU-E5o-QmNZGMQ2KKZ0OwW95dvh_5OtNLwYvGGV2TKk33WfhKEVUMNozQMCfhWK_foPGZEe4KkBrz6RmmtAAyI2HDBiB3xunz_scYoo8Q6HbuF3NqtM_LAEvR318IzU6qpSQKHFckO_pYdiRlq7LldGGnqiUqzpBGBwvEHzaOQxft8wvaFUOTXAkUK8e65ow82Ye8QSJ3P3PtRFMhWcj4xjNGsmLsnhE4IOHIlQrc_q895K14g',
    category: 'cafe',
    categoryNameAr: 'حلويات ومقاهي',
    title: 'صندوق الحلى والمخبوزات الفرنسية',
    description: 'تشكيلة حلى راقية ومخبوزات فرنسية متبقية من وردية بعد الظهيرة: تارت فواكه، كوكيز بالكراميل والشوكولاتة البلجيكية، مافن التوت وساندوتشات بريوش وحلوم.',
    expectedItems: ['قطعتين كيك وتارت فواكه طازجة', 'كوكيز برقائق الشوكولاتة', 'مافن فانيلا وتوت أزرق', 'ساندوتش حلوم بالرياحين'],
    remainingCount: 3,
    remainingText: 'باقي 3 صناديق',
    distanceKm: 2.8,
    distanceText: '2.8 كم · شاطئ القرم',
    pickupTimeText: 'اليوم 7:30 - 9:00 م',
    pickupWindow: '19:30 - 21:00',
    originalPrice: 4.2,
    discountedPrice: 1.4,
    currency: 'ر.ع',
    locationArea: 'شاطئ القرم، مطرح، مسقط',
    coordinates: [23.6105, 58.4550],
    phone: '+968 2469 8899',
    addressDetails: 'واجهة شاطئ القرم، بالقرب من دار الأوبرا السلطانية، مسقط',
    verifiedStore: true
  }
];
