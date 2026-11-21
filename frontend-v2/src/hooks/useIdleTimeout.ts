"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface UseIdleTimeoutOptions {
  /**
   * Thời gian không tương tác trước khi hiển thị cảnh báo (ms).
   * Mặc định: 15 phút (15 * 60 * 1000 ms).
   */
  idleTimeMs?: number;

  /**
   * Thời gian đếm ngược cảnh báo trước khi tự động đăng xuất (giây).
   * Mặc định: 60 giây.
   */
  countdownSeconds?: number;

  /**
   * Callback được kích hoạt khi hết thời gian đếm ngược (0s).
   */
  onIdleTimeout: () => void;

  /**
   * Trạng thái kích hoạt theo dõi (chỉ bật khi user đã đăng nhập).
   * Mặc định: true.
   */
  enabled?: boolean;
}

export interface UseIdleTimeoutReturn {
  isWarningOpen: boolean;
  countdown: number;
  resetTimer: () => void;
}

const DEFAULT_IDLE_TIME = 15 * 60 * 1000; // 15 phút
const DEFAULT_COUNTDOWN = 60; // 60 giây
const STORAGE_ACTIVITY_KEY = "fptu_last_activity";
const THROTTLE_INTERVAL = 1000; // 1000ms throttle

export function useIdleTimeout({
  idleTimeMs = DEFAULT_IDLE_TIME,
  countdownSeconds = DEFAULT_COUNTDOWN,
  onIdleTimeout,
  enabled = true,
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(countdownSeconds);

  const lastActivityRef = useRef<number>(0);
  const lastThrottleRef = useRef<number>(0);
  const isWarningOpenRef = useRef<boolean>(false);
  const isTimedOutRef = useRef<boolean>(false);
  const onIdleTimeoutRef = useRef(onIdleTimeout);

  // Giữ ref callback luôn cập nhật
  useEffect(() => {
    onIdleTimeoutRef.current = onIdleTimeout;
  }, [onIdleTimeout]);

  // Đồng bộ ref isWarningOpen
  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  /**
   * Hàm reset timer tương tác:
   * Được gọi rõ ràng khi bấm "Tiếp tục" trong modal cảnh báo.
   */
  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastThrottleRef.current = now;
    isTimedOutRef.current = false;
    isWarningOpenRef.current = false;
    setIsWarningOpen(false);
    setCountdown(countdownSeconds);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_ACTIVITY_KEY, now.toString());
      } catch {
        // Quota hoặc chế độ bảo mật trình duyệt
      }
    }
  }, [countdownSeconds]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      isWarningOpenRef.current = false;
      return;
    }

    if (lastActivityRef.current === 0) {
      lastActivityRef.current = Date.now();
    }

    // Khởi tạo timestamp hoạt động từ localStorage hoặc hiện tại
    try {
      const stored = localStorage.getItem(STORAGE_ACTIVITY_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed <= Date.now()) {
          lastActivityRef.current = Math.max(lastActivityRef.current, parsed);
        }
      } else {
        localStorage.setItem(STORAGE_ACTIVITY_KEY, Date.now().toString());
      }
    } catch {
      // Bỏ qua lỗi truy cập storage
    }

    /**
     * Lắng nghe tương tác người dùng: mousemove, keydown, click, scroll, touchstart.
     * Throttled ở mức 1000ms.
     * Trong lúc modal cảnh báo đang mở, BỎ QUA các cử động chuột thụ động;
     * Chỉ thao tác click rõ ràng vào nút "Tiếp tục" mới gọi resetTimer().
     */
    const handleUserActivity = () => {
      if (isWarningOpenRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastThrottleRef.current < THROTTLE_INTERVAL) {
        return;
      }
      lastThrottleRef.current = now;
      lastActivityRef.current = now;

      // Đồng bộ hoạt động sang các tab khác
      try {
        localStorage.setItem(STORAGE_ACTIVITY_KEY, now.toString());
      } catch {
        // Bỏ qua
      }
    };

    /**
     * Lắng nghe sự kiện storage từ các tab khác để đồng bộ thời gian hoạt động
     */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_ACTIVITY_KEY && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime) && remoteTime > lastActivityRef.current) {
          lastActivityRef.current = remoteTime;
          // Nếu tab này đang mở modal nhưng tab khác có hoạt động, tự đóng modal
          if (isWarningOpenRef.current) {
            isWarningOpenRef.current = false;
            setIsWarningOpen(false);
            setCountdown(countdownSeconds);
          }
        }
      }
    };

    const userEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    userEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });
    window.addEventListener("storage", handleStorageChange);

    /**
     * Kiểm tra định kỳ mỗi giây dựa trên timestamp delta (Date.now() - lastActivityRef.current)
     * Tránh bị sai lệch khi tab chuyển vào background hoặc máy tính sleep.
     */
    const intervalId = setInterval(() => {
      if (isTimedOutRef.current) return;

      const now = Date.now();

      // Kiểm tra xem tab khác có hoạt động mới hơn không
      try {
        const storedStr = localStorage.getItem(STORAGE_ACTIVITY_KEY);
        if (storedStr) {
          const storedTime = parseInt(storedStr, 10);
          if (!isNaN(storedTime) && storedTime > lastActivityRef.current) {
            lastActivityRef.current = storedTime;
            if (isWarningOpenRef.current) {
              isWarningOpenRef.current = false;
              setIsWarningOpen(false);
              setCountdown(countdownSeconds);
            }
          }
        }
      } catch {
        // Bỏ qua
      }

      const elapsed = now - lastActivityRef.current;

      if (elapsed >= idleTimeMs) {
        // Đã đạt ngưỡng không hoạt động 15 phút
        const totalAllowedMs = idleTimeMs + countdownSeconds * 1000;
        const remainingMs = totalAllowedMs - elapsed;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

        if (remainingSec <= 0) {
          // Hết 60 giây đếm ngược: Gọi callback đăng xuất
          isTimedOutRef.current = true;
          isWarningOpenRef.current = false;
          setIsWarningOpen(false);
          setCountdown(0);
          onIdleTimeoutRef.current();
        } else {
          // Mở modal cảnh báo và cập nhật số giây đếm ngược
          if (!isWarningOpenRef.current) {
            isWarningOpenRef.current = true;
            setIsWarningOpen(true);
          }
          setCountdown(remainingSec);
        }
      } else {
        // Vẫn trong thời gian hoạt động bình thường
        if (isWarningOpenRef.current) {
          isWarningOpenRef.current = false;
          setIsWarningOpen(false);
          setCountdown(countdownSeconds);
        }
      }
    }, 1000);

    return () => {
      userEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, [enabled, idleTimeMs, countdownSeconds]);

  return {
    isWarningOpen: enabled ? isWarningOpen : false,
    countdown,
    resetTimer,
  };
}
