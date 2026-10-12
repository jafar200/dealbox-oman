import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
        };
      };
    };
    /** جسر تطبيق أندرويد الأصلي — يُكشف عبر WebView.addJavascriptInterface */
    AndroidGoogle?: {
      signIn: (clientId: string) => void;
    };
    /** تُنادي من التطبيق الأصلي عند نجاح اختيار حساب Google */
    __dealboxGoogleNativeToken?: (idToken: string) => void;
    /** تُنادي من التطبيق الأصلي عند فشل تسجيل Google الأصلي */
    __dealboxGoogleNativeError?: (message: string) => void;
  }
}

interface ClientAuthViewProps {
  onContinue: () => void;
  onBack: () => void;
  projectLogo?: string | null;
  googleAuthEnabled?: boolean;
  googleClientId?: string;
}

export const ClientAuthView: React.FC<ClientAuthViewProps> = ({
  onContinue,
  onBack,
  projectLogo,
  googleAuthEnabled = true,
  googleClientId = '',
}) => {
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  // استعادة كلمة المرور (نسيت كلمة المرور؟) — تعمل للمستفيد عبر البريد الإلكتروني
  const [showForgotMode, setShowForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const isEmbeddedBrowser = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);
  /** هل نعمل داخل تطبيق أندرويد الأصلي (WebView يوفّر جسر AndroidGoogle)؟ */
  const isNativeApp = typeof window !== 'undefined' && !!window.AndroidGoogle;

  const handleSendCode = () => {
    setIsOtpSent(true);
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('أدخل البريد الإلكتروني المرتبط بحسابك.');
      return;
    }
    setForgotError('');
    setForgotMessage('');
    setDevResetLink('');
    setIsSendingForgot(true);
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
      if (result.devResetLink) setDevResetLink(result.devResetLink);
      setForgotEmail('');
    } catch (error) {
      setForgotError(error instanceof Error ? error.message : 'تعذر الاتصال بخدمة استعادة كلمة المرور');
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handleSubmitAuth = async () => {
    if (!isRegistering && authMode === 'phone') {
      handleSendCode();
      return;
    }

    if (isRegistering && (!name.trim() || !phone.trim() || !email.trim() || password.length < 6)) {
      setAuthError('أدخل الاسم ورقم الهاتف والبريد وكلمة مرور من 6 أحرف على الأقل.');
      return;
    }
    if (!isRegistering && (!email.trim() || !password)) {
      setAuthError('أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);
    try {
      const response = await fetch(isRegistering ? '/api/v1/auth/register' : '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegistering
          ? { name: name.trim(), email: email.trim(), phone: `+968 ${phone.trim()}`, password }
          : { email: email.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.token) {
        throw new Error(result.message || 'تعذر إكمال التسجيل');
      }

      if (isRegistering) {
        setIsRegistering(false);
        setAuthMode('email');
        setPassword('');
        setAuthSuccess('تم إنشاء الحساب بنجاح. سجّل الدخول باستخدام بريدك الإلكتروني وكلمة المرور.');
        return;
      }

      localStorage.setItem('dealbox_auth_token_v1', result.token);
      localStorage.setItem('dealbox_user_v1', JSON.stringify(result.user));
      onContinue();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'تعذر الاتصال بخدمة التسجيل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const authenticateGoogle = async (idToken: string) => {
    setGoogleError('');
    setIsSigningInWithGoogle(true);
    try {
      const response = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.token) {
        throw new Error(result.message || 'تعذر تسجيل الدخول عبر Google');
      }

      localStorage.setItem('dealbox_auth_token_v1', result.token);
      localStorage.setItem('dealbox_user_v1', JSON.stringify(result.user));
      onContinue();
    } catch (error) {
      setGoogleError(error instanceof Error ? error.message : 'تعذر الاتصال بخدمة تسجيل Google');
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const authenticateGoogleRef = useRef(authenticateGoogle);
  authenticateGoogleRef.current = authenticateGoogle;

  useEffect(() => {
    const buttonElement = googleButtonRef.current;
    if (!googleAuthEnabled || !googleClientId || !buttonElement || isEmbeddedBrowser || isNativeApp) return;

    let isActive = true;
    const renderGoogleButton = () => {
      const googleIdentity = window.google?.accounts?.id;
      if (!isActive || !googleIdentity || !googleButtonRef.current) return;

      googleButtonRef.current.replaceChildren();
      googleIdentity.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (!response.credential) {
            setGoogleError('لم يُرجع Google رمز تحقق صالحًا');
            return;
          }
          void authenticateGoogleRef.current(response.credential);
        },
      });
      googleIdentity.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 260,
        locale: 'ar',
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        isActive = false;
      };
    }

    let script = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const handleLoad = () => renderGoogleButton();
    const handleError = () => setGoogleError('تعذر تحميل خدمة تسجيل Google');
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      isActive = false;
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
    };
  }, [googleAuthEnabled, googleClientId, isEmbeddedBrowser, isNativeApp]);

  // جسر تطبيق أندرويد الأصلي: يستقبل رمز الهوية أو الخطأ من التطبيق ويكمّل الدخول.
  useEffect(() => {
    if (!isNativeApp) return;
    window.__dealboxGoogleNativeToken = (idToken: string) => {
      if (!idToken) {
        setGoogleError('لم يُرجع Google رمز تحقق صالحًا');
        return;
      }
      void authenticateGoogleRef.current(idToken);
    };
    window.__dealboxGoogleNativeError = (message: string) => {
      setGoogleError(message || 'تعذر تسجيل الدخول عبر Google');
      setIsSigningInWithGoogle(false);
    };
    return () => {
      delete window.__dealboxGoogleNativeToken;
      delete window.__dealboxGoogleNativeError;
    };
  }, [isNativeApp]);

  /** يبدأ تسجيل الدخول عبر Google: أصلي داخل التطبيق، أو نافذة الويب في المتصفح. */
  const startGoogleSignIn = () => {
    if (!isNativeApp || !window.AndroidGoogle?.signIn) return;
    setGoogleError('');
    setIsSigningInWithGoogle(true);
    window.AndroidGoogle.signIn(googleClientId);
  };

  return (
    <div
      className="min-h-screen bg-[#f5f4f1] text-[#131b2e]"
      dir="rtl"
      style={{ fontFamily: '"IBM Plex Sans Arabic", "IBM Plex Sans", sans-serif' }}
    >
      <div className="mx-auto w-full max-w-[430px] px-4 pb-10 pt-3">
        <header className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full bg-[#edf5f0] px-3 py-2 text-[14px] font-bold text-[#006948] shadow-sm transition hover:bg-[#e3f2ea]"
          >
            <span className="material-symbols-outlined text-[20px] leading-none">arrow_back</span>
            <span>الدخول كضيف</span>
          </button>

          <div className="flex items-center gap-2 rounded-full bg-[#edf5f0] px-3 py-1.5 text-[12px] font-semibold text-[#006948]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#006948]" />
            <span>منصة حفظ النعمة</span>
          </div>
        </header>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-[150px] w-[180px] items-center justify-center overflow-hidden rounded-[18px] bg-[#dfe0e0] shadow-sm ring-1 ring-black/5">
            {projectLogo ? (
              <img src={projectLogo} alt="DealBox Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="text-[42px] font-black text-[#4b4f5a]">img</div>
            )}
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f7b63d] px-4 py-2 text-[16px] font-black text-[#412d00] shadow-sm">
            <span>وفر واكسب</span>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>
              eco
            </span>
          </div>

          <h1 className="mb-1 text-[26px] font-black leading-[1.3] text-[#131b2e]">
            {isRegistering ? 'إنشاء حساب جديد' : 'مرحبا بك في DealBox'}
          </h1>
          <p className="max-w-[290px] text-[14px] leading-7 text-[#3d4a42]">
            {isRegistering
              ? 'أنشئ حسابك للبدء في حجز صناديق التوفير.'
              : 'احجز صناديق التوفير الذكية وساهم في حفظ النعمة ومكافحة الهدر الغذائي'}
          </p>
        </div>

        {!isRegistering && <div className="mt-5 w-full rounded-[18px] bg-[#e9eef7] p-1.5 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setAuthMode('email')}
              className={`flex items-center justify-center gap-2 rounded-[14px] px-3 py-3 text-[15px] font-bold transition ${
                authMode === 'email'
                  ? 'bg-white text-[#006948] shadow-sm ring-1 ring-[#dfe7df]'
                  : 'text-[#3d4a42]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>البريد الإلكتروني</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('phone')}
              className={`flex items-center justify-center gap-2 rounded-[14px] px-3 py-3 text-[15px] font-bold transition ${
                authMode === 'phone'
                  ? 'bg-white text-[#006948] shadow-sm ring-1 ring-[#dfe7df]'
                  : 'text-[#3d4a42]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">smartphone</span>
              <span>رقم الجوال</span>
            </button>
          </div>
        </div>}

        <form className="mt-5 flex w-full flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          {isRegistering ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-bold text-[#3d4a42]">الاسم الكامل</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="h-[56px] w-full rounded-[16px] bg-[#f2f3f2] px-4 text-right text-[16px] text-[#131b2e] shadow-sm ring-1 ring-[#e0e7df] outline-none focus:ring-2 focus:ring-[#006948]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-bold text-[#3d4a42]">رقم الجوال</label>
                <div className="flex h-[56px] items-center overflow-hidden rounded-[16px] bg-[#f2f3f2] shadow-sm ring-1 ring-[#e0e7df] focus-within:ring-2 focus-within:ring-[#006948]/20">
                  <div className="flex h-full items-center gap-2 border-l border-[#dbdfdb] bg-[#edf6f0] px-3 text-[14px] font-bold text-[#1a2b24]">
                    <span>🇴🇲</span><span dir="ltr">+968</span>
                  </div>
                  <input
                    type="tel"
                    dir="ltr"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9XXX XXXX"
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-left text-[16px] text-[#131b2e] outline-none placeholder:text-[#7a847d]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-bold text-[#3d4a42]">البريد الإلكتروني</label>
                <input
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-[56px] w-full rounded-[16px] bg-[#f2f3f2] px-4 text-left text-[16px] text-[#131b2e] shadow-sm ring-1 ring-[#e0e7df] outline-none focus:ring-2 focus:ring-[#006948]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-bold text-[#3d4a42]">كلمة المرور</label>
                <div className="flex h-[56px] items-center rounded-[16px] bg-[#f2f3f2] shadow-sm ring-1 ring-[#e0e7df] focus-within:ring-2 focus-within:ring-[#006948]/20">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-right text-[16px] text-[#131b2e] outline-none placeholder:text-[#7a847d]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-[#7a847d]">
                    <span className="material-symbols-outlined text-[22px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : authMode === 'phone' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[15px] font-bold text-[#3d4a42]">رقم الجوال</label>
              <div className="flex h-[56px] items-center overflow-hidden rounded-[16px] bg-[#f2f3f2] shadow-sm ring-1 ring-[#e0e7df] transition focus-within:ring-2 focus-within:ring-[#006948]/20">
                <div className="flex items-center justify-center gap-2 border-l border-[#dbdfdb] bg-[#edf6f0] px-3 text-[14px] font-bold text-[#1a2b24]">
                  <span className="text-[16px]">🇴🇲</span>
                  <span dir="ltr">+968</span>
                </div>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9XXX XXXX"
                  className="flex-1 border-0 bg-transparent px-3 text-left text-[18px] font-medium text-[#131b2e] outline-none placeholder:text-[#7a847d]"
                />
                <span className="px-3 text-[#7a847d] material-symbols-outlined text-[22px]">phone_iphone</span>
              </div>

              <p className="px-1 text-[12px] text-[#6d7a72]">
                سنرسل لك رمز تحقق سريعاً عبر رسالة نصية (OTP)
              </p>
            </div>
          ) : showForgotMode ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-bold text-[#3d4a42]">البريد الإلكتروني</label>
                <div className="flex h-[56px] items-center overflow-hidden rounded-[16px] bg-[#f2f3f2] shadow-sm ring-1 ring-[#e0e7df] transition focus-within:ring-2 focus-within:ring-[#006948]/20">
                  <span className="material-symbols-outlined px-3 text-[22px] text-[#7a847d]">alternate_email</span>
                  <input
                    type="email"
                    dir="ltr"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 border-0 bg-transparent px-1 text-left text-[16px] font-medium text-[#131b2e] outline-none placeholder:text-[#7a847d]"
                  />
                </div>
                <p className="px-1 text-[12px] text-[#6d7a72]">
                  سنرسل لك رابطاً لتعيين كلمة مرور جديدة على بريدك خلال 30 دقيقة.
                </p>
              </div>

              {forgotMessage && (
                <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[13px] text-emerald-800">{forgotMessage}</p>
              )}
              {devResetLink && (
                <div className="rounded-xl border border-[#dde4f5] bg-[#f2f3ff] px-3 py-3 text-[12px] leading-6 text-stone-700">
                  <p className="mb-0.5 font-bold text-[#131b2e]">وضع التطوير — مرسل البريد لم يُهيأ بعد (سيتفعل مع الدومين)</p>
                  <p>افتح رابط إعادة التعيين لتعيين كلمة مرور جديدة:</p>
                  <a href={devResetLink} dir="ltr" className="block break-all font-mono text-[11px] text-[#006948] underline">{devResetLink}</a>
                </div>
              )}
              {forgotError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[13px] text-red-800">{forgotError}</p>}

              <button
                type="button"
                onClick={() => {
                  setShowForgotMode(false);
                  setForgotMessage('');
                  setForgotError('');
                  setDevResetLink('');
                }}
                className="text-[13px] font-bold text-[#006948] hover:underline"
              >
                ← العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] font-bold text-[#3d4a42]">البريد الإلكتروني</label>
                <div className="flex h-[56px] items-center overflow-hidden rounded-[16px] bg-[#f2f3f2] shadow-sm ring-1 ring-[#e0e7df] transition focus-within:ring-2 focus-within:ring-[#006948]/20">
                  <span className="material-symbols-outlined px-3 text-[22px] text-[#7a847d]">alternate_email</span>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 border-0 bg-transparent px-1 text-left text-[16px] font-medium text-[#131b2e] outline-none placeholder:text-[#7a847d]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[15px] font-bold text-[#3d4a42]">كلمة المرور</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotMode(true);
                      setAuthError('');
                    }}
                    className="text-[12px] font-medium text-[#006948] hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="flex h-[56px] items-center overflow-hidden rounded-[16px] bg-[#f2f3f2] shadow-sm ring-1 ring-[#e0e7df] transition focus-within:ring-2 focus-within:ring-[#006948]/20">
                  <span className="material-symbols-outlined px-3 text-[22px] text-[#7a847d]">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 border-0 bg-transparent px-1 text-right text-[16px] font-medium text-[#131b2e] outline-none placeholder:text-[#7a847d]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 text-[#7a847d]"
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={showForgotMode ? handleForgotSubmit : handleSubmitAuth}
            disabled={isSubmitting || isSendingForgot}
            className="mt-2 flex h-[56px] w-full items-center justify-center gap-3 rounded-[16px] bg-[#006948] px-5 text-[18px] font-black text-white shadow-md transition hover:bg-[#005f3f] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
          >
            <span>
              {showForgotMode
                ? (isSendingForgot ? 'جارٍ الإرسال...' : 'إرسال رابط استعادة كلمة المرور')
                : isSubmitting
                  ? 'جارٍ الإرسال...'
                  : isRegistering
                    ? 'إنشاء الحساب'
                    : authMode === 'phone'
                      ? (isOtpSent ? 'إعادة إرسال الرمز' : 'إرسال رمز التحقق')
                      : 'تسجيل الدخول'}
            </span>
            <span className="material-symbols-outlined text-[22px]">arrow_circle_left</span>
          </button>
        </form>
        {authError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[13px] text-red-800">{authError}</p>}
        {authSuccess && <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[13px] text-emerald-800">{authSuccess}</p>}

        <div className="relative my-6 flex items-center justify-center">
          <div className="h-px w-full bg-[#dfe3df]" />
          <span className="absolute bg-[#f5f4f1] px-4 text-[12px] font-medium text-[#6d7a72]">أو المتابعة باستخدام</span>
        </div>

        <div className="flex justify-center">
          {isEmbeddedBrowser ? (
            <div className="w-full max-w-[360px] rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-center text-[12px] leading-6 text-amber-950">
              <p className="font-bold">تسجيل Google غير متاح داخل معاينة VS Code.</p>
              <p>افتح التطبيق في Chrome أو Edge، وأضف هذا الأصل إلى Authorized JavaScript origins في Google Cloud:</p>
              <bdi dir="ltr" className="font-mono font-bold">{window.location.origin}</bdi>
            </div>
          ) : isNativeApp && googleAuthEnabled && googleClientId ? (
            <button
              type="button"
              onClick={startGoogleSignIn}
              className={`flex h-[56px] w-full max-w-[260px] items-center justify-center gap-2 rounded-[16px] bg-white text-[18px] font-medium text-[#131b2e] shadow-sm ring-1 ring-[#dfe7df] transition active:scale-[0.98] ${
                isSigningInWithGoogle ? 'pointer-events-none opacity-60' : ''
              }`}
              aria-label="متابعة باستخدام Google"
            >
              <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.5z"/>
              </svg>
              <span className="font-bold">Google</span>
            </button>
          ) : googleAuthEnabled && googleClientId ? (
            <div
              ref={googleButtonRef}
              className={`flex h-[56px] w-full max-w-[260px] items-center justify-center ${
                isSigningInWithGoogle ? 'pointer-events-none opacity-60' : ''
              }`}
              aria-label="متابعة باستخدام Google"
            />
          ) : (
            <button
              type="button"
              disabled
              className="flex h-[56px] w-full max-w-[260px] cursor-not-allowed items-center justify-center gap-2 rounded-[16px] bg-white text-[18px] font-medium text-[#131b2e] opacity-60 shadow-sm ring-1 ring-[#dfe7df]"
            >
              <span className="font-bold">Google</span>
              <span className="text-sm">غير مهيأ</span>
            </button>
          )}
        </div>
        {googleError && <p role="alert" className="mt-2 text-center text-[12px] font-medium text-red-700">{googleError}</p>}

        <div className="mt-5 flex items-center justify-between gap-2 text-[15px]">
          <span className="text-[#3d4a42]">{isRegistering ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب بعد؟'}</span>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              if (!isRegistering) setAuthMode('email');
              setAuthError('');
              setAuthSuccess('');
            }}
            className="font-bold text-[#006948] hover:underline"
          >
            {isRegistering ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-[16px] border border-[#dfe4df] bg-[#eef6f1] p-3 shadow-sm">
          <div className="flex items-center gap-2 text-[14px] font-medium text-[#131b2e]">
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#006948]" />
            <span>أوافق على الشروط والأحكام</span>
          </div>
          <span className="material-symbols-outlined text-[22px] text-[#006948]" style={{ fontVariationSettings: 'FILL 1' }}>
            verified_user
          </span>
        </div>

        <div className="mt-5 text-center text-[12px] leading-7 text-[#6d7a72]">
          بالتسجيل، فإنك توافق على{' '}
          <a href="#" className="font-semibold text-[#006948] underline">شروط الخدمة</a>
          {' '}و{' '}
          <a href="#" className="font-semibold text-[#006948] underline">سياسة الخصوصية</a>
          {' '}لتطبيق DealBox.
        </div>
      </div>
    </div>
  );
};
