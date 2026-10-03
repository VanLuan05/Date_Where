/**
 * JourneyStatsRow
 * ─────────────────────────────────────────────────
 * 3 stat boxes nằm ngang ở cuối màn hình:
 *  📍 Địa điểm đã đi
 *  📅 Lịch hẹn hoàn thành
 *  📸 Kỷ niệm / Địa điểm đã ghé thăm
 *
 * Không lặp lại "Ngày bên nhau" vì đã nằm ở CoupleHeroCard.
 */
const JourneyStatsRow = ({ placesCount = 0, datesCount = 0, visitedPlacesCount = 0 }) => {
  const stats = [
    {
      icon: "📍",
      label: "Địa điểm",
      value: placesCount,
      gradient: "from-amber-400 to-orange-400",
    },
    {
      icon: "📅",
      label: "Lịch hẹn",
      value: datesCount,
      gradient: "from-blue-400 to-cyan-400",
    },
    {
      icon: "📸",
      label: "Kỷ niệm",
      value: visitedPlacesCount,
      gradient: "from-rose-400 to-pink-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <div key={i} className="card p-4 text-center">
          <div
            className={`w-10 h-10 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}
          >
            <span className="text-lg">{stat.icon}</span>
          </div>
          <div className="font-display text-2xl font-bold text-gray-800">{stat.value}</div>
          <div className="text-xs text-gray-500 mt-0.5 leading-tight">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default JourneyStatsRow;
