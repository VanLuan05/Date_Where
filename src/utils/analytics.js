/**
 * analytics.js (Cụm 8) — GA4 nhẹ, không gãy khi chưa cấu hình.
 * Đặt VITE_GA_ID=G-XXXX trong .env để bật. Events:
 * page_view, share_click, install_prompt_accept, invite_accept, recap_save, concierge_ask
 */
let initialized = false;

export const isAnalyticsEnabled = () =>
  typeof import.meta !== "undefined" &&
  Boolean(import.meta.env?.VITE_GA_ID && !String(import.meta.env.VITE_GA_ID).includes("your_"));

export const initAnalytics = () => {
  if (initialized || typeof document === "undefined") return;
  if (!isAnalyticsEnabled()) return;
  const gaId = import.meta.env.VITE_GA_ID;
  try {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", gaId);
    initialized = true;
  } catch {}
};

export const trackPageView = (path = null) => {
  if (!isAnalyticsEnabled() || typeof window === "undefined") return;
  try {
    initAnalytics();
    window.gtag?.("event", "page_view", {
      page_path: path || window.location.pathname + window.location.search,
    });
  } catch {}
};

export const trackEvent = (name, params = {}) => {
  if (!isAnalyticsEnabled() || typeof window === "undefined") return;
  try {
    initAnalytics();
    window.gtag?.("event", name, params);
  } catch {}
};
