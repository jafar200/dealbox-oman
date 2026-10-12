import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * توجيه استدعاءات API/Uploads للخادم الخلفي:
 * - محلياً (بدون VITE_API_URL): مسارات نسبية عبر بروكسي Vite.
 * - على الاستضافة (Vercel): رابط مطلق للخادم (Render) — يُضبط من متغيرات بيئة Vercel.
 * التعديل في مكان واحد بدل تغيير كل ملفات fetch.
 */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
if (API_BASE && typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && (input.startsWith('/api/') || input.startsWith('/uploads/'))) {
      return originalFetch(API_BASE + input, init);
    }
    return originalFetch(input, init);
  }) as typeof window.fetch;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
