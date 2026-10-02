import { Heart } from "lucide-react";

export const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#fff5f5] via-[#ffe8ec] to-[#ffd6de] select-none">
    <div className="relative flex items-center justify-center mb-4">
      <div className="w-16 h-16 rounded-full bg-rose-300/30 blur-xl animate-portal-radiance pointer-events-none" />
      <div className="relative flex items-center justify-center -space-x-3">
        <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-heart-beat" />
        <Heart className="w-6 h-6 text-pink-400 fill-pink-400 animate-pulse" />
      </div>
    </div>
    <h2 className="font-display text-xl font-bold shimmer-text mb-1">
      DateWhere
    </h2>
    <p className="text-xs text-rose-600/80 font-serif font-medium animate-pulse">
      Đang chuẩn bị không gian cho đôi mình...
    </p>
  </div>
);

export default LoadingScreen;
