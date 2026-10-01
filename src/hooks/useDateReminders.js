import { useEffect, useState, useCallback } from "react";
import {
  checkAndTriggerDateReminders,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestReminderNotification,
} from "../utils/notificationService.js";

/**
 * Hook quản lý theo dõi và kích hoạt thông báo nhắc hẹn
 */
export const useDateReminders = (dates = []) => {
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [activeAlert, setActiveAlert] = useState(null);

  // Cập nhật trạng thái quyền
  const refreshPermission = useCallback(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Yêu cầu quyền thông báo
  const enableNotifications = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === "granted") {
      // Chạy quét ngay lập tức
      await checkAndTriggerDateReminders(dates);
    }
    return res;
  }, [dates]);

  // Gửi thông báo thử nghiệm
  const triggerTestNotification = useCallback(async (placeName) => {
    return await sendTestReminderNotification(placeName);
  }, []);

  // Quét định kỳ và khi có tương tác
  useEffect(() => {
    // Quét ngay khi khởi tạo hoặc khi dates thay đổi
    checkAndTriggerDateReminders(dates);

    // Quét khi người dùng mở lại ứng dụng trên điện thoại (từ màn hình khóa hoặc đa nhiệm)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshPermission();
        checkAndTriggerDateReminders(dates);
      }
    };

    const handleFocus = () => {
      refreshPermission();
      checkAndTriggerDateReminders(dates);
    };

    // Lắng nghe sự kiện in-app để hiển thị banner thông báo nổi
    const handleInAppReminder = (e) => {
      if (e.detail) {
        setActiveAlert(e.detail);
      }
    };

    // Kiểm tra định kỳ mỗi 30 giây
    const intervalId = setInterval(() => {
      checkAndTriggerDateReminders(dates);
    }, 30000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("dw-date-reminder", handleInAppReminder);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("dw-date-reminder", handleInAppReminder);
    };
  }, [dates, refreshPermission]);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  return {
    permission,
    isSupported: permission !== "unsupported",
    isGranted: permission === "granted",
    isPromptable: permission === "default",
    enableNotifications,
    triggerTestNotification,
    activeAlert,
    dismissAlert,
  };
};
