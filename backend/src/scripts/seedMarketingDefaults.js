import { MarketingContent } from '../models/MarketingContent.js';
import { DEFAULT_MARKETING_CONTENT } from '../controllers/marketingController.js';
import { connectDB } from '../config/db.js';

/**
 * بذر المحتوى التسويقي الافتراضي (idempotent).
 * يُنشئ وثيقة «marketing» فقط عند غيابها — لا يمسّ تعديلات الآدمن الحالية.
 */
const seed = async () => {
  await connectDB();
  const existing = await MarketingContent.findOne({ key: 'marketing' });
  if (existing) {
    console.log('[Marketing] المحتوى التسويقي موجود مسبقاً — لم يُعد البذر');
    process.exit(0);
  }
  const { key, ...content } = DEFAULT_MARKETING_CONTENT;
  await MarketingContent.create({ key: 'marketing', ...content });
  console.log('[Marketing] تم بذر المحتوى التسويقي الافتراضي بنجاح');
  process.exit(0);
};

seed().catch((err) => {
  console.error('[Marketing] فشل البذر:', err.message);
  process.exitCode = 1;
});
