import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

  const handleUnlockPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUnlock();
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrap}>
        {/* CreasPay Logo - Minimalist Monochrome + Pink Touch */}
        <View style={styles.logoWrap}>
          <CreasPayLogo size={36} showText={true} textSize={20} textColor="#FFFFFF" />
        </View>

        {/* Lock Hero */}
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.biometricCircle}
            onPress={handleUnlockPress}
            activeOpacity={0.7}
          >
            <View style={styles.biometricInner}>
              <Ionicons name="scan-outline" size={38} color="#FFFFFF" />
              {/* Subtle signature pink accent dot */}
              <View style={styles.accentDot} />
            </View>
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
            onPress={handleUnlockPress}
            activeOpacity={0.85}
          >
            <Ionicons name="scan" size={19} color="#07070C" />
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
    backgroundColor: "#07070C",
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrap: {
    width: "100%",
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 64 : 44,
  },
  logoWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  heroSection: {
    alignItems: "center",
    marginVertical: "auto",
  },
  biometricCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 26,
  },
  biometricInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  accentDot: {
    position: "absolute",
    bottom: 18,
    right: 18,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: "center",
  },
  lockSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#94A3B8",
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
    gap: 12,
    marginBottom: Platform.OS === "ios" ? 16 : 10,
  },
  unlockBtn: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  unlockBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#07070C",
    letterSpacing: -0.2,
  },
  switchAccountBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  switchAccountText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
});
