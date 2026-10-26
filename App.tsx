import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "./src/theme/colors";
import { FinFlowProvider, useFinFlow } from "./src/context/FinFlowContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { CardsScreen } from "./src/screens/CardsScreen";
import { SendMoneyScreen } from "./src/screens/SendMoneyScreen";
import { ReceiveMoneyScreen } from "./src/screens/ReceiveMoneyScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { BillsScreen } from "./src/screens/BillsScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { AddMoneyModal } from "./src/components/AddMoneyModal";

type TabType = "Home" | "Cards" | "Bills" | "Send" | "Profile";

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("Home");
  const [initialBillCat, setInitialBillCat] = useState<"airtime" | "data" | "electricity" | "cable">("airtime");
  const { isAuthenticated, toastMessage, addMoneyModalVisible, setAddMoneyModalVisible } = useFinFlow();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
        <AuthScreen />
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    const navigationHelper = {
      navigate: (screen: string, params?: { category?: "airtime" | "data" | "electricity" | "cable" }) => {
        if (screen === "Receive" || screen === "Add") {
          setAddMoneyModalVisible(true);
          return;
        }
        if (screen === "Bills" && params?.category) {
          setInitialBillCat(params.category);
        }
        if (["Home", "Cards", "Bills", "Send", "Profile"].includes(screen)) {
          setActiveTab(screen as TabType);
        }
      },
    };

    switch (activeTab) {
      case "Home":
        return <HomeScreen navigation={navigationHelper} />;
      case "Cards":
        return <CardsScreen />;
      case "Bills":
        return <BillsScreen navigation={navigationHelper} initialCategory={initialBillCat} />;
      case "Send":
        return <SendMoneyScreen />;
      case "Profile":
        return <ProfileScreen />;
      default:
        return <HomeScreen navigation={navigationHelper} />;
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "Home", label: "Bank", icon: "home-outline" },
    { id: "Cards", label: "Cards", icon: "card-outline" },
    { id: "Bills", label: "Bills", icon: "flash-outline" },
    { id: "Send", label: "Send", icon: "paper-plane-outline" },
    { id: "Profile", label: "Profile", icon: "person-outline" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Instant Add Money Modal */}
      <AddMoneyModal
        visible={addMoneyModalVisible}
        onClose={() => setAddMoneyModalVisible(false)}
      />

      {/* Active Screen View */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Clean White Bottom Navigation Bar (Merges seamlessly with White Sheet) */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconBox}>
                <Ionicons
                  name={isActive ? (tab.icon.replace("-outline", "") as any) : tab.icon}
                  size={21}
                  color={isActive ? Colors.primary : Colors.textOnSheetMuted}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <FinFlowProvider key="v2-earnings">
        <MainApp key="home-earnings" />
      </FinFlowProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 20,
    alignSelf: "center",
    backgroundColor: Colors.surfaceElevated,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    zIndex: 9999,
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: Colors.sheetBorder,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
  },
  tabIconBox: {
    padding: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textOnSheetMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: "800",
  },
});
