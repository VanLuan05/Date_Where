/**
 * imageCompressor.js
 * Tiện ích nén ảnh client-side sang chuỗi Base64 sử dụng HTML5 Canvas.
 * Tối ưu hóa kích thước tài liệu cho Firestore (thường dao động trong khoảng 30KB - 80KB).
 */

/**
 * Nén một File ảnh từ thiết bị thành chuỗi Base64 JPEG
 * @param {File} file - Đối tượng File từ input file hoặc drag & drop
 * @param {number} maxWidth - Chiều ngang tối đa (mặc định 800px)
 * @param {number} quality - Mức chất lượng nén JPEG (0.1 -> 1.0, mặc định 0.7)
 * @returns {Promise<string>} Chuỗi Base64 data URL (e.g. data:image/jpeg;base64,...)
 */
export const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("Không có tệp ảnh nào được cung cấp."));
    }

    if (!file.type.startsWith("image/")) {
      return reject(new Error("Tệp được chọn không phải là hình ảnh hợp lệ."));
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // Giữ tỷ lệ khung hình và thu nhỏ nếu chiều rộng vượt quá maxWidth
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("Không thể khởi tạo Canvas 2D context."));
          }

          // Kích hoạt làm mịn ảnh chất lượng cao
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Vẽ ảnh lên canvas theo kích thước đã tính toán
          ctx.drawImage(img, 0, 0, width, height);

          // Xuất ảnh ra định dạng JPEG với độ nén tối ưu
          const base64 = canvas.toDataURL("image/jpeg", quality);
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error("Không thể giải mã tệp ảnh từ thiết bị."));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Lỗi khi đọc tệp ảnh từ bộ nhớ thiết bị."));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Tính toán dung lượng ước tính của chuỗi Base64 (KB)
 * @param {string} base64String
 * @returns {number} Kích thước xấp xỉ tính theo KB
 */
export const getBase64SizeInKB = (base64String) => {
  if (!base64String || typeof base64String !== "string") return 0;
  const commaIndex = base64String.indexOf(",");
  const base64Data = commaIndex >= 0 ? base64String.slice(commaIndex + 1) : base64String;
  const padding = base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0;
  const sizeInBytes = (base64Data.length * 3) / 4 - padding;
  return Math.max(1, Math.round(sizeInBytes / 1024));
};
