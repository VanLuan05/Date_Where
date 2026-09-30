import { useState } from "react";
import { Heart, Copy, Check, ArrowRight, Sparkles, Lock } from "lucide-react";
import { generateInviteCode } from "../utils/helpers.js";

const PairingScreen = ({ onComplete }) => {
  const [step, setStep] = useState("choose"); // choose | create | join
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [error, setError] = useState("");

  const handleCreateRoom = () => {
    const code = generateInviteCode();
    setInviteCode(code);
    setStep("create");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompleteCreation = () => {
    if (!nameA.trim()) { setError("Ban chua nhap ten cua minh!"); return; }
    if (!nameB.trim()) { setError("Ban chua nhap ten nguoi ay!"); return; }
    onComplete({
      userA: { id: "userA", name: nameA.trim(), avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${nameA}&backgroundColor=fecdd3&radius=50`, color: "#f43f5e" },
      userB: { id: "userB", name: nameB.trim(), avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${nameB}&backgroundColor=bfdbfe&radius=50`, color: "#3b82f6" },
      inviteCode,
      isConnected: true,
      status: "exploring",
      startDate: "",
    });
  };

  const handleJoin = () => {
    setError("");
    if (inputCode.toUpperCase() === "LOVE2024" || inputCode.length >= 6) {
      onComplete(null); // Use default data
    } else {
      setError("Ma khong hop le. Hay thu lai!");
    }
  };

  return (
    <div className="min-h-screen bg-romantic flex items-center justify-center p-4">
      {/* Floating hearts bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {["top-10 left-10", "top-1/4 right-8", "bottom-1/4 left-8", "bottom-16 right-16", "top-1/2 left-1/2"].map((pos, i) => (
          <span key={i} className={`absolute ${pos} text-rose-200 text-4xl animate-float`} style={{animationDelay:`${i*0.5}s`}}>
            {["??","??","??","??","??"][i]}
          </span>
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {step === "choose" && (
          <div className="card-static p-8 text-center animate-slide-up">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-romantic animate-bounce-soft">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-rose-800 mb-2">DateWhere</h1>
            <p className="text-rose-400 mb-8 text-sm">Khong gian rieng cua doi minh ??</p>

            <div className="space-y-3">
              <button id="create-room-btn" onClick={handleCreateRoom} className="btn-primary w-full flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Tao phong cho doi minh
              </button>
              <button id="join-room-btn" onClick={() => setStep("join")} className="btn-secondary w-full flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Nhap ma ket noi
              </button>
              <button
                id="demo-btn"
                onClick={() => onComplete(null)}
                className="text-sm text-gray-400 hover:text-rose-500 transition-colors w-full py-2"
              >
                Xem demo ngay ?
              </button>
            </div>
          </div>
        )}

        {step === "create" && (
          <div className="card-static p-8 animate-slide-up space-y-5">
            <button onClick={() => setStep("choose")} className="text-sm text-rose-400 hover:text-rose-600 flex items-center gap-1">
              ? Quay lai
            </button>
            <div className="text-center">
              <div className="text-4xl mb-2">??</div>
              <h2 className="font-display text-xl font-bold text-rose-800">Ma ket noi cua doi minh</h2>
              <p className="text-sm text-gray-500 mt-1">Chia se ma nay voi nguoi ay de bat dau!</p>
            </div>

            <div className="bg-rose-50 border-2 border-dashed border-rose-300 rounded-2xl p-4 flex items-center justify-between">
              <span className="font-mono text-2xl font-bold text-rose-700 tracking-widest">{inviteCode}</span>
              <button id="copy-code-btn" onClick={handleCopyCode} className="btn-ghost flex items-center gap-1 text-sm">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Da sao chep!" : "Sao chep"}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Ten cua ban ?????</label>
                <input id="name-a-input" className="input-field" placeholder="VD: Thanh Tien" value={nameA} onChange={e => { setNameA(e.target.value); setError(""); }} />
              </div>
              <div>
                <label className="label">Ten nguoi ay ?????</label>
                <input id="name-b-input" className="input-field" placeholder="VD: Bao Nam" value={nameB} onChange={e => { setNameB(e.target.value); setError(""); }} />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

            <button id="complete-pairing-btn" onClick={handleCompleteCreation} className="btn-primary w-full flex items-center justify-center gap-2">
              Bat dau hanh trinh tinh yeu <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === "join" && (
          <div className="card-static p-8 animate-slide-up space-y-5">
            <button onClick={() => setStep("choose")} className="text-sm text-rose-400 hover:text-rose-600">
              ? Quay lai
            </button>
            <div className="text-center">
              <div className="text-4xl mb-2">??</div>
              <h2 className="font-display text-xl font-bold text-rose-800">Nhap ma ket noi</h2>
              <p className="text-sm text-gray-500 mt-1">Nhap ma duoc nguoi ay gui cho ban</p>
            </div>

            <div>
              <label className="label">Ma ket noi</label>
              <input
                id="join-code-input"
                className="input-field text-center font-mono text-xl tracking-widest uppercase"
                placeholder="VD: LOVE2024"
                value={inputCode}
                onChange={e => { setInputCode(e.target.value.toUpperCase()); setError(""); }}
                maxLength={10}
              />
              <p className="text-xs text-gray-400 mt-1 text-center">Goi y: Thu "LOVE2024" de xem demo</p>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

            <button id="join-btn" onClick={handleJoin} className="btn-primary w-full flex items-center justify-center gap-2">
              Ket noi ngay <Heart className="w-4 h-4 fill-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PairingScreen;
