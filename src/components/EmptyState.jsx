/**
 * EmptyState (P2 Delight)
 * ─────────────────────────────────────────────────
 * Empty-state minh họa thống nhất: emoji/icon lớn trong vòng tròn
 * rose-50 + title + desc + TỐI ĐA 1 CTA chính (btn-primary duy nhất,
 * đúng luật P0 "1 gradient/màn hình"). Muốn nút phụ thì truyền
 * variant="secondary".
 */
const EmptyState = ({
  illustration = "💕",
  title,
  desc,
  actionLabel,
  onAction,
  actionId,
  disabled = false,
  variant = "primary",
}) => (
  <div className="card-static p-8 text-center space-y-3 animate-fade-in">
    <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl select-none">
      {illustration}
    </div>
    {title && (
      <h3 className="font-display font-bold text-base text-stone-800">{title}</h3>
    )}
    {desc && (
      <p className="text-xs text-stone-500 font-serif leading-relaxed max-w-xs mx-auto">
        {desc}
      </p>
    )}
    {actionLabel && (
      <div className="pt-1">
        <button
          type="button"
          id={actionId}
          onClick={onAction}
          disabled={disabled}
          className={
            variant === "primary"
              ? "btn-primary py-2.5 px-5 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
              : "btn-secondary py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
          }
        >
          {actionLabel}
        </button>
      </div>
    )}
  </div>
);

export default EmptyState;
