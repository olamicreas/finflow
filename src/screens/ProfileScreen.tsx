import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useFinFlow } from "../context/FinFlowContext";
import { PasscodeModal } from "../components/PasscodeModal";
import { api } from "../api/client";

export const ProfileScreen: React.FC = () => {
  const { user, virtualAccount, logout, showToast } = useFinFlow();
  const [pinModalVisible, setPinModalVisible] = useState(false);

  const handleUpdatePin = async (newPin: string) => {
    setPinModalVisible(false);
    try {
      await api.setPasscode(newPin);
      showToast("Transaction PIN updated");
    } catch (err: any) {
      Alert.alert("Update Failed", err.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* JET BLACK TOP HEADER & USER AVATAR HERO */}
      <View style={styles.darkHeader}>
        <View style={styles.topNavRow}>
          <View style={styles.fourDotsGrid}>
            <View style={styles.dotsRow}>
              <View style={styles.gridDot} />
              <View style={styles.gridDot} />
            </View>
            <View style={styles.dotsRow}>
              <View style={styles.gridDot} />
              <View style={styles.gridDot} />
            </View>
          </View>

          <Text style={styles.topNavTitle}>Profile</Text>

          <View style={styles.avatarBtnSmall}>
            <View style={styles.avatarInnerAccentSmall} />
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.profileHero}>
          <View style={styles.heroAvatar}>
            <View style={styles.heroAvatarPinkBlob} />
            <View style={styles.heroAvatarCyanBlob} />
            <Ionicons name="person" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>
            {user?.full_name || "Alex Morgan"}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || "user@finflow.app"}
          </Text>

          <View style={styles.verifiedPill}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            <Text style={styles.verifiedPillText}>Tier 2 Verified</Text>
          </View>
        </View>
      </View>

      {/* CRISP WHITE ROUNDED BOTTOM SHEET */}
      <View style={styles.whiteSheet}>
        <View style={styles.sheetHandle} />

        {/* Account Details Section */}
        <View style={styles.sheetSectionHeader}>
          <Text style={styles.sheetSectionTitle}>Account</Text>
          <View style={styles.twoDots}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        <View style={styles.rowItem}>
          <View style={styles.iconCircle}>
            <Ionicons name="wallet" size={18} color={Colors.textOnSheet} />
          </View>
          <View style={styles.rowMid}>
            <Text style={styles.rowTitle}>Naira Account Number</Text>
            <Text style={styles.rowSub}>
              {virtualAccount?.bank_name || "Wema Bank (ALAT)"}
            </Text>
          </View>
          <Text style={styles.rowRightVal}>
            {virtualAccount?.account_number || "9920148591"}
          </Text>
        </View>

        <View style={styles.rowItem}>
          <View style={styles.iconCircle}>
            <Ionicons name="card" size={18} color={Colors.textOnSheet} />
          </View>
          <View style={styles.rowMid}>
            <Text style={styles.rowTitle}>Card Network</Text>
            <Text style={styles.rowSub}>Global Online Payments</Text>
          </View>
          <Text style={styles.rowRightVal}>VISA</Text>
        </View>

        {/* Security Section */}
        <View style={[styles.sheetSectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sheetSectionTitle}>Security</Text>
          <View style={styles.twoDots}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() => setPinModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="key" size={18} color={Colors.textOnSheet} />
          </View>
          <View style={styles.rowMid}>
            <Text style={styles.rowTitle}>Change Transaction PIN</Text>
            <Text style={styles.rowSub}>Update your 4-digit security code</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.textOnSheetMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowItem}
          onPress={() =>
            Alert.alert("Biometrics", "Face ID / Touch ID is enabled.")
          }
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="finger-print"
              size={18}
              color={Colors.textOnSheet}
            />
          </View>
          <View style={styles.rowMid}>
            <Text style={styles.rowTitle}>Biometric Login</Text>
            <Text style={styles.rowSub}>Face ID & Touch ID</Text>
          </View>
          <Text style={[styles.rowRightVal, { color: Colors.success }]}>
            Active
          </Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <PasscodeModal
        visible={pinModalVisible}
        title="New Transaction PIN"
        subtitle="Enter a new 4-digit security PIN"
        onSuccess={handleUpdatePin}
        onCancel={() => setPinModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  darkHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
  },
  topNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  fourDotsGrid: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 5,
  },
  gridDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  topNavTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  avatarBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentPurple,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  avatarInnerAccentSmall: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    bottom: -6,
    right: -4,
  },
  profileHero: {
    alignItems: "center",
  },
  heroAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.accentPurple,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    marginBottom: 10,
  },
  heroAvatarPinkBlob: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    bottom: -10,
    right: -8,
  },
  heroAvatarCyanBlob: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accentCyan,
    top: -8,
    left: -6,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 10,
    gap: 6,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: Colors.sheetBackground,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 560,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sheetSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textOnSheet,
    letterSpacing: -0.3,
  },
  twoDots: {
    flexDirection: "row",
    gap: 4,
    padding: 6,
  },
  darkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textOnSheet,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sheetSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rowMid: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnSheet,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
  },
  rowRightVal: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textOnSheet,
  },
  logoutBtn: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 28,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.danger,
  },
});
