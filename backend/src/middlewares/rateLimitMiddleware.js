import rateLimit from 'express-rate-limit';

/**
 * Shared factory so every limiter answers with the same DealBox 429 contract.
 *
 * @param {object} options
 * @param {number} options.windowMs window length in milliseconds
 * @param {number} options.limit max requests per window
 * @param {string} options.code machine readable error code
 * @param {string} options.message Arabic message shown to the client
 * @param {boolean} [options.skipSuccessfulRequests] count only failed attempts
 */
const buildLimiter = ({
  windowMs, limit, code, message, skipSuccessfulRequests = false,
}) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code,
      message,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    });
  },
});

/**
 * @desc Brute-force protection for credential checks.
 * Only failed logins count towards the limit, so a real user who signs in
 * correctly is never locked out of their own account.
 */
export const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  code: 'LOGIN_RATE_LIMIT',
  message: 'محاولات دخول كثيرة خلال وقت قصير، انتظر قليلاً ثم أعد المحاولة',
  skipSuccessfulRequests: true,
});

/**
 * @desc Stops scripted sign-up floods. Duplicate-email attempts count here,
 * because the register controller answers 409 only after the limiter runs.
 */
export const registerLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  code: 'REGISTER_RATE_LIMIT',
  message: 'تم تجاوز عدد محاولات التسجيل المسموح، حاول لاحقاً',
});

/**
 * @desc Google ID-token verification costs a remote round trip, so it gets its own budget.
 */
export const googleAuthLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  code: 'GOOGLE_RATE_LIMIT',
  message: 'محاولات تسجيل عبر Google كثيرة، انتظر قليلاً ثم أعد المحاولة',
});

/**
 * @desc Broad ceiling for the whole auth router, so an attacker cannot
 * spread the load across endpoints to slip past the per-route budgets.
 */
export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  code: 'AUTH_RATE_LIMIT',
  message: 'عدد كبير من طلبات المصادقة، انتظر قليلاً ثم أعد المحاولة',
});

/**
 * @desc حد أسبوعي/ساعي لطلبات استعادة كلمة المرور حتى لا تُستخدم
 * النقطة كبوابة لضخ رسائل بريد مزعجة أو إغراق صندوق البريد.
 */
export const forgotPasswordLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  code: 'FORGOT_PASSWORD_RATE_LIMIT',
  message: 'محاولات استعادة كلمة المرور كثيرة خلال وقت قصير، انتظر ساعة ثم أعد المحاولة',
});

/**
 * @desc حد لطلبات انضمام الشركاء من استمارة الموقع التسويقي (حماية من الإغراق).
 */
export const partnerRequestLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  code: 'PARTNER_REQUEST_RATE_LIMIT',
  message: 'أرسلت عدداً كبيراً من الطلبات خلال وقت قصير، حاول لاحقاً',
});

/**
 * @desc حد لمحاولات تعيين كلمة مرور جديدة (إعادة استخدام/تخمين الرموز).
 */
export const resetPasswordLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  code: 'RESET_PASSWORD_RATE_LIMIT',
  message: 'محاولات تحديث كثيرة خلال وقت قصير، انتظر قليلاً ثم أعد المحاولة',
});