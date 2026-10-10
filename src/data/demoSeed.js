// Demo seed: 6 quán + 2 date mẫu đẹp cho nút "Dùng thử demo 1 chạm".
// Chỉ dùng khi kho trống; ảnh dùng Unsplash, tọa độ quanh TP.HCM.

export const DEMO_PLACES = [
  {
    name: "The Workshop Coffee",
    category: "cafe",
    address: "27 Ngô Đức Kế, Quận 1, TP.HCM",
    lat: 10.7743, lng: 106.7019,
    priceRange: "50k - 120k",
    description: "Quán specialty coffee trên lầu cao, ánh sáng đẹp, hợp hẹn hò sáng cuối tuần ☕",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
    rating: 5, visited: false, favorite: true,
  },
  {
    name: "Propaganda Bistro",
    category: "restaurant",
    address: "21 Hàn Thuyên, Quận 1, TP.HCM",
    lat: 10.7821, lng: 106.6983,
    priceRange: "150k - 350k",
    description: "Bistro Việt hiện đại, decor sặc sỡ, món ngon để khoe story 🍽️",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    rating: 4, visited: false, favorite: false,
  },
  {
    name: "CGV Crescent Mall",
    category: "entertainment",
    address: "101 Tôn Dật Tiên, Quận 7, TP.HCM",
    lat: 10.7296, lng: 106.722,
    priceRange: "90k - 200k",
    description: "Rạp phim quen thuộc cho buổi hẹn tối, ghế đôi siêu tình cảm 🎬",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    rating: 4, visited: false, favorite: false,
  },
  {
    name: "Cầu Ánh Sao",
    category: "nature",
    address: "Khu đô thị Phú Mỹ Hưng, Quận 7, TP.HCM",
    lat: 10.7298, lng: 106.7215,
    priceRange: "Miễn phí",
    description: "Đi dạo tối ngắm đèn, gió mát, tha hồ tâm sự 🌉",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800",
    rating: 5, visited: false, favorite: true,
  },
  {
    name: "Bánh Tráng Trộn Chú Viên",
    category: "restaurant",
    address: "Nguyễn Thượng Hiền, Quận 3, TP.HCM",
    lat: 10.7792, lng: 106.683,
    priceRange: "20k - 50k",
    description: "Ăn vặt huyền thoại, rẻ mà vui, hợp hẹn hò học sinh 🛵",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    rating: 4, visited: false, favorite: false,
  },
  {
    name: "Thảo Điền Village Walk",
    category: "nature",
    address: "Thảo Điền, TP. Thủ Đức, TP.HCM",
    lat: 10.8019, lng: 106.7333,
    priceRange: "Miễn phí - 100k",
    description: "Khu phố Tây xanh mát, nhiều góc sống ảo cho couple 🌿",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
    rating: 4, visited: false, favorite: false,
  },
];

const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

export const DEMO_DATES = [
  {
    placeName: "The Workshop Coffee",
    date: inDays(2),
    time: "09:00",
    note: "Hẹn hò sáng cuối tuần, thử món cold brew mới ☕💕",
    budget: { estimatedCost: 250000, actualCost: 0, paidBy: "split" },
  },
  {
    placeName: "Cầu Ánh Sao",
    date: inDays(6),
    time: "19:30",
    note: "Đi dạo tối + ăn vặt, nhớ mang áo khoác cho người ấy 🌙",
    budget: { estimatedCost: 150000, actualCost: 0, paidBy: "split" },
  },
];
