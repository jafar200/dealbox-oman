import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../config/env.js';
import User from '../models/User.js';
import PlatformSetting from '../models/PlatformSetting.js';
import { permissionsForRole } from '../config/adminRoles.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

const googleClient = new OAuth2Client();

const RESET_SETTINGS_KEY = 'password-reset';

const createToken = (userId) => jwt.sign({ sub: userId }, ENV.JWT_SECRET, {
  expiresIn: ENV.JWT_EXPIRES_IN,
});

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  storeId: user.storeId?._id ? String(user.storeId._id) : user.storeId,
  storeName: user.storeId && typeof user.storeId === 'object' ? user.storeId.name : '',
  wilayah: user.wilayah,
  picture: user.picture,
  // RBAC في لوحة الآدمن المركزية: الدور الداخلي + الصلاحيات المصرح بها
  adminRole: user.role === 'admin' ? (user.adminRole || 'super_admin') : null,
  permissions: user.role === 'admin' ? permissionsForRole(user.adminRole) : [],
  lastLoginAt: user.lastLoginAt || null,
});

/**
 * @desc Register a new user
 * @route POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  const { name, email, phone, password, role = 'client', adminRegistrationCode, wilayah } = req.body;

  if (!name || !email || !phone || !password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'الاسم والبريد الإلكتروني والهاتف وكلمة مرور من 6 أحرف على الأقل مطلوبة',
    });
  }

  if (role !== 'client' && (role !== 'admin'
    || !ENV.ADMIN_REGISTRATION_CODE
    || adminRegistrationCode !== ENV.ADMIN_REGISTRATION_CODE)) {
    return res.status(403).json({ success: false, message: 'لا يمكن إنشاء هذا الدور بهذه البيانات' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'قاعدة البيانات غير متصلة، تعذر حفظ الحساب' });
  }

  try {
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      phone,
      password: await bcrypt.hash(password, 12),
      role,
      wilayah,
    });

    return res.status(201).json({
      success: true,
      message: 'تم تسجيل الحساب بنجاح في سلطنة عُمان',
      token: createToken(user.id),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقًا' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'تعذر إنشاء الحساب' });
  }
};

/**
 * @desc Login user
 * @route POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('storeId', 'name logoUrl');
    if (!user || !user.active || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'بيانات تسجيل الدخول غير صحيحة' });
    }

    // تحديث آخر نشاط (يظهر في «فريق المشرفين») دون فشل تسجيل الدخول عند أي خطأ
    try {
      user.lastLoginAt = new Date();
      await user.save();
    } catch {
      // غير حرج
    }

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token: createToken(user.id),
      user: publicUser(user),
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تسجيل الدخول' });
  }
};

/**
 * @desc Verify a Google ID token and sign in or register a client
 * @route POST /api/v1/auth/google
 */
export const googleSignIn = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'رمز Google مطلوب' });
  }

  if (!ENV.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, message: 'تسجيل Google غير مهيأ على الخادم' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: ENV.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ success: false, message: 'رمز Google غير صالح أو منتهي الصلاحية' });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({ success: false, message: 'تعذر التحقق من حساب Google والبريد الإلكتروني' });
  }

  try {
    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        if (user.role !== 'client') {
          return res.status(403).json({ success: false, message: 'تسجيل Google متاح لحسابات المستفيدين فقط' });
        }
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({ success: false, message: 'هذا البريد مرتبط بحساب Google آخر' });
        }
        user.googleId = payload.sub;
        if (payload.picture) user.picture = payload.picture;
        await user.save();
      } else {
        user = await User.create({
          googleId: payload.sub,
          name: payload.name || email.split('@')[0],
          email,
          picture: payload.picture || '',
          role: 'client',
        });
      }
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'تم إيقاف هذا الحساب' });
    }
    if (user.role !== 'client') {
      return res.status(403).json({ success: false, message: 'تسجيل Google متاح لحسابات المستفيدين فقط' });
    }

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول عبر Google بنجاح',
      token: createToken(user.id),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'هذا الحساب مرتبط مسبقًا بمستخدم آخر' });
    }
    return res.status(500).json({ success: false, message: 'تعذر إنشاء جلسة Google' });
  }
};

/**
 * @desc Get current profile
 * @route GET /api/v1/auth/me
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @desc Update the signed-in client's profile (name/email/phone/picture)
 * @route PATCH /api/v1/auth/profile
 */
export const updateProfile = async (req, res) => {
  const { name, email, phone, picture } = req.body || {};
  try {
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof email === 'string' && email.trim()) user.email = email.trim().toLowerCase();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof picture === 'string') user.picture = picture;

    await user.save();
    return res.status(200).json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح', user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    return res.status(500).json({ success: false, message: 'تعذر تحديث الملف الشخصي' });
  }
};

const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

/**
 * @desc Request a password reset link (works for admin, store manager, and client)
 * @route POST /api/v1/auth/forgot-password
 *
 * الأمان: نجيب دائماً بنجاح حتى لو لم يوجد الحساب، حتى لا تُستخدم النقطة
 * لاكتشاف البريد المسجل. الميزة قابلة للإيقاف من «إعدادات النظام» في لوحة الأدمن.
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });
  }

  try {
    const settings = await PlatformSetting.findOne({ key: RESET_SETTINGS_KEY }).lean();
    const enabled = settings?.passwordResetEnabled !== false; // الافتراضي: مفعّل

    if (!enabled) {
      return res.status(400).json({
        success: false,
        message: 'خاصية استعادة كلمة المرور معطّلة حالياً من إعدادات النظام، تواصل مع الإدارة',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), active: true }).select('+password');
    if (!user || !user.password) {
      return res.status(200).json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، ستصل رسالة استعادة كلمة المرور إليه',
        mode: 'unknown',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 دقيقة
    await user.save();

    const resetLink = `${ENV.FRONTEND_URL}/?reset=${encodeURIComponent(rawToken)}`;
    const mailResult = await sendPasswordResetEmail({
      toEmail: user.email,
      resetLink,
      userName: user.name,
    });

    return res.status(200).json({
      success: true,
      message: 'أُرسلت رسالة استعادة كلمة المرور إلى بريدك الإلكتروني',
      mailMode: mailResult.mode,
      // وضع التطوير فقط (حتى يُهيأ SMTP مع الدومين): نظهر الرابط مباشرة
      ...(mailResult.mode === 'development' ? { devResetLink: resetLink } : {}),
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر إرسال رسالة استعادة كلمة المرور' });
  }
};

/**
 * @desc Set a new password using the token from the emailed link
 * @route POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  const { token, password } = req.body || {};

  if (!token) {
    return res.status(400).json({ success: false, message: 'رمز إعادة التعيين مطلوب' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      active: true,
    }).select('+password +resetPasswordToken');

    const expired = !user || !user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now();
    if (!user || expired) {
      return res.status(400).json({
        success: false,
        message: 'رابط استعادة كلمة المرور غير صالح أو منتهي الصلاحية، اطلب رابطاً جديداً',
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح — سجّل الدخول الآن بكلمة المرور الجديدة',
    });
  } catch {
    return res.status(500).json({ success: false, message: 'تعذر تحديث كلمة المرور' });
  }
};
