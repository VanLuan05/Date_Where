/**
 * Haptic & Live Touch Service
 * Hỗ trợ Web Vibration API, Web Audio API fallback (iOS Safari) và hiệu ứng thị giác (Floating Hearts, Screen Pulse)
 */

// Web Audio API synthesizer cho nhịp tim chân thực (lub-dub)
export const playHeartbeatSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Nhịp 1: Lub (tiếng đập trầm, nhẹ)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(78, now);
    osc1.frequency.exponentialRampToValueAtTime(38, now + 0.12);

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Nhịp 2: Dub (tiếng đập dứt khoát hơn sau 150ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(68, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(32, now + 0.28);

    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.31);

    // Tự đóng audio context sau khi kết thúc để giải phóng tài nguyên
    setTimeout(() => {
      try {
        ctx.close();
      } catch (_) {}
    }, 600);
  } catch (_) {
    // Trình duyệt chưa cho phép phát âm thanh tự động, bỏ qua an toàn
  }
};

// Hiệu ứng viền màn hình lóe sáng hồng pastel (Visual Pulse Fallback cho iOS Safari)
export const triggerVisualPulse = () => {
  if (typeof document === "undefined") return;

  const existing = document.getElementById("live-touch-visual-pulse");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "live-touch-visual-pulse";
  overlay.className = "heartbeat-screen-pulse-overlay";
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
  }, 900);
};

/**
 * Kích hoạt rung nhịp tim:
 * navigator.vibrate([100, 100, 200, 100, 100])
 * Kèm âm thanh và viền lóe sáng hồng fallback
 */
export const triggerHeartbeatHaptic = () => {
  let vibrated = false;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      vibrated = navigator.vibrate([100, 100, 200, 100, 100]);
    } catch (_) {}
  }

  // Luôn kích hoạt hiệu ứng visual pulse và âm thanh nhẹ
  triggerVisualPulse();
  playHeartbeatSound();

  return vibrated;
};

/**
 * Rung nhẹ một nhịp cho nút bấm tâm trạng nhanh
 */
export const triggerLightTap = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(35);
    } catch (_) {}
  }
};

/**
 * Tạo bong bóng tim bay (Floating Hearts Generator)
 * Sinh các icon trái tim nhỏ bay bổng từ vị trí nút bấm lên trần màn hình
 */
export const generateFloatingHearts = (origin, count = 5) => {
  if (typeof document === "undefined") return;

  let originX = window.innerWidth / 2;
  let originY = window.innerHeight / 2;

  if (origin) {
    if (typeof origin.getBoundingClientRect === "function") {
      const rect = origin.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    } else if (typeof origin.x === "number" && typeof origin.y === "number") {
      originX = origin.x;
      originY = origin.y;
    }
  }

  const heartIcons = ["💖", "💕", "💓", "💗", "❤️", "🌸", "✨", "🥰"];
  const container = document.body;

  for (let i = 0; i < count; i++) {
    const heart = document.createElement("div");
    heart.className = "floating-heart-element";

    const emoji = heartIcons[Math.floor(Math.random() * heartIcons.length)];
    heart.innerText = emoji;

    // Độ lệch ngẫu nhiên
    const xSpread = (Math.random() - 0.5) * 80;
    const ySpread = (Math.random() - 0.5) * 30;
    const size = 18 + Math.random() * 16;
    const duration = 1.3 + Math.random() * 0.8;
    const delay = i * 0.08;
    const rot = (Math.random() - 0.5) * 50;
    const swayX = (Math.random() - 0.5) * 70;

    heart.style.left = `${originX + xSpread}px`;
    heart.style.top = `${originY + ySpread}px`;
    heart.style.fontSize = `${size}px`;
    heart.style.setProperty("--heart-sway-x", `${swayX}px`);
    heart.style.setProperty("--heart-rot", `${rot}deg`);
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay = `${delay}s`;

    container.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, (duration + delay + 0.15) * 1000);
  }
};
