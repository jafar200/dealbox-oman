import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DealBoxItem } from '../types';
import { applyLoyalty, useLoyaltyDiscount } from '../data/loyaltyApi';

interface StoresMapViewProps {
  boxes: DealBoxItem[];
  onSelectBox: (box: DealBoxItem) => void;
}

// مفتاح Mapbox من متغيرات البيئة (VITE_MAPBOX_TOKEN) — لا يُحفظ في الكود أبداً.
// للتطوير المحلي: ضعه في ملف `.env` (مستثنى من git). للإنتاج: متغير بيئة في Vercel.
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export const StoresMapView: React.FC<StoresMapViewProps> = ({ boxes, onSelectBox }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const loyaltyPct = useLoyaltyDiscount();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        // Muscat, Oman (Al Khoudh, Seeb). Mapbox يستخدم [lng, lat]
        center: [58.1963, 23.6139],
        zoom: 13,
        attributionControl: false,
        style: 'mapbox://styles/mapbox/streets-v12',
      });

      map.addControl(new mapboxgl.AttributionControl({ compact: true }));
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    boxes.forEach((box) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          background: #006948;
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 4px;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          white-space: nowrap;
          cursor: pointer;
          direction: rtl;
          font-family: 'IBM Plex Sans Arabic', sans-serif;
        ">
          <span>🧺</span>
          <span>${applyLoyalty(box.discountedPrice, loyaltyPct).toFixed(2)} ${box.currency}</span>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([box.coordinates[1], box.coordinates[0]]) // صندوق → [lat, lng] لكن Mapbox → [lng, lat]
        .addTo(map);

      el.addEventListener('click', () => onSelectBox(box));
      markersRef.current.push(marker);
    });

    setTimeout(() => map.resize(), 200);

  }, [boxes, onSelectBox, loyaltyPct]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#131b2e]">
            خريطة المتاجر القريبة
          </h2>
          <p className="text-[12px] text-[#3d4a42]">
            المتاجر المشاركة في مبادرة حفظ النعمة من حولك
          </p>
        </div>
        <span className="text-[11px] text-[#006948] font-semibold bg-[#f2f3ff] px-2.5 py-1 rounded-full">
          {boxes.length} موقع متاح
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-[#bccac0]/30 shadow-xs h-[420px]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        <div className="absolute bottom-3 left-3 right-3 z-20 overflow-x-auto no-scrollbar flex items-center gap-2.5">
          {boxes.map((b) => (
            <div
              key={b.id}
              onClick={() => onSelectBox(b)}
              className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-[#bccac0]/30 shadow-md min-w-[220px] max-w-[240px] shrink-0 cursor-pointer hover:border-[#006948] transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={b.storeLogoUrl}
                  alt={b.storeName}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-[11px] font-bold text-[#131b2e] truncate">
                  {b.storeName}
                </span>
              </div>
              <div className="text-[12px] font-semibold text-[#131b2e] truncate">
                {b.title}
              </div>
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-100 text-[11px]">
                <span className="text-[#006948] font-bold font-mono">
                  {applyLoyalty(b.discountedPrice, loyaltyPct).toFixed(2)} {b.currency}
                </span>
                <span className="text-stone-400">
                  {b.distanceText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};