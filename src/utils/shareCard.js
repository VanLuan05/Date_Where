import html2canvas from "html2canvas";
import { buildInviteLink } from "./helpers.js";

export const SHARE_HASHTAGS = "#DateWhere #DauChanDoiMinh";

export const buildShareText = ({ title, inviteLink, coupleCode }) => {
  const link = inviteLink || (coupleCode ? buildInviteLink(coupleCode) : "");
  return `${title} 💕 ${SHARE_HASHTAGS}${link ? ` — Tham gia cùng đôi mình: ${link}` : ""}`;
};

/** Render 1 DOM node thành PNG dataURL (dùng cho polaroid + story 9:16). */
export const renderNodeToPng = async (node, { scale = 2, backgroundColor = "#fff1f2" } = {}) => {
  if (!node) throw new Error("missing node");
  const canvas = await html2canvas(node, {
    scale,
    backgroundColor,
    useCORS: true,
    logging: false,
  });
  return canvas.toDataURL("image/png");
};

export const downloadPng = (dataUrl, filename = "datewhere.png") => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/**
 * Share PNG qua navigator.share (kèm file) — fallback tải PNG về máy.
 * Trả về "shared" | "downloaded".
 */
export const sharePng = async ({ dataUrl, filename = "datewhere.png", title, text, url }) => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text, url });
      return "shared";
    }
  } catch (err) {
    // Người dùng hủy share hoặc trình duyệt không hỗ trợ → fallback tải PNG
    if (err?.name === "AbortError") return "shared";
  }
  downloadPng(dataUrl, filename);
  return "downloaded";
};
