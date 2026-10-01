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

export const INITIAL_PLACES = [
  {
    id: "place-1",
    name: "The Workshop Coffee",
    category: "cafe",
    address: "27 Ngo Duc Ke, Quan 1, TP.HCM",
    googleMapsUrl: "https://maps.google.com/?q=The+Workshop+Coffee+27+Ngo+Duc+Ke+Ho+Chi+Minh",
    imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=250&fit=crop&q=80",
    menuItems: ["Ca phe phin truyen thong", "Cold brew", "Banh croissant bo hanh", "Matcha latte"],
    notes: "Khong gian co kinh, nhieu anh sang, rat hop chup anh. Thuong dong vao cuoi tuan.",
    addedBy: "userA",
    addedAt: "2024-03-15T08:00:00Z",
    rating: 5,
    visited: true,
  },
  {
    id: "place-2",
    name: "Propaganda Bistro",
    category: "restaurant",
    address: "21 Han Thuyen, Quan 1, TP.HCM",
    googleMapsUrl: "https://maps.google.com/?q=Propaganda+Bistro+21+Han+Thuyen+Ho+Chi+Minh",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop&q=80",
    menuItems: ["Pho cuon tom nuong", "Bun thit nuong", "Banh mi heo quay", "Sinh to xoai"],
    notes: "Mon Viet Nam hien dai, view nhin ra cong vien. Nen dat ban truoc.",
    addedBy: "userB",
    addedAt: "2024-04-01T10:00:00Z",
    rating: 4,
    visited: true,
  },
  {
    id: "place-3",
    name: "Bui Vien Walking Street",
    category: "entertainment",
    address: "Bui Vien, Phuong Pham Ngu Lao, Quan 1, TP.HCM",
    googleMapsUrl: "https://maps.google.com/?q=Bui+Vien+Walking+Street+Ho+Chi+Minh",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop&q=80",
    menuItems: ["Bia tuoi", "Do an via he", "Cocktail nhiet doi", "Banh trang tron"],
    notes: "Pho di bo soi dong ve dem. Rat nhieu hoat dong giai tri ngoai troi.",
    addedBy: "userA",
    addedAt: "2024-04-10T14:00:00Z",
    rating: 4,
    visited: false,
  },
  {
    id: "place-4",
    name: "L'Usine Dong Khoi",
    category: "cafe",
    address: "70 Le Loi, Quan 1, TP.HCM",
    googleMapsUrl: "https://maps.google.com/?q=L+Usine+70+Le+Loi+Ho+Chi+Minh",
    imageUrl: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=250&fit=crop&q=80",
    menuItems: ["Flat white", "Avocado toast", "Eggs Benedict", "Matcha cheesecake", "Pho bo"],
    notes: "Concept art & lifestyle. Rat dep de chup anh, do an ngon. Gia kha cao.",
    addedBy: "userB",
    addedAt: "2024-04-20T09:00:00Z",
    rating: 5,
    visited: false,
  },
];

export const INITIAL_DATES = [
  {
    id: "date-1",
    placeId: "place-1",
    placeName: "The Workshop Coffee",
    date: "2024-09-28",
    time: "09:30",
    status: "completed",
    notes: "Lần đầu đi cafe buổi sáng cùng nhau. Rất mát mẻ và thư giãn!",
    dressCode: "Trắng giản dị, thoải mái",
    createdBy: "userA",
    createdAt: "2024-09-25T10:00:00Z",
    recap: {
      photos: [
        "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
      ],
      rating: 5,
      foodReview: "Cà phê cold brew thơm nồng vị cam, bánh waffle giòn rụm vừa miệng!",
      bestMoment: "Lúc hai đứa cùng ngồi cạnh cửa sổ ngắm mưa rào và chia sẻ những câu chuyện ngày bé.",
      completedAt: "2024-09-28T12:00:00Z",
      updatedBy: "user1",
    },
    budget: {
      estimatedCost: 200000,
      actualCost: 250000,
      paidBy: "split",
    },
  },
  {
    id: "date-2",
    placeId: "place-2",
    placeName: "Propaganda Bistro",
    date: "2024-10-05",
    time: "18:30",
    status: "upcoming",
    notes: "Bua toi ky niem 1 nam ben nhau. Dat ban VIP ngoai troi.",
    dressCode: "Lich su mot chut, mau pastel",
    createdBy: "userB",
    createdAt: "2024-09-30T20:00:00Z",
    budget: {
      estimatedCost: 650000,
      actualCost: 0,
      paidBy: "user1",
    },
  },
];

export const CATEGORY_CONFIG = {
  cafe: {
    label: "Cafe",
    emoji: "?",
    color: "bg-amber-100 text-amber-700 border border-amber-200",
    gradient: "from-amber-400 to-orange-400",
  },
  restaurant: {
    label: "An uong",
    emoji: "??",
    color: "bg-green-100 text-green-700 border border-green-200",
    gradient: "from-green-400 to-emerald-400",
  },
  entertainment: {
    label: "Giai tri",
    emoji: "??",
    color: "bg-purple-100 text-purple-700 border border-purple-200",
    gradient: "from-purple-400 to-pink-400",
  },
  nature: {
    label: "Thien nhien",
    emoji: "??",
    color: "bg-teal-100 text-teal-700 border border-teal-200",
    gradient: "from-teal-400 to-green-400",
  },
  other: {
    label: "Khac",
    emoji: "??",
    color: "bg-gray-100 text-gray-700 border border-gray-200",
    gradient: "from-gray-400 to-slate-400",
  },
};

export const MILESTONE_MESSAGES = [
  { days: 1, message: "Ngay dau tien - bat dau cua mot tinh yeu dep! ??" },
  { days: 7, message: "1 tuan ben nhau - ky niem nho dau tien! ??" },
  { days: 30, message: "1 thang roi day - tinh yeu dang lon len tung ngay! ??" },
  { days: 100, message: "100 ngay hanh phuc - chuc mung minh nhe! ??" },
  { days: 180, message: "6 thang roi - ban than, nguoi yeu, la tat ca! ??" },
  { days: 365, message: "1 nam ben nhau - mot nam day ky niem dep! ??" },
  { days: 500, message: "500 ngay - tinh yeu cua minh th?t b?n v?ng! ?" },
  { days: 730, message: "2 nam roi - minh la mot phan cua nhau! ??" },
  { days: 1000, message: "1000 ngay - con so dac biet cua tinh yeu! ??" },
  { days: 1461, message: "4 nam - mot hanh trinh tuyet voi cung nhau! ??" },
];
