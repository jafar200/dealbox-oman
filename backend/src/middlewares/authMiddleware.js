import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import User from '../models/User.js';
import { permissionsForRole, ADMIN_PERMISSION_LABELS } from '../config/adminRoles.js';

/**
 * DealBox Authentication & RBAC Middleware
 * Validates user token and checks allowed roles ('client', 'store_manager', 'admin')
 */
export const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token, ...extra] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token || extra.length) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح: يجب تسجيل الدخول للوصول إلى هذا المسار',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, ENV.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'رمز الدخول غير صالح أو منتهي الصلاحية' });
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.active) {
    return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة أو أن الحساب غير نشط' });
  }

  req.user = user;
  return next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `ليس لديك الصلاحية لتنفيذ هذا الإجراء (يتطلب رتبة: ${roles.join(' أو ')})`,
      });
    }
    next();
  };
};

/**
 * فحص صلاحيات لوحة الآدمن المركزية (RBAC).
 * المستخدمون الأقدم دون adminRole يعاملون كمدير عام (كل الصلاحيات).
 */
export const requirePermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح بدخول لوحة الآدمن المركزية',
      });
    }
    const allowed = permissionsForRole(req.user.adminRole);
    const missing = permissions.filter((permission) => !allowed.includes(permission));
    if (missing.length) {
      const labels = missing.map((permission) => ADMIN_PERMISSION_LABELS[permission] || permission).join('، ');
      return res.status(403).json({
        success: false,
        message: `دورك («${req.user.adminRole || 'super_admin'}») لا يسمح بهذا القسم: ${labels}`,
        missingPermissions: missing,
      });
    }
    next();
  };
};
