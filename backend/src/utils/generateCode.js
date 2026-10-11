/**
 * Generate unique customer booking pickup code (e.g. DB-7391)
 */
export const generateBookingCode = () => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `DB-${randomDigits}`;
};

/**
 * Generate unique order number (e.g. ORD-OM-2609-842)
 */
export const generateOrderNumber = () => {
  const stamp = Date.now().toString().slice(-4);
  const rand = Math.floor(100 + Math.random() * 900);
  return `ORD-OM-${stamp}-${rand}`;
};

/**
 * Generate settlement number (e.g. STL-OM-2026-104)
 */
export const generateSettlementNumber = () => {
  const rand = Math.floor(100 + Math.random() * 900);
  return `STL-OM-2026-${rand}`;
};
