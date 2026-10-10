import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Smartphone, Heart, Sparkles } from "lucide-react";
import { trackEvent } from "../utils/analytics.js";

const DISMISSED_KEY = "date_where_pwa_dismissed";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState("unknown"); // "android" | "ios" | "unknown"
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra nếu đã mở ở chế độ App Standalone (đã cài đặt)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      return; // Đã cài đặt PWA, không hiển thị
    }

    // 2. Kiểm tra nếu người dùng đã từng tắt thông báo trong phiên này
    if (sessionStorage.getItem(DISMISSED_KEY) === "1") {
      return;
    }

    // 3. Nhận diện thiết bị iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafariBrowser =
      ua.includes("safari") &&
      !ua.includes("chrome") &&
      !ua.includes("crios") &&
      !ua.includes("fxios");

    if (isIosDevice) {
      setPlatform("ios");
      // Hiển thị gợi ý sau 2 giây để tránh gián đoạn trải nghiệm ban đầu
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // 4. Lắng nghe sự kiện beforeinstallprompt (Android / Chrome / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleInstallClick = async () => {
    if (platform === "android" && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        try { trackEvent("install_prompt_accept", { platform }); } catch {}
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (platform === "ios") {
      setShowIosGuide(true);
    }
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* ── BANNER GỢI Ý CÀI ĐẶT DƯỚI ĐÁY MÀN HÌNH ── */}
      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 animate-slide-up">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border-2 border-rose-200/90 flex items-center justify-between gap-3 text-stone-800">
          {/* App Icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-md">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 font-serif">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-stone-800">DateWhere App</span>
              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full font-semibold">
                PWA
              </span>
            </div>
            <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
              {platform === "ios"
                ? "Thêm ra Màn hình chính để mở toàn màn hình"
                : "Cài đặt ứng dụng để mở nhanh không cần link"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0 font-sans">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              {platform === "ios" ? (
                <>
                  <Share className="w-3.5 h-3.5" />
                  <span>Hướng dẫn</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Cài đặt</span>
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── POPUP HƯỚNG DẪN CÀI ĐẶT CHO IOS (SAFARI) ── */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-slide-up border border-rose-100 text-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base leading-tight">
                    Cài đặt trên iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-stone-400 font-serif">Mở toàn màn hình không thanh URL</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-serif text-xs text-stone-600">
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-rose-50/50 border border-rose-100/60">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs font-sans">
                  1
                </span>
                <div>
                  <p className="font-semibold text-stone-800">
                    Bấm nút <span className="text-rose-600">Chia sẻ</span> (biểu tượng hình vuông có mũi tên lên) ở thanh dưới cùng Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-rose-50/50 border border-rose-100/60">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs font-sans">
                  2
                </span>
                <div>
                  <p className="font-semibold text-stone-800">
                    Cuộn xuống và chọn <span className="text-rose-600">"Thêm vào Màn hình chính"</span> (Add to Home Screen).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-rose-50/50 border border-rose-100/60">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs font-sans">
                  3
                </span>
                <div>
                  <p className="font-semibold text-stone-800">
                    Bấm nút <span className="text-rose-600">"Thêm" (Add)</span> ở góc trên bên phải để hoàn tất.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="btn-primary w-full py-2.5 text-xs font-semibold font-sans mt-2"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
