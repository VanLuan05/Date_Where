import { useEffect, useState } from "react";
import { RefreshCw, Check } from "lucide-react";

const UserSwitchToast = ({ user, visible }) => {
  if (!visible || !user) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-white border border-rose-200 rounded-2xl px-5 py-3 shadow-card">
        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
        <div>
          <p className="text-xs text-gray-500">Da chuyen sang</p>
          <p className="font-semibold text-rose-700">{user.name}</p>
        </div>
        <Check className="w-4 h-4 text-green-500" />
      </div>
    </div>
  );
};
export default UserSwitchToast;
