import React, { useState } from 'react';

interface ResetPasswordViewProps {
  token: string;
  onOpenLogin?: () => void;
}

/**
 * صفحة تعيين كلمة مرور جديدة — تفتح عبر رابط إعادة التعيين (?reset=TOKEN)
 * وتعمل للأنواع الثلاثة: الأدمن، مسؤول المتجر، والمستفيد.
 */
export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ token, onOpenLogin }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'تعذر تحديث كلمة المرور');
      }
      setSuccessMessage(result.message || 'تم تحديث كلمة المرور بنجاح — سجّل الدخول الآن بكلمة المرور الجديدة');
      setPassword('');
      setConfirm('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر الاتصال بخادم إعادة التعيين');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4 py-8 text-[#131b2e]" dir="rtl">
      <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <span className="material-symbols-outlined text-3xl text-[#006948]">password</span>
          <h1 className="text-xl font-black">تعيين كلمة مرور جديدة</h1>
          <p className="text-sm text-stone-600">
            اختر كلمة مرور جديدة لحسابك في منصة DealBox عُمان.
          </p>
        </div>

        <label className="block space-y-1.5 text-sm font-semibold">
          <span>كلمة المرور الجديدة</span>
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 outline-none focus:border-[#006948] focus:ring-2 focus:ring-[#006948]/15"
            placeholder="6 أحرف على الأقل"
          />
        </label>

        <label className="block space-y-1.5 text-sm font-semibold">
          <span>تأكيد كلمة المرور</span>
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 outline-none focus:border-[#006948] focus:ring-2 focus:ring-[#006948]/15"
            placeholder="أعد إدخال كلمة المرور"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#006948]"
        >
          <span className="material-symbols-outlined text-[16px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
          {showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        </button>

        {errorMessage && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>}
        {successMessage && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{successMessage}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-[#006948] font-bold text-white transition hover:bg-[#005f3f] disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? 'جارٍ الحفظ...' : successMessage ? 'تم تحديث كلمة المرور ✓' : 'حفظ كلمة المرور الجديدة'}
        </button>

        {onOpenLogin && (
          <button type="button" onClick={onOpenLogin} className="w-full py-2 text-sm font-semibold text-stone-600 hover:text-[#006948]">
            العودة لتسجيل الدخول
          </button>
        )}
      </form>
    </main>
  );
};