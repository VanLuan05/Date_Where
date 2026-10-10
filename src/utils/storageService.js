/**
 * storageService.js (Cụm 8)
 * Migrate ảnh recap từ base64 Firestore → Firebase Storage.
 * - compress rồi upload, lưu downloadURL vào date recap
 * - tương thích ngược: isRemoteUrl() phân biệt URL vs base64 cũ (render cả 2)
 * - chưa có Storage (offline/chưa config) → fallback base64 như cũ
 */
import { ref, uploadBytes, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config.js";
import { compressImage } from "./imageCompressor.js";

export const MAX_RECAP_PHOTOS = 10;

export const isRemoteUrl = (s) =>
  typeof s === "string" && (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("gs://"));

export const isBase64Image = (s) =>
  typeof s === "string" && s.startsWith("data:image");

/** Nén + upload 1 File ảnh → downloadURL (hoặc base64 fallback) */
export const uploadRecapPhoto = async (coupleCode, dateId, file, idx = 0, onProgress = null) => {
  const b64 = await compressImage(file, 900, 0.72);
  if (!storage || !coupleCode) return b64; // fallback base64
  try {
    onProgress?.(`Đang tải ảnh ${idx + 1} lên cloud... ☁️`);
    const path = `recaps/${coupleCode}/${dateId}/${Date.now()}_${idx}.jpg`;
    const r = ref(storage, path);
    await uploadString(r, b64, "data_url");
    const url = await getDownloadURL(r);
    return url;
  } catch (err) {
    console.warn("uploadRecapPhoto fallback base64:", err?.message || err);
    return b64;
  }
};

/** Upload 1 File có sẵn (video ngắn) → downloadURL; không Storage → throw để UI báo */
export const uploadRecapVideo = async (coupleCode, dateId, file, onProgress = null) => {
  if (!storage || !coupleCode) throw new Error("NO_STORAGE");
  onProgress?.("Đang tải video lên cloud... ☁️");
  const safeName = `${Date.now()}_${String(file.name || "clip").replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const r = ref(storage, `recaps/${coupleCode}/${dateId}/${safeName}`);
  await uploadBytes(r, file, { contentType: file.type || "video/mp4" });
  return await getDownloadURL(r);
};

/** Kiểm tra thời lượng video ≤ 15s (client-side, không cần server) */
export const getVideoDuration = (file) =>
  new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const dur = v.duration;
        URL.revokeObjectURL(url);
        resolve(dur);
      };
      v.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Không đọc được video."));
      };
      v.src = url;
      setTimeout(() => reject(new Error("Timeout đọc video.")), 8000);
    } catch (e) {
      reject(e);
    }
  });

/** Chuẩn hóa mảng photos: giữ nguyên URL + base64 cũ (tương thích ngược) */
export const normalizePhotos = (photos) =>
  Array.isArray(photos) ? photos.filter((p) => typeof p === "string" && p.length > 0).slice(0, MAX_RECAP_PHOTOS) : [];
