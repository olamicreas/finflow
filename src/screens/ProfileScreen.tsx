import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Colors } from "../theme/colors";
import { useFinFlow } from "../context/FinFlowContext";
import { PasscodeModal } from "../components/PasscodeModal";
import { CreasPayLogo } from "../components/CreasPayLogo";
import { api } from "../api/client";

export const ProfileScreen: React.FC = () => {
  const {
    user,
    virtualAccount,
    refreshData,
    logout,
    showToast,
    isBiometricEnabled,
    toggleBiometrics,
  } = useFinFlow();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);

  // KYC Verification Form State
  const [kycBvn, setKycBvn] = useState(user?.bvn || "");
  const [kycDob, setKycDob] = useState(user?.date_of_birth || "");
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.bvn && !kycBvn) {
      setKycBvn(user.bvn);
    }
    if (user?.date_of_birth && !kycDob) {
      setKycDob(user.date_of_birth);
    }
  }, [user]);

  const isVerified = user?.kyc_status === "verified" && !!virtualAccount;

  const formatDobInput = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  };

  const validateDob = (d: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(d)) return false;
    const [year, month, day] = d.split("-").map(Number);
    if (year < 1920 || year > 2012) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    return true;
  };

  const handleKycSubmit = async () => {
    setKycError(null);
    const cleanBvn = kycBvn.trim();
    const cleanDob = kycDob.trim();

    if (!cleanBvn || cleanBvn.length !== 11) {
      setKycError("Please enter your valid 11-digit BVN.");
      return;
    }

    if (!validateDob(cleanDob)) {
      setKycError("Please enter a valid Date of Birth in YYYY-MM-DD format (e.g. 1995-05-12).");
      return;
    }

    setKycLoading(true);
    try {
      const res = await api.submitKyc({
        id_type: "bvn",
        id_number: cleanBvn,
        date_of_birth: cleanDob,
      });

      await refreshData();
      showToast("Providus Bank account generated!");

      const generatedAcc = res?.virtual_account?.account_number || "generated";
      Alert.alert(
        "KYC Verified! 🎉",
        `Your dedicated Providus Bank virtual account (${generatedAcc}) has been created successfully. You can now receive instant bank transfers and issue USD Virtual Cards.`
      );
    } catch (err: any) {
      setKycError(err.message || "Failed to verify KYC and generate bank account. Please check your BVN.");
    } finally {
      setKycLoading(false);
    }
  };

  const handleCopyAccount = async (num: string) => {
    await Clipboard.setStringAsync(num);
    setCopiedAcc(true);
    showToast("Bank account number copied!");
    setTimeout(() => setCopiedAcc(false), 2000);
  };

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
      keyboardShouldPersistTaps="handled"
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

          <CreasPayLogo size={24} showText textSize={17} textColor="#FFFFFF" />

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
            {user?.full_name || "Abdul Quayyum"}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || "user@creaspay.com"}
          </Text>

          {isVerified ? (
            <View style={styles.verifiedPill}>
              <CreasPayLogo size={14} />
              <Text style={styles.verifiedPillText}>CreasPay Verified • Tier 2</Text>
            </View>
          ) : (
            <View style={styles.unverifiedPill}>
              <Ionicons name="alert-circle" size={14} color="#F59E0B" />
              <Text style={styles.unverifiedPillText}>Unverified • Tier 1 (Action Required)</Text>
            </View>
          )}
        </View>
      </View>

      {/* CRISP WHITE ROUNDED BOTTOM SHEET */}
      <View style={styles.whiteSheet}>
        <View style={styles.sheetHandle} />

        {/* KYC VERIFICATION SECTION (RENDERED WHEN UNVERIFIED OR NO VIRTUAL ACCOUNT) */}
        {!isVerified && (
          <View style={styles.kycSectionCard}>
            <View style={styles.kycSectionHeaderRow}>
              <View style={styles.kycHeaderTitleWrap}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                <Text style={styles.kycCardHeading}>KYC & Bank Setup</Text>
              </View>
              <View style={styles.kycPendingBadge}>
                <Text style={styles.kycPendingBadgeText}>Action Needed</Text>
              </View>
            </View>

            <Text style={styles.kycCardDesc}>
              Complete your KYC verification with your BVN and Date of Birth to generate your dedicated Providus Bank account and unlock USD Virtual Cards.
            </Text>

            {kycError ? (
              <View style={styles.kycErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.kycErrorText}>{kycError}</Text>
              </View>
            ) : null}

            {/* Read-Only Legal Full Name (from Registration) */}
            <View style={styles.kycFieldGroup}>
              <View style={styles.kycLabelRow}>
                <Text style={styles.kycFieldLabel}>Full Legal Name</Text>
                <View style={styles.kycMatchedBadge}>
                  <Ionicons name="checkmark-circle" size={11} color="#10B981" />
                  <Text style={styles.kycMatchedText}>From Registration</Text>
                </View>
              </View>
              <View style={styles.kycReadOnlyBox}>
                <Ionicons name="lock-closed" size={15} color={Colors.textOnSheetMuted} style={{ marginRight: 8 }} />
                <Text style={styles.kycReadOnlyText}>{user?.full_name || "Valued User"}</Text>
              </View>
              <Text style={styles.kycFieldHint}>Matches your account registration name.</Text>
            </View>

            {/* BVN Input */}
            <View style={styles.kycFieldGroup}>
              <Text style={styles.kycFieldLabel}>11-Digit BVN</Text>
              <View style={styles.kycInputBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textOnSheetMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.kycTextInput}
                  placeholder="e.g. 22234567890"
                  placeholderTextColor="#9CA3AF"
                  value={kycBvn}
                  onChangeText={setKycBvn}
                  keyboardType="number-pad"
                  maxLength={11}
                />
              </View>
              <Text style={styles.kycFieldHint}>Verified securely with Bitnob rails.</Text>
            </View>

            {/* Date of Birth Input */}
            <View style={styles.kycFieldGroup}>
              <Text style={styles.kycFieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <View style={styles.kycInputBox}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.kycTextInput}
                  placeholder="YYYY-MM-DD (e.g. 1995-05-12)"
                  placeholderTextColor="#9CA3AF"
                  value={kycDob}
                  onChangeText={(val) => setKycDob(formatDobInput(val))}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
              <Text style={styles.kycFieldHint}>Required format: YYYY-MM-DD (e.g. 1995-05-12).</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.kycSubmitBtn, kycLoading && styles.kycSubmitBtnDisabled]}
              onPress={handleKycSubmit}
              disabled={kycLoading}
              activeOpacity={0.85}
            >
              {kycLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.kycSubmitBtnText}>Verify & Generate Bank Account</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Account Details Section */}
        <View style={[styles.sheetSectionHeader, !isVerified && { marginTop: 24 }]}>
          <Text style={styles.sheetSectionTitle}>Account</Text>
          <View style={styles.twoDots}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        {/* Providus Virtual Account Row */}
        {virtualAccount ? (
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => handleCopyAccount(virtualAccount.account_number)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="wallet" size={18} color={Colors.textOnSheet} />
            </View>
            <View style={styles.rowMid}>
              <Text style={styles.rowTitle}>Naira Account Number</Text>
              <Text style={styles.rowSub}>
                {virtualAccount.bank_name || "Providus Bank"}
              </Text>
            </View>
            <View style={styles.accountCopyRow}>
              <Text style={styles.rowRightVal}>{virtualAccount.account_number}</Text>
              <Ionicons
                name={copiedAcc ? "checkmark-circle" : "copy-outline"}
                size={14}
                color={Colors.primary}
                style={{ marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.rowItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="wallet-outline" size={18} color="#9CA3AF" />
            </View>
            <View style={styles.rowMid}>
              <Text style={styles.rowTitle}>Naira Account Number</Text>
              <Text style={styles.rowSub}>Requires KYC Verification</Text>
            </View>
            <Text style={[styles.rowRightVal, { color: "#F59E0B", fontSize: 12 }]}>
              Pending KYC
            </Text>
          </View>
        )}

        {/* Card Network */}
        <View style={styles.rowItem}>
          <View style={styles.iconCircle}>
            <Ionicons name="card" size={18} color={Colors.textOnSheet} />
          </View>
          <View style={styles.rowMid}>
            <Text style={styles.rowTitle}>Card Network</Text>
            <Text style={styles.rowSub}>CreasPay USD Virtual Visa</Text>
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
          onPress={() => toggleBiometrics(!isBiometricEnabled)}
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
          <Text
            style={[
              styles.rowRightVal,
              { color: isBiometricEnabled ? Colors.success : Colors.textOnSheetMuted },
            ]}
          >
            {isBiometricEnabled ? "Active" : "Disabled"}
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

        {/* CreasPay Brand Footer */}
        <View style={styles.brandFooter}>
          <CreasPayLogo size={20} showText textSize={14} textColor={Colors.textOnSheetMuted} />
          <Text style={styles.brandFooterText}>
            CreasPay v1.0.0 • Verified Bitnob USD Issuance
          </Text>
        </View>
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
  unverifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 10,
    gap: 6,
  },
  unverifiedPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FBBF24",
  },
  // KYC Verification Card Styles
  kycSectionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 18,
    marginBottom: 8,
  },
  kycSectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  kycHeaderTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kycCardHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textOnSheet,
    letterSpacing: -0.2,
  },
  kycPendingBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  kycPendingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kycCardDesc: {
    fontSize: 12,
    color: Colors.textOnSheetMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  kycErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  kycErrorText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#B91C1C",
  },
  kycFieldGroup: {
    marginBottom: 12,
  },
  kycLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  kycFieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheet,
    marginBottom: 5,
  },
  kycMatchedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kycMatchedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  kycReadOnlyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  kycReadOnlyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  kycInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  kycTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textOnSheet,
  },
  kycFieldHint: {
    fontSize: 10,
    color: Colors.textOnSheetMuted,
    marginTop: 4,
    marginLeft: 2,
  },
  kycSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 46,
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  kycSubmitBtnDisabled: {
    opacity: 0.65,
  },
  kycSubmitBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  accountCopyRow: {
    flexDirection: "row",
    alignItems: "center",
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
  brandFooter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 8,
    gap: 6,
  },
  brandFooterText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
  },
});
