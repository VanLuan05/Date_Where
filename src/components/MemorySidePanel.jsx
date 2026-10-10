import { QrCode, Sparkles, History } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { buildInviteLink, formatDate } from "../utils/helpers.js";

/**
 * P3 — Side-panel kỷ niệm (chỉ desktop lg+).
 * Timeline rút gọn (3 mốc gần nhất) + Concierge tóm tắt + QR invite.
 * Không fetch thêm, chỉ dùng props App đã có. Ẩn hoàn toàn trên mobile.
 */
const MemorySidePanel = ({
  dates = [],
  places = [],
  couple,
  matchedFreeDays = [],
  onOpenInvite,
}) => {
  const code = couple?.coupleCode || couple?.inviteCode || "";
  const link = code ? buildInviteLink(code) : "";
  const done = (dates || [])
    .filter((d) => d && d.status === "completed")
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 3);
  const unvisited = (places || []).filter((p) => !p.visited).length;

  return (
    <aside aria-label="Kỷ niệm nổi bật" className="hidden lg:block lg:sticky lg:top-20 space-y-4">
      {/* Timeline rút gọn */}
      <section className="card-static p-4 space-y-3">
        <h3 className="section-title flex items-center gap-1.5 text-[15px]">
          <History className="w-4 h-4 text-rose-500" /> Kỷ niệm gần đây
        </h3>
        {done.length === 0 ? (
          <p className="text-xs text-gray-600 dark:text-zinc-400">
            Hoàn thành buổi hẹn + recap để timeline tự vẽ nhé 💞
          </p>
        ) : (
          <ol className="space-y-2">
            {done.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 border border-rose-100 dark:border-white/10 rounded-2xl p-2"
              >
                <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--accent-from)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-800 dark:text-zinc-100 truncate">{d.placeName}</p>
                  <p className="text-[11px] text-stone-400 dark:text-zinc-400">{formatDate(d.date)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Concierge tóm tắt */}
      <section className="card-secondary p-4 space-y-2">
        <h3 className="section-title flex items-center gap-1.5 text-[15px]">
          <Sparkles className="w-4 h-4 text-fuchsia-500" /> Concierge tóm tắt
        </h3>
        <p className="text-xs text-gray-600 dark:text-zinc-400">
          {unvisited} quán chưa đi • {matchedFreeDays.length} ngày cùng rảnh
        </p>
        <p className="text-xs text-gray-600 dark:text-zinc-400">
          Mở tab Đôi mình → ✨ Khám phá để xin gợi ý 1 chạm.
        </p>
      </section>

      {/* QR invite */}
      <section className="card-static p-4 text-center space-y-2">
        <h3 className="section-title flex items-center justify-center gap-1.5 text-[15px]">
          <QrCode className="w-4 h-4 text-rose-500" /> Mời người ấy
        </h3>
        {link ? (
          <>
            <div className="bg-white rounded-2xl p-3 inline-block border border-dashed border-rose-200">
              <QRCodeSVG value={link} size={120} level="M" />
            </div>
            <p className="font-mono text-sm font-bold text-rose-700 dark:text-rose-300 tracking-widest">{code}</p>
          </>
        ) : null}
        <button
          type="button"
          onClick={onOpenInvite}
          aria-label="Mở màn hình mời người ấy"
          className="btn-secondary w-full py-2.5 text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          Mở Invite Center 💌
        </button>
      </section>
    </aside>
  );
};

export default MemorySidePanel;
