import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Colors } from "../theme/colors";
import { formatNGN } from "../utils/formatters";
import { useFinFlow } from "../context/FinFlowContext";
import { ArtisticCardArt } from "../components/ArtisticCardArt";
import { api } from "../api/client";

export const ReceiveMoneyScreen: React.FC = () => {
  const { virtualAccount, ngnWallet, refreshData, showToast } = useFinFlow();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [testAmount, setTestAmount] = useState("50000");
  const [isDepositing, setIsDepositing] = useState(false);

  const copyToClipboard = async (text: string, fieldName: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldName);
    showToast(`${fieldName} copied`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateDeposit = async () => {
    const amt = parseFloat(testAmount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid deposit amount.");
      return;
    }

    setIsDepositing(true);
    try {
      const res = await api.simulateDeposit(
        amt,
        "Bank Transfer",
        `Transfer to ${virtualAccount?.account_number}`
      );
      await refreshData();
      showToast(`₦${amt.toLocaleString()} credited`);
      Alert.alert(
        "Deposit Received",
        `₦${res.amount.toLocaleString()} has been added to your Naira balance.\nUpdated balance: ${formatNGN(
          (ngnWallet?.balance || 0) + amt
        )}`
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* JET BLACK TOP HEADER & BALANCE HERO */}
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

          <Text style={styles.topNavTitle}>Add Money</Text>

          <View style={styles.avatarBtn}>
            <View style={styles.avatarInnerAccent} />
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.balanceHero}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>
            {formatNGN(ngnWallet?.balance || 0)}
          </Text>
        </View>
      </View>

      {/* CRISP WHITE ROUNDED BOTTOM SHEET */}
      <View style={styles.whiteSheet}>
        <View style={styles.sheetHandle} />

        {/* Dedicated Virtual Account Card (Using Artistic Black Card Style) */}
        <View style={styles.sheetSectionHeader}>
          <Text style={styles.sheetSectionTitle}>Bank Account</Text>
          <View style={styles.twoDots}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        <View style={styles.artAccountCard}>
          <ArtisticCardArt />

          <View style={styles.vaTopRow}>
            <Text style={styles.vaBankBadge}>
              {virtualAccount?.bank_name || "Wema Bank (ALAT)"}
            </Text>
            <Text style={styles.vaTag}>NGN ACCOUNT</Text>
          </View>

          <View style={styles.vaMiddleBlock}>
            <Text style={styles.vaAccLabel}>Account Number</Text>
            <View style={styles.vaNumberRow}>
              <Text style={styles.vaAccNumber}>
                {virtualAccount?.account_number || "9920148591"}
              </Text>
              <TouchableOpacity
                style={styles.vaCopyPill}
                onPress={() =>
                  virtualAccount &&
                  copyToClipboard(
                    virtualAccount.account_number,
                    "Account number"
                  )
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    copiedField === "Account number"
                      ? "checkmark"
                      : "copy-outline"
                  }
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.vaCopyPillText}>
                  {copiedField === "Account number" ? "Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.vaBottomRow}>
            <Text style={styles.vaHolderLabel}>BENEFICIARY</Text>
            <Text style={styles.vaHolderName} numberOfLines={1}>
              {virtualAccount?.account_name || "FINFLOW / ALEX MORGAN"}
            </Text>
          </View>
        </View>

        {/* Instant Top Up Section on White Sheet */}
        <View style={[styles.sheetSectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sheetSectionTitle}>Instant Top Up</Text>
          <View style={styles.twoDots}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Amount to Add (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="50,000"
          placeholderTextColor={Colors.textOnSheetMuted}
          keyboardType="numeric"
          value={testAmount}
          onChangeText={setTestAmount}
        />

        {/* Quick Preset Chips */}
        <View style={styles.chipsRow}>
          {[20000, 50000, 100000, 250000].map((val) => {
            const active = testAmount === val.toString();
            return (
              <TouchableOpacity
                key={val}
                style={[styles.amountChip, active && styles.amountChipActive]}
                onPress={() => setTestAmount(val.toString())}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  ₦{val.toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.simBtn}
          onPress={handleSimulateDeposit}
          disabled={isDepositing}
          activeOpacity={0.85}
        >
          {isDepositing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.simBtnText}>
              Add ₦{parseFloat(testAmount || "0").toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 22,
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
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentPurple,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  avatarInnerAccent: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    bottom: -6,
    right: -4,
  },
  balanceHero: {
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: Colors.sheetBackground,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 620,
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
    marginBottom: 14,
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
  artAccountCard: {
    backgroundColor: "#0B0B12",
    borderRadius: 26,
    padding: 24,
    height: 196,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#090912",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 10,
  },
  vaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vaBankBadge: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  vaTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  vaMiddleBlock: {
    marginVertical: 4,
  },
  vaAccLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  vaNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vaAccNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  vaCopyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11, 11, 18, 0.65)",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    gap: 6,
  },
  vaCopyPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  vaBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vaHolderLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.8,
  },
  vaHolderName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  amountChip: {
    flex: 1,
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
  },
  amountChipActive: {
    backgroundColor: Colors.textOnSheet,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  simBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  simBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
