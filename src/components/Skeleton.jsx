/**
 * Skeleton (P2 Delight)
 * ─────────────────────────────────────────────────
 * Khung xương shimmer thay text "Đang tải..." đơn điệu.
 * Dùng `.shimmer-effect` có sẵn trong index.css + khối bg-rose-100.
 * CSS/Tailwind only, không thêm dependency.
 */

const Block = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`relative overflow-hidden bg-rose-100/80 ${className}`}
  >
    <div className="absolute inset-0 shimmer-effect" />
  </div>
);

const SrLoading = ({ label = "Đang tải nội dung" }) => (
  <span className="sr-only" role="status">
    {label}...
  </span>
);

export const HeroSkeleton = () => (
  <div role="status" aria-label="Đang tải thông tin đôi mình" className="rounded-card bg-gradient-to-br from-rose-100 via-pink-100 to-rose-200 p-5 shadow-card">
    <SrLoading label="Đang tải thông tin đôi mình" />
    <div className="flex items-center justify-center mb-3">
      <div className="flex items-center -space-x-4">
        <Block className="w-[72px] h-[72px] rounded-full ring-4 ring-white/70" />
        <div className="z-10 w-10 h-10 bg-white/80 rounded-full -mx-1" />
        <Block className="w-[72px] h-[72px] rounded-full ring-4 ring-white/70" />
      </div>
    </div>
    <Block className="h-5 w-48 mx-auto rounded-full bg-white/60" />
    <Block className="h-3 w-32 mx-auto rounded-full bg-white/50 mt-2" />
    <div className="bg-white/40 rounded-2xl px-4 py-3 mt-4">
      <Block className="h-10 w-28 mx-auto rounded-xl bg-white/60" />
      <Block className="h-2.5 w-full rounded-full bg-white/50 mt-3" />
    </div>
  </div>
);

export const NextDateSkeleton = () => (
  <div role="status" aria-label="Đang tải buổi hẹn tiếp theo" className="card-static p-4 space-y-3">
    <SrLoading label="Đang tải buổi hẹn tiếp theo" />
    <div className="flex items-center justify-between">
      <Block className="h-6 w-36 rounded-full" />
      <Block className="h-4 w-24 rounded-full" />
    </div>
    <Block className="h-6 w-3/4 rounded-xl" />
    <div className="grid grid-cols-4 gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <Block key={i} className="h-14 rounded-2xl" />
      ))}
    </div>
  </div>
);

export const TimelineSkeleton = () => (
  <div role="status" aria-label="Đang tải timeline" className="card-secondary p-4 space-y-3">
    <SrLoading label="Đang tải timeline" />
    <Block className="h-5 w-44 rounded-full" />
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Block className="w-4 h-4 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Block className="h-4 w-2/3 rounded-lg" />
            <Block className="h-3 w-1/2 rounded-lg" />
          </div>
          <Block className="w-10 h-10 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

export default { HeroSkeleton, NextDateSkeleton, TimelineSkeleton };
