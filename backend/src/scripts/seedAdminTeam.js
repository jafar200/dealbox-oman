import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import User from '../models/User.js';

/**
 * تهيئة فريق المشرفين والصلاحيات الميدانية (RBAC) — حسابات حقيقية
 * يمكنها الدخول فعلياً إلى لوحة الآدمن المركزية بأدوارها وصلاحياتها.
 *
 * Idempotent: تُحدَّث الحسابات حسب البريد دون تكرار.
 * كلمة المرور الموحدة للتجربة: DemoAdmin123
 * Run with: npm --prefix backend run db:seed:admin-team
 */

const TEAM_SEED = [
  {
    name: 'م. سارة الخالد',
    email: 'sara.alkhalid@dealbox.om',
    phone: '+968 9123 4567',
    adminRole: 'super_admin',
  },
  {
    name: 'يوسف بن خلفان المعمري',
    email: 'yusuf.mamari@dealbox.om',
    phone: '+968 9211 2233',
    adminRole: 'operations_manager',
  },
  {
    name: 'محمد بن سعيد الرواحي',
    email: 'mohammed.rowahi@dealbox.om',
    phone: '+968 9244 5566',
    adminRole: 'supervisor',
  },
  {
    name: 'أحمد بن سعيد البلوشي',
    email: 'ahmed.balushi@dealbox.om',
    phone: '+968 9234 5678',
    adminRole: 'logistics_manager',
  },
  {
    name: 'فاطمة الحوسنية',
    email: 'fatma.hosani@dealbox.om',
    phone: '+968 9345 6789',
    adminRole: 'financial_officer',
  },
  {
    name: 'د. هيثم بن خلفان العامري',
    email: 'haitham.amri@dealbox.om',
    phone: '+968 9456 7890',
    adminRole: 'food_safety',
  },
];

const DEMO_PASSWORD = 'DemoAdmin123';

const seedAdminTeam = async () => {
  await mongoose.connect(ENV.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const summary = [];

  // ضمان أن حساب الأدمن الأصلي مدير عام (توافق)
  const rootAdmin = await User.findOneAndUpdate(
    { email: 'admin@dealbox.test' },
    { $set: { role: 'admin', adminRole: 'super_admin', active: true } },
    { new: true },
  );
  if (rootAdmin) summary.push(`محدث: ${rootAdmin.email} → super_admin`);

  for (const entry of TEAM_SEED) {
    const updated = await User.findOneAndUpdate(
      { email: entry.email },
      {
        $set: {
          name: entry.name,
          phone: entry.phone,
          role: 'admin',
          adminRole: entry.adminRole,
          active: true,
          password: passwordHash,
        },
      },
      { new: true, upsert: true },
    );
    summary.push(`${updated ? 'جاهز' : 'خطأ'}: ${entry.email} → ${entry.adminRole}`);
  }

  const total = await User.countDocuments({ role: 'admin' });
  console.log(`[DealBox RBAC] فريق اللوحة جاهز (${total} مشرفاً). كلمة المرور التجريبية: ${DEMO_PASSWORD}`);
  summary.forEach((line) => console.log(`  - ${line}`));
  await mongoose.disconnect();
};

try {
  await seedAdminTeam();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}