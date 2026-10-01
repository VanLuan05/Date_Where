import { useState } from "react";
import { Heart, Copy, Check, ArrowRight, Sparkles, Lock, Wifi, WifiOff, Loader2 } from "lucide-react";
import { generateInviteCode } from "../utils/helpers.js";
import { db, isFirebaseConfigured } from "../firebase/config.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { INITIAL_PLACES, INITIAL_DATES } from "../data/mockData.js";

// ─── Pairing Screen ─────────────────────────────────────────────────────────
const PairingScreen = ({ onComplete, onFirebasePairing }) => {
  const [step, setStep] = useState("choose"); // choose | create | join
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [joinName, setJoinName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isOnline = isFirebaseConfigured && db !== null;

  // ── Tạo phòng mới ───────────────────────────────────────────────────────────
  const handleCreateRoom = () => {
    // Thiết bị tạo phòng tự động được gán cứng quyền user1
    localStorage.setItem("date_where_device_role", "user1");
    const code = generateInviteCode();
    setInviteCode(code);
    setStep("create");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** Hoàn tất tạo phòng – ghi lên Firestore (hoặc localStorage nếu offline) */
  const handleCompleteCreation = async () => {
    setError("");
    if (!nameA.trim()) { setError("Bạn chưa nhập tên của mình!"); return; }
    if (!nameB.trim()) { setError("Bạn chưa nhập tên người ấy!"); return; }

    localStorage.setItem("date_where_device_role", "user1");

    const user1Data = {
      id: "user1",
      name: nameA.trim(),
      avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(nameA)}&backgroundColor=fecdd3&radius=50`,
      color: "#f43f5e",
    };

    const user2Data = {
      id: "user2",
      name: nameB.trim(),
      avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(nameB)}&backgroundColor=bfdbfe&radius=50`,
      color: "#3b82f6",
    };

    const coupleData = {
      coupleCode: inviteCode,
      user1: user1Data,
      user2: user2Data,
      userA: user1Data,
      userB: user2Data,
      status: "exploring",
      startDate: "",
      isConnected: true,
    };

    if (isOnline) {
      setLoading(true);
      try {
        await setDoc(doc(db, "couples", inviteCode), {
          ...coupleData,
          places: INITIAL_PLACES,
          dates: INITIAL_DATES,
          createdAt: serverTimestamp(),
        });
        // Thành công → callback lên App
        onFirebasePairing(coupleData, inviteCode);
      } catch (err) {
        console.error("Firebase create room error:", err);
        setError("Không thể kết nối Firestore. Vui lòng kiểm tra cấu hình Firebase.");
        setLoading(false);
      }
    } else {
      // Offline mode: lưu vào localStorage
      onComplete({ ...coupleData, inviteCode });
    }
  };

  // ── Vào phòng đã có ─────────────────────────────────────────────────────────
  const handleJoin = async () => {
    setError("");
    const code = inputCode.trim().toUpperCase();

    if (!code || code.length < 6) {
      setError("Mã kết nối phải có ít nhất 6 ký tự.");
      return;
    }

    if (!joinName.trim()) {
      setError("Bạn chưa nhập tên của mình!");
      return;
    }

    // Thiết bị tham gia tự động được gán cứng quyền user2
    localStorage.setItem("date_where_device_role", "user2");

    if (isOnline) {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "couples", code));
        if (!snap.exists()) {
          setError("❌ Mã kết nối không tồn tại, vui lòng kiểm tra lại.");
          setLoading(false);
          return;
        }

        const data = snap.data();
        const baseUser2 = data.user2 || data.userB || {};
        // Ghi nhận người thứ 2 (user2) với tên thật vừa nhập
        const updatedUser2 = {
          ...baseUser2,
          id: "user2",
          name: joinName.trim(),
          avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(joinName)}&backgroundColor=bfdbfe&radius=50`,
          color: "#3b82f6",
        };

        await updateDoc(doc(db, "couples", code), {
          user2: updatedUser2,
          userB: updatedUser2,
        });

        const user1Data = data.user1 || data.userA;
        const coupleData = {
          coupleCode: code,
          user1: user1Data,
          user2: updatedUser2,
          userA: user1Data,
          userB: updatedUser2,
          status: data.status || "exploring",
          startDate: data.startDate || "",
          isConnected: true,
        };

        onFirebasePairing(coupleData, code);
      } catch (err) {
        console.error("Firebase join room error:", err);
        setError("Lỗi kết nối. Vui lòng thử lại sau.");
        setLoading(false);
      }
    } else {
      // Offline mode – chấp nhận bất kỳ code nào >= 6 ký tự
      if (code.length >= 6) {
        onComplete(null);
      } else {
        setError("Mã không hợp lệ. Hãy thử lại!");
      }
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-romantic flex items-center justify-center p-4">
      {/* Floating hearts bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {["top-10 left-10", "top-1/4 right-8", "bottom-1/4 left-8", "bottom-16 right-16", "top-1/2 left-1/2"].map((pos, i) => (
          <span key={i} className={`absolute ${pos} text-rose-200 text-4xl animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
            {["💕", "💖", "🌸", "💝", "✨"][i]}
          </span>
        ))}
      </div>

      <div className="relative w-full max-w-md">

        {/* ── CHOOSE STEP ── */}
        {step === "choose" && (
          <div className="card-static p-8 text-center animate-slide-up">
            {/* Firebase status badge */}
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full mb-6 ${isOnline
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {isOnline
                ? <><Wifi className="w-3 h-3" /> Chế độ Real-time (Firebase)</>
                : <><WifiOff className="w-3 h-3" /> Chế độ Offline (localStorage)</>
              }
            </div>

            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-romantic animate-bounce-soft">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-rose-800 mb-2">DateWhere</h1>
            <p className="text-rose-400 mb-8 text-sm">Không gian riêng của đôi mình 💕</p>

            <div className="space-y-3">
              <button id="create-room-btn" onClick={handleCreateRoom} className="btn-primary w-full flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Tạo không gian mới
              </button>
              <button
                id="join-room-btn"
                onClick={() => {
                  localStorage.setItem("date_where_device_role", "user2");
                  setStep("join");
                }}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Nhập mã kết nối
              </button>
              {!isOnline && (
                <button
                  id="demo-btn"
                  onClick={() => onComplete(null)}
                  className="text-sm text-gray-400 hover:text-rose-500 transition-colors w-full py-2"
                >
                  Xem demo nhanh →
                </button>
              )}
            </div>

            {!isOnline && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 text-left leading-relaxed">
                ⚠️ <strong>Đang chạy ở chế độ Offline.</strong> Cấu hình Firebase trong <code className="bg-amber-100 px-1 rounded">.env</code> để đồng bộ 2 thiết bị theo thời gian thực.
              </p>
            )}
          </div>
        )}

        {/* ── CREATE STEP ── */}
        {step === "create" && (
          <div className="card-static p-8 animate-slide-up space-y-5">
            <button onClick={() => setStep("choose")} className="text-sm text-rose-400 hover:text-rose-600 flex items-center gap-1">
              ← Quay lại
            </button>
            <div className="text-center">
              <div className="text-4xl mb-2">🔑</div>
              <h2 className="font-display text-xl font-bold text-rose-800">Mã kết nối của đôi mình</h2>
              <p className="text-sm text-gray-500 mt-1">Chia sẻ mã này với người ấy để bắt đầu!</p>
            </div>

            <div className="bg-rose-50 border-2 border-dashed border-rose-300 rounded-2xl p-4 flex items-center justify-between">
              <span className="font-mono text-2xl font-bold text-rose-700 tracking-widest">{inviteCode}</span>
              <button id="copy-code-btn" onClick={handleCopyCode} className="btn-ghost flex items-center gap-1 text-sm">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Đã sao chép!" : "Sao chép"}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Tên của bạn 🌸</label>
                <input
                  id="name-a-input"
                  className="input-field"
                  placeholder="VD: Thanh Tiên"
                  value={nameA}
                  onChange={e => { setNameA(e.target.value); setError(""); }}
                />
              </div>
              <div>
                <label className="label">Tên người ấy 💙</label>
                <input
                  id="name-b-input"
                  className="input-field"
                  placeholder="VD: Bảo Nam"
                  value={nameB}
                  onChange={e => { setNameB(e.target.value); setError(""); }}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

            <button
              id="complete-pairing-btn"
              onClick={handleCompleteCreation}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo phòng...</>
                : <>Bắt đầu hành trình tình yêu <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        )}

        {/* ── JOIN STEP ── */}
        {step === "join" && (
          <div className="card-static p-8 animate-slide-up space-y-5">
            <button onClick={() => setStep("choose")} className="text-sm text-rose-400 hover:text-rose-600">
              ← Quay lại
            </button>
            <div className="text-center">
              <div className="text-4xl mb-2">🔗</div>
              <h2 className="font-display text-xl font-bold text-rose-800">Nhập mã kết nối</h2>
              <p className="text-sm text-gray-500 mt-1">Nhập mã được người ấy gửi cho bạn</p>
            </div>

            <div>
              <label className="label">Mã kết nối</label>
              <input
                id="join-code-input"
                className="input-field text-center font-mono text-xl tracking-widest uppercase"
                placeholder="VD: DW-8821"
                value={inputCode}
                onChange={e => { setInputCode(e.target.value.toUpperCase()); setError(""); }}
                maxLength={12}
              />
            </div>

            <div>
              <label className="label">Tên của bạn 💙</label>
              <input
                id="join-name-input"
                className="input-field"
                placeholder="VD: Bảo Nam"
                value={joinName}
                onChange={e => { setJoinName(e.target.value); setError(""); }}
              />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

            <button
              id="join-btn"
              onClick={handleJoin}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang kết nối...</>
                : <>Kết nối ngay <Heart className="w-4 h-4 fill-white" /></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PairingScreen;
