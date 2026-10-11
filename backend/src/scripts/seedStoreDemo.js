import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import User from '../models/User.js';
import Store from '../models/Store.js';

/**
 * حساب ديمو لمسؤول المتجر — حساب حقيقي مربوط بمتجر فعلي
 * يمكنه الدخول إلى «لوحة تحكم المتجر والشريك».
 *
 * Idempotent: يُحدَّث الحساب حسب البريد دون تكرار.
 * كلمة المرور التجريبية: StoreDemo123
 * Run with: npm --prefix backend run db:seed:store-demo
 */

const DEMO_EMAIL = 'store-demo@dealbox.test';
const DEMO_PASSWORD = 'StoreDemo123';
const PREFERRED_STORE_NAME = 'مخبز مسقط النور - الخوض';

const seedStoreDemo = async () => {
  await mongoose.connect(ENV.MONGO_URI, { serverSelectionTimeoutMS: 5000 });

  const store = await Store.findOne({ name: PREFERRED_STORE_NAME })
    .orFail()
    .catch(async () => {
      const first = await Store.findOne().sort({ createdAt: 1 });
      if (!first) throw new Error('لا توجد متاجر في القاعدة — أنشئ متجراً أولاً');
      return first;
    });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      $set: {
        name: 'محمد بن سعيد الوردي (مسؤول متجر ديمو)',
        phone: '+968 9222 3333',
        role: 'store_manager',
        storeId: store._id,
        active: true,
        password: passwordHash,
      },
    },
    { new: true, upsert: true },
  );

  console.log(`[DealBox Store] حساب الدخول التجريبي جاهز: ${DEMO_EMAIL}`);
  console.log(`  - المتجر المرتبط: ${store.name} (${store._id})`);
  console.log(`  - كلمة المرور التجريبية: ${DEMO_PASSWORD}`);
  console.log(`  - المستخدم: ${user.name} (role: ${user.role})`);
  await mongoose.disconnect();
};

try {
  await seedStoreDemo();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}