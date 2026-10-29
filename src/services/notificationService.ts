/**
 * Device-Level Push & Real-Time Notification Service for CreasPay
 * Coordinates native iOS/Android device push banners, haptic alerts, and background tokens.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications should behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationListener = (notification: { title: string; body: string; data?: any }) => void;

const listeners: Set<NotificationListener> = new Set();
let isInitialized = false;

export const notificationService = {
  addListener: (listener: NotificationListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Initializes device notification permissions and Android channels.
   */
  initNotifications: async () => {
    if (isInitialized || Platform.OS === "web") return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Transactions",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#6C5CE7",
        });
      }
      isInitialized = true;
    } catch (err) {
      console.warn("Failed to initialize notification permissions:", err);
    }
  },

  /**
   * Fetches Expo Push Token and syncs it with the CreasPay backend.
   */
  registerPushToken: async (syncWithBackendFn?: (token: string) => Promise<any>): Promise<string | null> => {
    if (Platform.OS === "web") return null;
    try {
      await notificationService.initNotifications();
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        return null;
      }

      const tokenObj = await Notifications.getExpoPushTokenAsync({
        projectId: "1e5b2cd0-b816-4c72-acaf-e347d25b08c6",
      });

      const token = tokenObj?.data;
      if (token && syncWithBackendFn) {
        await syncWithBackendFn(token).catch((e) => {
          console.warn("Error syncing push token with backend:", e);
        });
      }
      return token || null;
    } catch (err) {
      console.warn("Push token acquisition error:", err);
      return null;
    }
  },

  /**
   * Triggers an immediate device-level OS push notification (banner + sound + lock screen)
   * AND informs any active in-app toast listeners.
   */
  triggerAlert: async (title: string, body: string, data?: any) => {
    // 1. Notify in-app UI listeners
    listeners.forEach((fn) => {
      try {
        fn({ title, body, data });
      } catch (e) {
        console.warn("In-app notification listener error:", e);
      }
    });

    // 2. Schedule native OS device notification immediately
    if (Platform.OS !== "web") {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
            badge: 1,
            data: data || {},
          },
          trigger: null, // deliver immediately
        });
      } catch (err) {
        console.warn("Native device push notification trigger error:", err);
      }
    }
  },
};
