import { useRef, useState } from "react";
import { X, Share2, Download, Camera } from "lucide-react";
import { renderNodeToPng, sharePng, buildShareText, SHARE_HASHTAGS } from "../utils/shareCard.js";
import { buildInviteLink } from "../utils/helpers.js";
import { useModalDismiss } from "../hooks/useModalDismiss.js";

/**
 * ShareCardModal — Nút "Khoe" render PNG polaroid + story 9:16.
 * kind: "hero" (cột mốc ngày yêu) | "memory" (kỷ niệm buổi hẹn).
 * Share native (navigator.share + file) — fallback tải PNG.
 */
const ShareCardModal = ({ isOpen, onClose, kind = "hero", data = {}, coupleCode }) => {
  const polaroidRef = useRef(null);
  const storyRef = useRef(null);
  const [busy, setBusy] = useState(null); // "polaroid" | "story" | null
  const [status, setStatus] = useState("");
  const swipeHandlers = useModalDismiss(onClose, isOpen);

  if (!isOpen) return null;

  const inviteLink = coupleCode ? buildInviteLink(coupleCode) : "";
  const isHero = kind === "hero";

  const title = isHero
    ? `${data.names || "Đôi mình"} — ${data.days ?? 0} ngày bên nhau`
    : `Kỷ niệm tại ${data.placeName || "nơi hẹn hò"}`;

  const handleCapture = async (which) => {
    const node = which === "story" ? storyRef.current : polaroidRef.current;
    setBusy(which);
    setStatus("");
    try {
      const dataUrl = await renderNodeToPng(node, { scale: 2 });
      const filename = which === "story" ? `datewhere-story-${Date.now()}.png` : `datewhere-khoe-${Date.now()}.png`;
      const result = await sharePng({
        dataUrl,
        filename,
        title: "DateWhere",
        text: buildShareText({ title, inviteLink }),
        url: inviteLink || undefined,
      });
      setStatus(result === "shared" ? "Đã chia sẻ 💕" : "Đã tải PNG về máy 📥");
    } catch {
      setStatus("Không tạo được ảnh, thử lại nhé!");
    } finally {
      setBusy(null);
      setTimeout(() => setStatus(""), 2500);
    }
  };

  const card = (variant) => {
    const isStory = variant === "story";
    if (isHero) {
      return (
        <div
          className="relative overflow-hidden text-center text-white"
          style={{
            width: isStory ? 270 : 300,
            height: isStory ? 480 : "auto",
            minHeight: isStory ? 480 : 0,
            background: "linear-gradient(160deg,#f43f5e,#ec4899 55%,#f97316)",
            borderRadius: 24,
            padding: isStory ? "40px 20px 24px" : "28px 20px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: isStory ? "space-between" : "flex-start",
          }}
        >
          <div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>💕 DateWhere 💕</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{data.names || "Đôi mình"}</div>
            <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1 }}>{data.days ?? 0}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>ngày bên nhau</div>
            {data.message && (
              <div style={{ fontSize: 12, fontStyle: "italic", opacity: 0.9, marginTop: 8 }}>{data.message}</div>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            {data.avatars?.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                {data.avatars.slice(0, 2).map((a, i) => (
                  <img key={i} src={a} alt="" style={{ width: 52, height: 52, borderRadius: "50%", border: "3px solid #fff", objectFit: "cover" }} />
                ))}
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700 }}>{SHARE_HASHTAGS}</div>
            {coupleCode && <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, marginTop: 2 }}>{coupleCode}</div>}
          </div>
        </div>
      );
    }
    // memory template
    return (
      <div
        className="relative overflow-hidden bg-white"
        style={{
          width: isStory ? 270 : 300,
          height: isStory ? 480 : "auto",
          borderRadius: 24,
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {data.photo && (
          <img src={data.photo} alt="" style={{ width: "100%", height: isStory ? 240 : 190, objectFit: "cover" }} />
        )}
        <div style={{ padding: "16px 18px", background: "#fff" }}>
          <div style={{ fontSize: 11, color: "#f43f5e", fontWeight: 800 }}>💕 DATEWHERE MEMORY 💕</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#881337", marginTop: 2 }}>{data.placeName || "Buổi hẹn đáng nhớ"}</div>
          <div style={{ fontSize: 12, color: "#78716c" }}>{data.dateStr || ""}</div>
          {typeof data.rating === "number" && (
            <div style={{ fontSize: 18, marginTop: 4 }}>{"❤️".repeat(Math.max(1, Math.min(5, data.rating)))}</div>
          )}
          {data.quote && (
            <div style={{ fontSize: 13, fontStyle: "italic", color: "#44403c", marginTop: 6 }}>“{data.quote}”</div>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f43f5e", marginTop: 10 }}>{SHARE_HASHTAGS}</div>
          {coupleCode && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#881337" }}>{coupleCode}</div>}
        </div>
        {isStory && <div style={{ flex: 1, background: "linear-gradient(180deg,#fff1f2,#fecdd3)" }} />}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal-box max-w-md">
        <div className="modal-header" {...swipeHandlers}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-800 text-base">Khoe khoảnh khắc 📸</h2>
              <p className="text-xs text-gray-400">Polaroid + story 9:16, kèm link mời đôi mình</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-2xl hover:bg-rose-50 flex items-center justify-center transition-colors" aria-label="Đóng">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="modal-body space-y-5">
          <div>
            <p className="label">Polaroid</p>
            <div ref={polaroidRef} className="inline-block shadow-card rounded-3xl">{card("polaroid")}</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => handleCapture("polaroid")} disabled={busy === "polaroid"} className="btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                <Share2 className="w-4 h-4" /> {busy === "polaroid" ? "Đang tạo..." : "Chia sẻ"}
              </button>
              <button
                onClick={async () => {
                  setBusy("polaroid");
                  try {
                    const { renderNodeToPng: r, downloadPng: d } = await import("../utils/shareCard.js");
                    d(await r(polaroidRef.current, { scale: 2 }), `datewhere-khoe-${Date.now()}.png`);
                  } finally { setBusy(null); }
                }}
                className="btn-secondary py-2.5 text-sm flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Tải PNG
              </button>
            </div>
          </div>

          <div>
            <p className="label">Story 9:16</p>
            <div ref={storyRef} className="inline-block shadow-card rounded-3xl">{card("story")}</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => handleCapture("story")} disabled={busy === "story"} className="btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                <Share2 className="w-4 h-4" /> {busy === "story" ? "Đang tạo..." : "Chia sẻ"}
              </button>
              <button
                onClick={async () => {
                  setBusy("story");
                  try {
                    const { renderNodeToPng: r, downloadPng: d } = await import("../utils/shareCard.js");
                    d(await r(storyRef.current, { scale: 2 }), `datewhere-story-${Date.now()}.png`);
                  } finally { setBusy(null); }
                }}
                className="btn-secondary py-2.5 text-sm flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Tải PNG
              </button>
            </div>
          </div>

          {status && <p className="text-center text-sm text-emerald-600 font-medium">{status}</p>}
          <p className="text-[11px] text-gray-400 text-center break-all">{buildShareText({ title, inviteLink })}</p>
        </div>
      </div>
    </div>
  );
};

export default ShareCardModal;
