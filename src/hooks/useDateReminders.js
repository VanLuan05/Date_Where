import { useEffect, useState, useCallback } from "react";
import {
  checkAndTriggerDateReminders,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestReminderNotification,
} from "../utils/notificationService.js";

/**
 * Hook quan ly theo doi va kich hoat thong bao nhac hen
 * - Kiem tra quyen thong bao truoc khi ban
 * - Luu moc thoi gian da thong bao vao localStorage (tranh trung lap)
 * - Quet dinh ky moi 30 giay va khi mo lai app
 */
export const useDateReminders = (dates = []) => {
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [activeAlert, setActiveAlert] = useState(null);

  // Cap nhat trang thai quyen
  const refreshPermission = useCallback(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Yeu cau quyen thong bao
  const enableNotifications = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === "granted") {
      // Chay quet ngay lap tuc sau khi duoc cap quyen
      await checkAndTriggerDateReminders(dates);
    }
    return res;
  }, [dates]);

  // Gui thong bao thu nghiem
  const triggerTestNotification = useCallback(async (placeName) => {
    return await sendTestReminderNotification(placeName);
  }, []);

  // Quet dinh ky va khi co tuong tac
  useEffect(() => {
    // Quet ngay khi khoi tao hoac khi dates thay doi
    // Chi quet neu da duoc cap quyen
    if (getNotificationPermission() === "granted") {
      checkAndTriggerDateReminders(dates);
    }

    // Quet khi nguoi dung mo lai ung dung tren dien thoai
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshPermission();
        if (getNotificationPermission() === "granted") {
          checkAndTriggerDateReminders(dates);
        }
      }
    };

    const handleFocus = () => {
      refreshPermission();
      if (getNotificationPermission() === "granted") {
        checkAndTriggerDateReminders(dates);
      }
    };

    // Lang nghe su kien in-app de hien thi banner thong bao noi
    const handleInAppReminder = (e) => {
      if (e.detail) {
        setActiveAlert(e.detail);
      }
    };

    // Kiem tra dinh ky moi 30 giay
    const intervalId = setInterval(() => {
      if (getNotificationPermission() === "granted") {
        checkAndTriggerDateReminders(dates);
      }
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
