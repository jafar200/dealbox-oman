import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم المستخدم مطلوب'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'البريد الإلكتروني مطلوب'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      required: function requiredForPasswordLogin() {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    picture: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['client', 'store_manager', 'admin'],
      default: 'client',
    },
    // الدور داخل لوحة الآدمن المركزية (RBAC) — يُشتق منه المصرح بدخول اللوحة وصلاحياته.
    // القيم null تعني مدير عام افتراضياً (للتوافق مع الحسابات الأقدم).
    adminRole: {
      type: String,
      enum: [
        'super_admin',
        'operations_manager',
        'supervisor',
        'logistics_manager',
        'financial_officer',
        'food_safety',
      ],
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null, // Only for store_manager
    },
    wilayah: {
      type: String,
      default: 'السيب (الخوض)',
    },
    ecoScoreKgSaved: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // استعادة كلمة المرور (نسيت كلمة المرور): رمز مجزّأ SHA-256 + تاريخ انتهاء الصلاحية
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
