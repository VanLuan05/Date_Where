import { useEffect, useState } from "react";
import { Heart, Copy, Check, ArrowRight, Sparkles, Lock, WifiOff, Loader2, Share2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateInviteCode, buildInviteLink, isValidInviteCode, normalizeInviteCode } from "../utils/helpers.js";
import { db, isFirebaseConfigured } from "../firebase/config.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// Pairing Screen — Onboarding 30s: 2 nút chính Tạo/Nhập.
// Tạo xong sinh ngay invite-link ?code=DW-XXXX + QR + Copy + Share.
// Join qua link (?code=) được auto-fill, chỉ nhập tên + avatar DiceBear.
const PairingScreen = ({ onComplete, onFirebasePairing, initialCode = "" }) => {
  const [step, setStep] = useState("choose"); // choose | create | join | done
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [joinName, setJoinName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCouple, setCreatedCouple] = useState(null);

  const isOnline = isFirebaseConfigured && db !== null;

  // Auto-fill từ ?code= (App.jsx parse sẵn)
  useEffect(() => {
    const clean = normalizeInviteCode(initialCode || "");
    if (clean && isValidInviteCode(clean)) {
      setInputCode(clean);
      localStorage.setItem("date_where_device_role", "user2");
      setStep("join");
    }
  }, [initialCode]);

  const joinAvatar = joinName.trim()
    ? `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(joinName.trim())}&backgroundColor=bfdbfe&radius=50`
    : "";

  // ── Tạo phòng mới ──
  const handleCreateRoom = () => {
    localStorage.setItem("date_where_device_role", "user1");
    setInviteCode(generateInviteCode());
    setStep("create");
  };

  const handleCopy = (text) => {
    const t = text || inviteCode;
    try {
      navigator.clipboard.writeText(t).catch(() => {});
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (text) => {
    const link = buildInviteLink(inviteCode);
    const shareText = text || `💕 Tham gia không gian riêng của đôi mình trên DateWhere nhé! Mã ${inviteCode} — link: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "DateWhere — Lời mời của đôi mình", text: shareText, url: link });
        return;
      } catch {}
    }
    handleCopy(shareText);
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
          places: [],
          dates: [],
          createdAt: serverTimestamp(),
        });
        // Tạo xong → hiện màn hình share link/QR trước khi vào app
        setCreatedCouple(coupleData);
        setStep("done");
      } catch (err) {
        console.error("Firebase create room error:", err);
        setError("Không thể kết nối Firestore. Vui lòng kiểm tra cấu hình Firebase.");
      } finally {
        setLoading(false);
      }
    } else {
      onComplete({ ...coupleData, inviteCode });
    }
  };

  const handleEnterAfterCreate = () => {
    if (createdCouple) onFirebasePairing(createdCouple, inviteCode);
  };

  // ── Vào phòng đã có ──
  const handleJoin = async () => {
    setError("");
    const code = normalizeInviteCode(inputCode);

    if (!isValidInviteCode(code)) {
      setError("Mã kết nối phải dạng DW-XXXX (4–6 ký tự chữ/số).");
      return;
    }
    if (!joinName.trim()) {
      setError("Bạn chưa nhập tên của mình!");
      return;
    }

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
        const updatedUser2 = {
          ...baseUser2,
          id: "user2",
          name: joinName.trim(),
          avatar: joinAvatar,
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

        // Đo sự kiện invite_accept đơn giản
        try {
          const payload = { code, at: new Date().toISOString(), via: "link" };
          localStorage.setItem("dw_invite_accept", JSON.stringify(payload));
          console.info("[invite_accept]", payload);
        } catch {}

        onFirebasePairing(coupleData, code);
      } catch (err) {
        console.error("Firebase join room error:", err);
        setError("Lỗi kết nối. Vui lòng thử lại sau.");
        setLoading(false);
      }
    } else {
      if (isValidInviteCode(code)) {
        onComplete(null);
      } else {
        setError("Mã không hợp lệ. Hãy thử lại!");
      }
    }
  };

  const inviteLink = inviteCode ? buildInviteLink(inviteCode) : "";
  const fromInviteLink = Boolean(normalizeInviteCode(initialCode || ""));

  return (
    <div className="min-h-screen bg-romantic flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {["top-10 left-10", "top-1/4 right-8", "bottom-1/4 left-8", "bottom-16 right-16", "top-1/2 left-1/2"].map((pos, i) => (
          <span key={i} className={`absolute ${pos} text-rose-200 text-4xl animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
            {["💕", "💖", "🌸", "💝", "✨"][i]}
          </span>
        ))}
      </div>

      <div className="relative w-full max-w-md">

        {/* ── CHOOSE: chỉ 2 nút chính ── */}
        {step === "choose" && (
          <div className="card-static p-8 text-center animate-slide-up">
            {!isOnline && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full mb-6 bg-amber-50 text-amber-700 border border-amber-200">
                <WifiOff className="w-3 h-3" /> Chế độ Offline (localStorage)
              </div>
            )}

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
                <button id="demo-btn" onClick={() => onComplete(null)} className="text-sm text-gray-400 hover:text-rose-500 transition-colors w-full py-2">
                  Xem demo nhanh →
                </button>
              )}
              <a
                href={`${import.meta.env.BASE_URL || "/Date_Where/"}landing.html`}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-rose-300 hover:text-rose-500 transition-colors w-full py-1"
              >
                Tìm hiểu thêm về DateWhere
              </a>
            </div>

            {!isOnline && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 text-left leading-relaxed">
                ⚠️ <strong>Đang chạy ở chế độ Offline.</strong> Cấu hình Firebase trong <code className="bg-amber-100 px-1 rounded">.env</code> để đồng bộ 2 thiết bị theo thời gian thực.
              </p>
            )}
          </div>
        )}

        {/* ── CREATE ── */}
        {step === "create" && (
          <div className="card-static p-8 animate-slide-up space-y-5">
            <button onClick={() => setStep("choose")} className="text-sm text-rose-400 hover:text-rose-600 flex items-center gap-1">
              ← Quay lại
            </button>
            <div className="text-center">
              <div className="text-4xl mb-2">🔑</div>
              <h2 className="font-display text-xl font-bold text-rose-800">Mã kết nối của đôi mình</h2>
              <p className="text-sm text-gray-500 mt-1">Nhập tên 2 bạn (chỉ 30 giây) rồi gửi link cho người ấy!</p>
            </div>

            <div className="bg-rose-50 border-2 border-dashed border-rose-300 rounded-2xl p-4 flex items-center justify-between">
              <span className="font-mono text-2xl font-bold text-rose-700 tracking-widest">{inviteCode}</span>
              <button id="copy-code-btn" onClick={() => handleCopy(inviteCode)} className="btn-ghost flex items-center gap-1 text-sm">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Đã sao chép!" : "Sao chép"}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Tên của bạn 🌸</label>
                <input id="name-a-input" className="input-field" placeholder="VD: Thanh Tiên" value={nameA}
                  onChange={e => { setNameA(e.target.value); setError(""); }} />
              </div>
              <div>
                <label className="label">Tên người ấy 💙</label>
                <input id="name-b-input" className="input-field" placeholder="VD: Bảo Nam" value={nameB}
                  onChange={e => { setNameB(e.target.value); setError(""); }} />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

            <button id="complete-pairing-btn" onClick={handleCompleteCreation} disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo phòng...</>
                : <>Tạo link mời <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        )}

        {/* ── DONE: invite-link + QR + Copy + Share ── */}
        {step === "done" && (
          <div className="card-static p-8 animate-slide-up space-y-5 text-center">
            <div className="text-4xl">💌</div>
            <h2 className="font-display text-xl font-bold text-rose-800">Gửi link này cho người ấy!</h2>
            <p className="text-sm text-gray-500">Người ấy mở link → nhập tên là vào ngay, không cần gõ mã.</p>

            <div className="bg-white border-2 border-dashed border-rose-200 rounded-2xl p-4 inline-block">
              <QRCodeSVG value={inviteLink} size={170} level="M" />
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
              <p className="font-mono text-2xl font-bold text-rose-700 tracking-widest">{inviteCode}</p>
              <p className="text-[11px] text-gray-500 break-all mt-1">{inviteLink}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleCopy(inviteLink)} className="btn-secondary py-2.5 text-sm flex items-center justify-center gap-1.5">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Đã chép!" : "Copy link"}
              </button>
              <button onClick={() => handleShare()} className="btn-secondary py-2.5 text-sm flex items-center justify-center gap-1.5">
                <Share2 className="w-4 h-4" /> Zalo / Share
              </button>
            </div>

            <button id="enter-app-btn" onClick={handleEnterAfterCreate} className="btn-primary w-full flex items-center justify-center gap-2">
              Vào app ngay <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1"><QrCode className="w-3 h-3" /> Mở Invite Center bất kỳ lúc nào bằng nút QR trên thanh Header</p>
          </div>
        )}

        {/* ── JOIN: auto-fill ?code=, chỉ nhập tên + avatar ── */}
        {step === "join" && (
          <div className="card-static p-8 animate-slide-up space-y-5">
            <button onClick={() => setStep("choose")} className="text-sm text-rose-400 hover:text-rose-600">
              ← Quay lại
            </button>
            <div className="text-center">
              <div className="text-4xl mb-2">🔗</div>
              <h2 className="font-display text-xl font-bold text-rose-800">Nhập mã kết nối</h2>
              <p className="text-sm text-gray-500 mt-1">
                {fromInviteLink ? "💌 Bạn được mời! Chỉ cần nhập tên là vào ngay." : "Nhập mã được người ấy gửi cho bạn"}
              </p>
            </div>

            {fromInviteLink && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-sm text-emerald-700 text-center">
                Link mời hợp lệ — mã đã tự điền sẵn ✨
              </div>
            )}

            <div>
              <label className="label">Mã kết nối</label>
              <input id="join-code-input" className="input-field text-center font-mono text-xl tracking-widest uppercase"
                placeholder="VD: DW-8821A" value={inputCode}
                onChange={e => { setInputCode(normalizeInviteCode(e.target.value)); setError(""); }}
                maxLength={9} />
            </div>

            <div>
              <label className="label">Tên của bạn 💙</label>
              <div className="flex items-center gap-3">
                {joinAvatar && <img src={joinAvatar} alt="avatar xem trước" loading="lazy" className="w-12 h-12 rounded-2xl ring-2 ring-rose-200 bg-rose-50 object-cover shrink-0" />}
                <input id="join-name-input" className="input-field" placeholder="VD: Bảo Nam" value={joinName}
                  onChange={e => { setJoinName(e.target.value); setError(""); }} />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Avatar tự tạo từ tên (DiceBear) — vào app đổi sau vẫn được.</p>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

            <button id="join-btn" onClick={handleJoin} disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
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
