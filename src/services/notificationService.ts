import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { api } from "../api/client";

// Configure foreground banner presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const EAS_PROJECT_ID = "1e5b2cd0-b816-4c72-acaf-e347d25b08c6";

export const notificationService = {
  /**
   * Requests notification permissions, retrieves Expo push token, and registers it with CreasPay backend.
   */
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        console.log("Push notifications require a physical device.");
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Permission for push notifications was not granted.");
        return null;
      }

      // Android specific high-priority channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("transactions", {
          name: "Transactions",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF1E75",
        });
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EAS_PROJECT_ID,
      });

      const pushToken = pushTokenData.data;
      if (pushToken) {
        await api.registerPushToken(pushToken).catch((err) => {
          console.warn("Failed to register push token with backend:", err.message);
        });
        return pushToken;
      }
      return null;
    } catch (err: any) {
      console.warn("Error acquiring push token:", err.message);
      return null;
    }
  },

  /**
   * Immediately delivers a native iOS/Android banner alert (useful for foreground real-time events).
   */
  triggerLocalNotification: async (
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: null, // deliver immediately
      });
    } catch (err: any) {
      console.warn("Failed to trigger local notification:", err.message);
    }
  },
};
