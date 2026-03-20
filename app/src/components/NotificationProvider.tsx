// ==================== 通知系统 ====================
// 全局Toast通知提供者，支持成功/错误两种类型
// ==================================================

import { createContext, useContext, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "../utils";

// ==================== 类型定义 ====================

type NotificationType = "success" | "error";

interface Notification {
  id: number;
  msg: string;
  type: NotificationType;
}

type AddNotification = (msg: string, type?: NotificationType) => void;

// ==================== Context ====================

const NotificationContext = createContext<AddNotification | null>(null);

export function useNotification(): AddNotification {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}

// ==================== Provider ====================

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification: AddNotification = (msg, type = "success") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={addNotification}>
      {children}

      {/* Toast 堆叠 */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium text-white shadow-lg animate-slide-in-right min-w-[200px]",
              n.type === "success" ? "bg-emerald-600" : "bg-red-500",
            )}
          >
            {n.type === "success" ? (
              <CheckCircle size={15} />
            ) : (
              <XCircle size={15} />
            )}
            {n.msg}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
