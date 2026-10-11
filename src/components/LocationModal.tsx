import React, { useState } from 'react';

interface LocationModalProps {
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  currentLocation,
  onSelectLocation,
  onClose,
}) => {
  const [detectMessage, setDetectMessage] = useState('');
  const [detecting, setDetecting] = useState(false);

  const locations = [
    { name: 'الخوض، السيب', desc: 'ضمن نطاق 2 كم · محافظة مسقط', lat: 23.6139, lng: 58.1963 },
    { name: 'الموالح، السيب', desc: 'ضمن نطاق 3 كم · محافظة مسقط', lat: 23.62, lng: 58.21 },
    { name: 'الحيل الجنوبية، السيب', desc: 'ضمن نطاق 3.5 كم · محافظة مسقط', lat: 23.61, lng: 58.185 },
    { name: 'الغبرة الشمالية، بوشر', desc: 'ضمن نطاق 5 كم · محافظة مسقط', lat: 23.607, lng: 58.21 },
    { name: 'شاطئ القرم، مطرح', desc: 'ضمن نطاق 7 كم · محافظة مسقط', lat: 23.61, lng: 58.223 },
    { name: 'المعبيلة، السيب', desc: 'ضمن نطاق 8 كم · محافظة مسقط', lat: 23.597, lng: 58.205 },
    { name: 'العامرات، مسقط', desc: 'ضمن نطاق 12 كم · محافظة مسقط', lat: 23.617, lng: 58.214 },
    { name: 'صحار، شمال الباطنة', desc: 'سلطنة عُمان', lat: 24.35, lng: 56.75 },
    { name: 'نزوى، الداخلية', desc: 'سلطنة عُمان', lat: 22.93, lng: 57.53 },
    { name: 'صلالة، ظفار', desc: 'سلطنة عُمان', lat: 17.02, lng: 54.09 },
  ];

  // إيجاد أقرب منطقة معروفة إحداثياتها قريبة من موقع المستخدم المكتشف
  const nearestLocation = (lat: number, lng: number) => {
    let best = locations[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const loc of locations) {
      const dLat = (loc.lat - lat) * 111;
      const dLng = (loc.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
      const d = dLat * dLat + dLng * dLng;
      if (d < bestDist) {
        bestDist = d;
        best = loc;
      }
    }
    return best;
  };

  const detectLocation = () => {
    if (detecting) return;
    setDetectMessage('');
    if (!navigator.geolocation) {
      setDetectMessage('متصفحك لا يدعم تحديد الموقع الجغرافي.');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = nearestLocation(latitude, longitude);
        onSelectLocation(nearest.name);
        setDetectMessage(`تم تحديد موقعك مباشرةً → ${nearest.name}`);
        setDetecting(false);
        setTimeout(() => onClose(), 1200);
      },
      (err) => {
        setDetecting(false);
        setDetectMessage(err.code === 1 ? 'سمح بوصول الموقع من إعدادات المتصفح ثم أعد المحاولة.' : 'تعذر تحديد الموقع حالياً، حاول مجدداً.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#bccac0]/30 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">
              my_location
            </span>
            <h3 className="font-bold text-base text-[#131b2e]">
              تحديد موقعك بسلطنة عُمان
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#006948] px-4 py-3 text-sm font-black text-white transition hover:bg-[#005d3f] disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[20px]">my_location</span>
          {detecting ? 'جارٍ تحديد موقعك...' : 'تحديد موقعي مباشرة'}
        </button>

        {detectMessage && (
          <p
            className={`mt-2 rounded-lg p-2 text-xs font-bold ${detectMessage.includes('تعذر') || detectMessage.includes('لا يدعم') || detectMessage.includes('سمح') ? 'text-red-600' : 'text-[#006948]'}`}
          >
            {detectMessage}
          </p>
        )}

        <div className="py-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
          {locations.map((loc) => {
            const isSelected = currentLocation === loc.name;
            return (
              <button
                key={loc.name}
                onClick={() => {
                  onSelectLocation(loc.name);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-right transition-all ${
                  isSelected
                    ? 'bg-[#f2f3ff] text-[#006948] font-bold border border-[#006948]/30'
                    : 'hover:bg-stone-50 text-[#131b2e]'
                }`}
              >
                <div>
                  <div className="text-[13px]">{loc.name}</div>
                  <div className="text-[11px] text-[#3d4a42] font-normal">{loc.desc}</div>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-[#006948] text-[18px]">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
