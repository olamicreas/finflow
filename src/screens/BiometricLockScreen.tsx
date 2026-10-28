import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../theme/colors";
import { CreasPayLogo } from "../components/CreasPayLogo";
import { UserProfile } from "../context/FinFlowContext";

interface Props {
  user: UserProfile | null;
  onUnlock: () => void;
  onLogout: () => void;
}

export const BiometricLockScreen: React.FC<Props> = ({
  user,
  onUnlock,
  onLogout,
}) => {
  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <View style={styles.container}>
      {/* Top Ambient Glow */}
      <LinearGradient
        colors={[
          "rgba(255, 30, 117, 0.28)",
          "rgba(255, 51, 102, 0.08)",
          "transparent",
        ]}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      <View style={styles.contentWrap}>
        {/* CreasPay Logo */}
        <View style={styles.logoWrap}>
          <CreasPayLogo size={42} showText={true} textSize={22} textColor="#FFFFFF" />
        </View>

        {/* Lock Hero */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.biometricCircle}
            onPress={onUnlock}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FF1E75", "#FF3366"]}
              style={styles.biometricGrad}
            >
              <Ionicons name="scan-outline" size={44} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.lockTitle}>CreasPay is Locked</Text>
          <Text style={styles.lockSubtitle}>
            Welcome back, <Text style={styles.userName}>{firstName}</Text>. Verify your Face ID or biometrics to access your account.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={onUnlock}
            activeOpacity={0.85}
          >
            <Ionicons name="finger-print" size={20} color="#FFFFFF" />
            <Text style={styles.unlockBtnText}>Unlock with Face ID</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAccountBtn}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.switchAccountText}>
              Log in with Password / Switch Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  ambientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  contentWrap: {
    width: "100%",
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 60 : 40,
  },
  logoWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  heroSection: {
    alignItems: "center",
    marginVertical: "auto",
  },
  biometricCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 28,
    shadowColor: "#FF1E75",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  biometricGrad: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  lockSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 16,
  },
  userName: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  actionWrap: {
    width: "100%",
    gap: 14,
    marginBottom: Platform.OS === "ios" ? 16 : 10,
  },
  unlockBtn: {
    width: "100%",
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  unlockBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  switchAccountBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  switchAccountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },
});
