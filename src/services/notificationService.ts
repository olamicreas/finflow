/**
 * Notification Service for CreasPay
 * Coordinates real-time alerts and in-app event notifications.
 */

type NotificationListener = (notification: { title: string; body: string; data?: any }) => void;

const listeners: Set<NotificationListener> = new Set();

export const notificationService = {
  addListener: (listener: NotificationListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  triggerAlert: (title: string, body: string, data?: any) => {
    listeners.forEach((fn) => {
      try {
        fn({ title, body, data });
      } catch (e) {
        console.warn("Notification listener error:", e);
      }
    });
  },
};
