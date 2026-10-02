// Mock data for DateWhere - Khong gian cua doi ta

export const INITIAL_COUPLE = {
  userA: {
    id: "userA",
    name: "Thanh Tien",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Tien&backgroundColor=fecdd3&radius=50",
    color: "#f43f5e",
  },
  userB: {
    id: "userB",
    name: "Bao Nam",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Nam&backgroundColor=bfdbfe&radius=50",
    color: "#3b82f6",
  },
  status: "dating", // "exploring" | "dating"
  startDate: "2024-02-14",
  inviteCode: "LOVE2024",
  isConnected: true,
};

export const INITIAL_PLACES = [];
export const initialPlaces = INITIAL_PLACES;
export const mockPlaces = INITIAL_PLACES;

export const INITIAL_DATES = [];
export const initialDates = INITIAL_DATES;

export const CATEGORY_CONFIG = {
  cafe: {
    label: "Cafe",
    emoji: "☕",
    color: "bg-amber-100 text-amber-700 border border-amber-200",
    gradient: "from-amber-400 to-orange-400",
  },
  restaurant: {
    label: "Ăn uống",
    emoji: "🍽️",
    color: "bg-green-100 text-green-700 border border-green-200",
    gradient: "from-green-400 to-emerald-400",
  },
  entertainment: {
    label: "Giải trí",
    emoji: "🎬",
    color: "bg-purple-100 text-purple-700 border border-purple-200",
    gradient: "from-purple-400 to-pink-400",
  },
  nature: {
    label: "Thiên nhiên",
    emoji: "🌿",
    color: "bg-teal-100 text-teal-700 border border-teal-200",
    gradient: "from-teal-400 to-green-400",
  },
  other: {
    label: "Khác",
    emoji: "✨",
    color: "bg-gray-100 text-gray-700 border border-gray-200",
    gradient: "from-gray-400 to-slate-400",
  },
};

export const MILESTONE_MESSAGES = [
  { days: 1, message: "Ngày đầu tiên - bắt đầu của một tình yêu đẹp! 💕" },
  { days: 7, message: "1 tuần bên nhau - kỷ niệm nhỏ đầu tiên! 🌸" },
  { days: 30, message: "1 tháng rồi đấy - tình yêu đang lớn lên từng ngày! 💖" },
  { days: 100, message: "100 ngày hạnh phúc - chúc mừng đôi mình nhé! 🎉" },
  { days: 180, message: "6 tháng rồi - bạn thân, người yêu, là tất cả! ✨" },
  { days: 365, message: "1 năm bên nhau - một năm đầy kỷ niệm đẹp! 💑" },
  { days: 500, message: "500 ngày - tình yêu của mình thật bền vững! 🌟" },
  { days: 730, message: "2 năm rồi - mình là một phần của nhau! 💞" },
  { days: 1000, message: "1000 ngày - con số đặc biệt của tình yêu! 💐" },
  { days: 1461, message: "4 năm - một hành trình tuyệt vời cùng nhau! 🥂" },
];
