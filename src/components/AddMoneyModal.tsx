import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Colors } from "../theme/colors";
import { useFinFlow } from "../context/FinFlowContext";
import { CreasPayLogo } from "./CreasPayLogo";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AddMoneyModal: React.FC<Props> = ({ visible, onClose }) => {
  const { virtualAccount, user, showToast } = useFinFlow();

  const bankName = virtualAccount?.bank_name || "Providus Bank";
  const accountNumber = virtualAccount?.account_number || "0067100155";
  const accountName =
    virtualAccount?.account_name ||
    `CREASPAY / ${(user?.full_name || "VALUED CUSTOMER").toUpperCase()}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(accountNumber);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    showToast("Account number copied!");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: "CreasPay Bank Account Details",
        message: `Fund my CreasPay Wallet:\nBank: ${bankName}\nAccount Number: ${accountNumber}\nAccount Name: ${accountName}\n\nPayments sent to this account credit automatically and instantly 24/7.`,
      });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <CreasPayLogo size={42} />
              <View>
                <Text style={styles.title}>Add Money</Text>
                <Text style={styles.subtitle}>Instant Bank Transfer</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={Colors.textOnSheetMuted} />
            </TouchableOpacity>
          </View>

          {/* Dedicated Virtual Account Card */}
          <View style={styles.accountCard}>
            <View style={styles.accountCardHeader}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>BITNOB INSTANT RAILS</Text>
              </View>
              <Text style={styles.zeroFeeBadge}>0% Fee</Text>
            </View>

            <Text style={styles.fieldLabel}>Bank Name</Text>
            <Text style={styles.bankNameValue}>{bankName}</Text>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Account Number</Text>
            <View style={styles.accountNumRow}>
              <Text style={styles.accountNumValue} selectable>
                {accountNumber}
              </Text>
              <TouchableOpacity
                style={styles.copyPill}
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={15} color="#FFFFFF" />
                <Text style={styles.copyPillText}>Copy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardDivider} />

            <Text style={styles.fieldLabel}>Beneficiary Name</Text>
            <Text style={styles.accountNameValue}>{accountName}</Text>
          </View>

          {/* Explanation Notes */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" style={{ marginTop: 1 }} />
            <Text style={styles.infoText}>
              Transfer from any Nigerian banking app or USSD code. Your CreasPay wallet balance will update automatically in seconds.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={Colors.textOnSheet} />
              <Text style={styles.shareBtnText}>Share Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryCopyBtn}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Ionicons name="copy" size={18} color="#FFFFFF" />
              <Text style={styles.primaryCopyBtnText}>Copy Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textOnSheet,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textOnSheetMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  accountCard: {
    backgroundColor: "#0D111A",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E2638",
  },
  accountCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  livePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 0.5,
  },
  zeroFeeBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FBBF24",
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bankNameValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  accountNumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  accountNumValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#10B981",
    letterSpacing: 1.5,
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#10B981",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#1E2638",
    marginVertical: 14,
  },
  accountNameValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E2E8F0",
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: "#166534",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  primaryCopyBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  primaryCopyBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
