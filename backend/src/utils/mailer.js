import { ENV } from '../config/env.js';

/**
 * وحدة إرسال البريد الإلكتروني — قابلة للتوصيل.
 *
 * - إذا ضُبطت متغيرات SMTP في backend/.env (MAIL_ENABLED=true + MAIL_HOST/USER/PASS)
 *   تُرسل رسالة حقيقية عبر nodemailer (يُحمَّل ديناميكياً عند الحاجة،
 *   لذا يبقى الخادم يعمل حتى قبل تثبيت الحزمة).
 * - قبل شراء الدومين وإعداد المرسل: يعمل النظام في «وضع التطوير» —
 *   يُسجَّل الرابط في سجل الخادم وتُعاد devResetLink في الاستجابة لتظهر مباشرة في الواجهة.
 */

const isSmtpConfigured = () =>
  Boolean(
    ENV.MAIL_ENABLED
      && ENV.MAIL_HOST
      && ENV.MAIL_USER
      && ENV.MAIL_PASS,
  );

/**
 * حالة إعداد البريد — تستخدمها واجهة «إعدادات النظام» في لوحة الأدمن.
 */
export const getMailStatus = () => ({
  smtpConfigured: isSmtpConfigured(),
  fromAddress: ENV.MAIL_FROM,
  mode: isSmtpConfigured() ? 'smtp' : 'development',
});

const buildResetEmailText = ({ userName, resetLink }) => `
مرحباً ${userName || 'بك'}،

استلمنا طلباً لاستعادة كلمة المرور الخاصة بحسابك في منصة DealBox عُمان.
لتعيين كلمة مرور جديدة، افتح الرابط التالي خلال 30 دقيقة:

${resetLink}

إذا لم تطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة — ستبقى كلمة المرور الحالية صالحة.

مع تحيات فريق DealBox عُمان — منصة حفظ النعمة
`;

/**
 * يرسل رسالة استعادة كلمة المرور عبر SMTP إن كان مهيأً، وإلا يعمل بوضع التطوير.
 * @returns {Promise<{ mode: 'smtp' | 'development', resetLink: string }>}
 */
export const sendPasswordResetEmail = async ({ toEmail, resetLink, userName }) => {
  if (!isSmtpConfigured()) {
    // وضع التطوير: بدون مرسل حقيقي بعد — تُظهر الواجهة الرابط مباشرة.
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  [DealBox Mail] وضع التطوير — استعادة كلمة المرور          ║');
    console.log(`║  إلى: ${toEmail}`);
    console.log(`║  رابط إعادة التعيين: ${resetLink}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    return { mode: 'development', resetLink };
  }

  let nodemailer;
  try {
    // استيراد ديناميكي حتى لا يتطلب تشغيل الخادم تثبيت nodemailer مسبقاً.
    nodemailer = (await import('nodemailer')).default;
  } catch {
    console.warn('[DealBox Mail] nodemailer غير مثبت — أُرسل وضع التطوير بدلاً من SMTP. شغّل: npm --prefix backend install nodemailer');
    console.log(`[DealBox Mail] رابط إعادة التعيين (تطوير): ${resetLink}`);
    return { mode: 'development', resetLink };
  }

  const transporter = nodemailer.createTransport({
    host: ENV.MAIL_HOST,
    port: ENV.MAIL_PORT,
    secure: ENV.MAIL_PORT === 465,
    auth: { user: ENV.MAIL_USER, pass: ENV.MAIL_PASS },
  });

  await transporter.sendMail({
    from: ENV.MAIL_FROM,
    to: toEmail,
    subject: 'استعادة كلمة المرور — DealBox عُمان',
    text: buildResetEmailText({ userName, resetLink }),
  });

  return { mode: 'smtp', resetLink };
};