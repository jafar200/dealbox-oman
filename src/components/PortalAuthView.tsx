import React, { useState } from 'react';

export interface PortalSessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'store_manager';
  storeId?: string;
  storeName?: string;
  // RBAC في لوحة الآدمن المركزية: الدور الداخلي والصلاحيات المصرح بها
  adminRole?: string;
  permissions?: string[];
}

interface PortalAuthViewProps {
  role: PortalSessionUser['role'];
  onBack: () => void;
  onAuthenticated: (token: string, user: PortalSessionUser) => void;
}

/**
 * شاشة الدخول للأدمن ومسؤول المتجر، وتشمل استعادة كلمة المرور
 * («نسيت كلمة المرور؟») — تعمل بنفس الطريقة للدورين لأن الحساب
 * يُبحث عنه بالبريد في نفس جدول المستخدمين.
 */
export const PortalAuthView: React.FC<PortalAuthViewProps> = ({ role, onBack, onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // استعادة كلمة المرور
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const isAdmin = role === 'admin';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.token) {
        throw new Error(result.message || 'تعذر تسجيل الدخول');
      }
      if (result.user.role !== role || (role === 'store_manager' && !result.user.storeId)) {
        throw new Error(isAdmin
          ? 'هذا الحساب ليس حساب أدمن مخولًا'
          : 'هذا الحساب ليس مرتبطًا بمتجر نشط');
      }
      onAuthenticated(result.token, result.user as PortalSessionUser);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر الاتصال بخادم تسجيل الدخول');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotMessage('');
    setForgotError('');
    setDevResetLink('');
    setIsSendingReset(true);
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'تعذر إرسال رسالة استعادة كلمة المرور');
      }
      setForgotMessage(result.message || 'أُرسلت رسالة استعادة كلمة المرور إلى بريدك الإلكتروني');
      if (result.devResetLink) {
        setDevResetLink(result.devResetLink);
      }
      setForgotEmail('');
    } catch (error) {
      setForgotError(error instanceof Error ? error.message : 'تعذر الاتصال بخادم استعادة كلمة المرور');
    } finally {
      setIsSendingReset(false);
    }
  };

  const switchToLogin = () => {
    setIsForgotMode(false);
    setForgotMessage('');
    setForgotError('');
    setDevResetLink('');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4 py-8 text-[#131b2e]" dir="rtl">
      {!isForgotMode ? (
        <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="space-y-1 text-center">
            <span className="material-symbols-outlined text-3xl text-[#006948]">
              {isAdmin ? 'admin_panel_settings' : 'storefront'}
            </span>
            <h1 className="text-xl font-black">{isAdmin ? 'دخول الإدارة' : 'دخول مدير المتجر'}</h1>
            <p className="text-sm text-stone-600">سجّل الدخول بالحساب والصلاحية المعتمدين.</p>
          </div>

          <label className="block space-y-1.5 text-sm font-semibold">
            <span>البريد الإلكتروني</span>
            <input
              type="email"
              autoComplete="username"
              required
              dir="ltr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-left outline-none focus:border-[#006948] focus:ring-2 focus:ring-[#006948]/15"
            />
          </label>

          <label className="block space-y-1.5 text-sm font-semibold">
            <span>كلمة المرور</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 outline-none focus:border-[#006948] focus:ring-2 focus:ring-[#006948]/15"
            />
          </label>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setIsForgotMode(true); setErrorMessage(''); }}
              className="text-xs font-semibold text-[#006948] hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          {errorMessage && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-[#006948] font-bold text-white transition hover:bg-[#005f3f] disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
          </button>
          {isAdmin && (
            <p className="text-center text-xs leading-6 text-stone-500">
              لإنشاء أول حساب أدمن، شغّل <code dir="ltr">npm run bootstrap:admin</code> داخل مجلد backend.
            </p>
          )}
          <button type="button" onClick={onBack} className="w-full py-2 text-sm font-semibold text-stone-600 hover:text-[#006948]">
            العودة لبوابة الدخول
          </button>
        </form>
      ) : (
        <form onSubmit={handleForgotSubmit} className="w-full max-w-[400px] space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="space-y-1 text-center">
            <span className="material-symbols-outlined text-3xl text-[#006948]">lock_reset</span>
            <h1 className="text-xl font-black">استعادة كلمة المرور</h1>
            <p className="text-sm text-stone-600">
              أدخل البريد الإلكتروني المرتبط بحسابك وسنرسل لك رابطاً لتعيين كلمة مرور جديدة خلال 30 دقيقة.
            </p>
          </div>

          <label className="block space-y-1.5 text-sm font-semibold">
            <span>البريد الإلكتروني</span>
            <input
              type="email"
              autoComplete="username"
              required
              dir="ltr"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-left outline-none focus:border-[#006948] focus:ring-2 focus:ring-[#006948]/15"
            />
          </label>

          {forgotMessage && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{forgotMessage}</p>
          )}
          {devResetLink && (
            <div className="rounded-xl border border-[#e2e7ff] bg-[#f2f3ff] px-3 py-3 text-xs leading-6 text-stone-700">
              <p className="font-bold mb-1 text-[#131b2e]">وضع التطوير — مرسل البريد لم يُهيأ بعد (سيتفعل عند شراء الدومين)</p>
              <p>رابط إعادة التعيين (افتحه لتعيين كلمة مرور جديدة):</p>
              <a href={devResetLink} dir="ltr" className="block font-mono text-[11px] text-[#006948] underline break-all">{devResetLink}</a>
            </div>
          )}
          {forgotError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{forgotError}</p>}

          <button
            type="submit"
            disabled={isSendingReset}
            className="h-12 w-full rounded-xl bg-[#006948] font-bold text-white transition hover:bg-[#005f3f] disabled:cursor-wait disabled:opacity-60"
          >
            {isSendingReset ? 'جارٍ الإرسال...' : 'إرسال رابط استعادة كلمة المرور'}
          </button>

          <button type="button" onClick={switchToLogin} className="w-full py-2 text-sm font-semibold text-stone-600 hover:text-[#006948]">
            العودة لتسجيل الدخول
          </button>
          <button type="button" onClick={onBack} className="w-full py-2 text-sm font-semibold text-stone-600 hover:text-[#006948]">
            العودة لبوابة الدخول
          </button>
        </form>
      )}
    </main>
  );
};