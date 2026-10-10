import { useState } from "react";
import { X, Copy, Check, Share2, QrCode, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { buildInviteLink, normalizeInviteCode } from "../utils/helpers.js";
import { trackEvent } from "../utils/analytics.js";
import { useModalDismiss } from "../hooks/useModalDismiss.js";

/**
 * InviteCenterModal — Trung tâm mời người ấy:
 * QR + invite-link ?code=DW-XXXX + Copy + Share (Zalo/Messenger/navigator.share).
 * Dùng chung ở Header, Dashboard, CoupleSettingsModal.
 */
const InviteCenterModal = ({ isOpen, onClose, coupleCode }) => {
  const [copied, setCopied] = useState(false);
  const swipeHandlers = useModalDismiss(onClose, isOpen);
  if (!isOpen) return null;

  const code = normalizeInviteCode(coupleCode || "");
  const link = code ? buildInviteLink(code) : "";
  const shareText = `💕 Tham gia không gian riêng của đôi mình trên DateWhere nhé! Nhập mã ${code} hoặc bấm link: ${link} #DateWhere #DauChanDoiMinh`;

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || link);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text || link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {}
    }
    setCopied(true);
    try { trackEvent("share_click", { method: "copy", code }); } catch {}
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "DateWhere — Lời mời của đôi mình", text: shareText, url: link });
        try { trackEvent("share_click", { method: "native", code }); } catch {}
        return;
      } catch {}
    }
    handleCopy(shareText);
  };

  const openZalo = () => {
    window.open(`https://sp.zalo.me/share_inline?link=${encodeURIComponent(link)}`, "_blank", "noopener");
  };
  const openMessenger = () => {
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=0&redirect_uri=${encodeURIComponent(link)}`, "_blank", "noopener");
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="modal-box max-w-sm text-center">
        <div className="modal-header" {...swipeHandlers}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <h2 className="font-display font-bold text-gray-800 text-base">Mời người ấy</h2>
              <p className="text-xs text-gray-400">Quét QR hoặc gửi link là vào ngay</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-2xl hover:bg-rose-50 flex items-center justify-center transition-colors" aria-label="Đóng">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {!code ? (
            <p className="text-sm text-gray-500">Chưa có mã kết nối. Hãy tạo không gian trước nhé!</p>
          ) : (
            <>
              <div className="bg-white border border-dashed border-rose-200 rounded-2xl p-4 inline-block">
                <QRCodeSVG value={link} size={180} level="M" />
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
                <p className="font-mono text-2xl font-bold text-rose-700 tracking-widest">{code}</p>
                <p className="text-[11px] text-gray-500 break-all mt-1">{link}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleCopy(link)} className="btn-secondary py-2.5 text-sm flex items-center justify-center gap-1.5">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Đã chép!" : "Copy link"}
                </button>
                <button onClick={handleNativeShare} className="btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5">
                  <Share2 className="w-4 h-4" /> Chia sẻ
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={openZalo} className="py-2.5 rounded-2xl bg-[#0068ff]/10 border border-[#0068ff]/30 text-[#0068ff] text-sm font-semibold hover:bg-[#0068ff]/15 transition-colors flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-4 h-4" /> Zalo
                </button>
                <button onClick={openMessenger} className="py-2.5 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/30 text-[#0084ff] text-sm font-semibold hover:bg-[#0084ff]/15 transition-colors flex items-center justify-center gap-1.5">
                  <Share2 className="w-4 h-4" /> Messenger
                </button>
              </div>
              <p className="text-[11px] text-gray-400">Người ấy mở link → nhập tên + avatar là vào ngay 💕</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteCenterModal;
