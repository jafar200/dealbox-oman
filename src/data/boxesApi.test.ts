import { describe, expect, it } from "vitest";
import { mapApiBoxToDealBoxItem, type ApiBox } from "./boxesApi";

const baseBox: ApiBox = {
  id: "6ac36b1908fff993731473c9",
  storeId: "6ac36b1908fff993731473c1",
  storeName: "مخبز مسقط النور - الخوض",
  storeLogoUrl: "https://example.com/logo.png",
  phone: "+968 2454 1122",
  address: "شارع مزون التجاري، الخوض",
  rating: 4.7,
  wilayah: "السيب",
  area: "الخوض",
  category: "bakery",
  title: "صندوق المخبوزات الطازجة",
  description: "فائض صباحي طازج",
  imageUrl: "https://example.com/box.jpg",
  expectedItems: ["خبز صمون"],
  originalPrice: 4.5,
  discountedPrice: 1.5,
  currency: "ر.ع",
  remainingCount: 4,
  pickupWindow: "20:00 - 21:30",
  pickupDate: "اليوم",
  distanceKm: 0.85,
  coordinates: [23.6185, 58.1995],
  createdAt: "2026-10-05T10:00:00.000Z",
};

describe("mapApiBoxToDealBoxItem", () => {
  it("يحول حقول الـ API إلى شكل DealBoxItem المتوقع في الواجهة", () => {
    const item = mapApiBoxToDealBoxItem(baseBox);

    expect(item.id).toBe(baseBox.id);
    expect(item.storeId).toBe(baseBox.storeId);
    expect(item.title).toBe(baseBox.title);
    expect(item.originalPrice).toBe(4.5);
    expect(item.discountedPrice).toBe(1.5);
    expect(item.currency).toBe("ر.ع");
    expect(item.category).toBe("bakery");
    expect(item.verifiedStore).toBe(true);
    expect(item.coordinates).toEqual([23.6185, 58.1995]);
  });

  it("يبني نصوص المسافة بشكل صحيح للكيلومتر والمتر", () => {
    expect(mapApiBoxToDealBoxItem(baseBox).distanceText).toContain("850 م");
    expect(mapApiBoxToDealBoxItem({ ...baseBox, distanceKm: 3.4 }).distanceText).toContain("3.4 كم");
  });

  it("يبني نص الكمية المتبقية حسب العدد", () => {
    expect(mapApiBoxToDealBoxItem({ ...baseBox, remainingCount: 0 }).remainingText).toBe(
      "نفدت الكمية"
    );
    expect(mapApiBoxToDealBoxItem({ ...baseBox, remainingCount: 1 }).remainingText).toBe(
      "باقي صندوق واحد"
    );
    expect(mapApiBoxToDealBoxItem({ ...baseBox, remainingCount: 2 }).remainingText).toBe(
      "باقي صندوقين"
    );
    expect(mapApiBoxToDealBoxItem({ ...baseBox, remainingCount: 7 }).remainingText).toBe(
      "باقي 7 صناديق"
    );
  });

  it("يوفر قيم افتراضية عند غياب الحقول الاختيارية", () => {
    const minimal: ApiBox = {
      ...baseBox,
      storeLogoUrl: undefined,
      imageUrl: undefined,
      expectedItems: undefined,
      area: undefined,
      wilayah: undefined,
      address: undefined,
      phone: undefined,
      coordinates: undefined,
      currency: undefined,
      pickupDate: undefined,
    };

    const item = mapApiBoxToDealBoxItem(minimal);

    expect(item.imageUrl).toMatch(/^https?:\/\//);
    expect(item.expectedItems).toEqual([]);
    expect(item.locationArea).toBe("سلطنة عُمان");
    expect(item.currency).toBe("ر.ع");
    expect(item.coordinates).toEqual([23.6139, 58.1963]);
    expect(item.pickupTimeText).toContain("20:00 - 21:30");
  });

  it("يجمع المنطقة والولاية في نص الموقع", () => {
    const item = mapApiBoxToDealBoxItem(baseBox);
    expect(item.locationArea).toBe("الخوض، السيب");
  });
});
