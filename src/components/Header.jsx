import { Heart, RefreshCw, Users } from "lucide-react";

const Header = ({ couple, currentUser, onSwitchUser }) => {
  if (!couple) return null;
  const user = couple[currentUser];
  const other = couple[currentUser === "userA" ? "userB" : "userA"];

  return (
    <header className="sticky top-0 z-40 glass border-b border-rose-100/60 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-romantic">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-rose-700 text-base leading-none">DateWhere</h1>
            <p className="text-[10px] text-rose-400 font-medium">Khong gian cua doi ta</p>
          </div>
        </div>

        {/* Switch User */}
        <button
          id="switch-user-btn"
          onClick={onSwitchUser}
          className="flex items-center gap-2 bg-white/90 border border-rose-200 rounded-2xl px-3 py-2 
                     hover:border-rose-400 hover:shadow-romantic transition-all duration-200 group"
          title="Doi nguoi dung"
        >
          <div className="flex items-center -space-x-2">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full ring-2 ring-white object-cover"
            />
            <img
              src={other.avatar}
              alt={other.name}
              className="w-7 h-7 rounded-full ring-2 ring-white object-cover opacity-50"
            />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-gray-400 leading-none">Dang la</p>
            <p className="text-xs font-semibold text-rose-700 leading-none">{user.name}</p>
          </div>
          <RefreshCw className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>
    </header>
  );
};

export default Header;
