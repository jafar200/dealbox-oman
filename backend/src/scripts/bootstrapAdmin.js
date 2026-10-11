import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { createInterface } from 'node:readline/promises';
import { ENV } from '../config/env.js';
import User from '../models/User.js';

const askHidden = (prompt) => new Promise((resolve, reject) => {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    reject(new Error('شغّل هذا الأمر داخل طرفية تفاعلية لإدخال كلمة المرور بأمان'));
    return;
  }

  let value = '';
  const previousRawMode = input.isRaw;
  process.stdout.write(prompt);
  input.setRawMode(true);
  input.resume();

  const finish = (error) => {
    input.off('data', handleInput);
    input.setRawMode(previousRawMode);
    process.stdout.write('\n');
    if (error) reject(error);
    else resolve(value);
  };

  const handleInput = (chunk) => {
    const character = chunk.toString('utf8');
    if (character === '\u0003') return finish(new Error('تم إلغاء العملية'));
    if (character === '\r' || character === '\n') return finish();
    if (character === '\u007f' || character === '\b') {
      value = value.slice(0, -1);
      return;
    }
    if (character >= ' ') value += character;
  };

  input.on('data', handleInput);
});

const bootstrapAdmin = async () => {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const name = (await prompt.question('اسم الأدمن: ')).trim();
  const email = (await prompt.question('البريد الإلكتروني: ')).trim().toLowerCase();
  prompt.close();

  const password = await askHidden('كلمة المرور (8 أحرف على الأقل): ');
  const passwordConfirmation = await askHidden('تأكيد كلمة المرور: ');
  if (!name || !email || password.length < 8 || password !== passwordConfirmation) {
    throw new Error('تحقق من الاسم والبريد وتطابق كلمتي المرور (8 أحرف على الأقل)');
  }

  await mongoose.connect(ENV.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  if (await User.exists({ role: 'admin' })) {
    throw new Error('يوجد حساب أدمن بالفعل؛ لن يتم إنشاء حساب إضافي بواسطة أداة التهيئة');
  }

  await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: 'admin',
    active: true,
  });
  console.log('تم إنشاء حساب الأدمن. استخدم البريد وكلمة المرور لتسجيل الدخول إلى بوابة الإدارة.');
};

try {
  await bootstrapAdmin();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}