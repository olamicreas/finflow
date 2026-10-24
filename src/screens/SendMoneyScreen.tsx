import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { formatNGN } from "../utils/formatters";
import { useFinFlow } from "../context/FinFlowContext";
import { PasscodeModal } from "../components/PasscodeModal";
import { api } from "../api/client";

export const SendMoneyScreen: React.FC = () => {
  const { ngnWallet, refreshData, showToast } = useFinFlow();

  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [searchBankQuery, setSearchBankQuery] = useState("");

  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);

  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadBanks();
    loadBeneficiaries();
  }, []);

  const loadBanks = async () => {
    try {
      const bankList = await api.getBanks();
      setBanks(bankList);
      if (bankList.length > 0) {
        setSelectedBank(bankList[0]);
      }
    } catch (e) {
      console.warn("Could not load banks:", e);
    }
  };

  const loadBeneficiaries = async () => {
    try {
      const bens = await api.getBeneficiaries();
      setBeneficiaries(bens);
    } catch {
      setBeneficiaries([]);
    }
  };

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      resolveAccount(accountNumber, selectedBank.code);
    } else {
      setResolvedName(null);
    }
  }, [accountNumber, selectedBank?.code]);

  const resolveAccount = async (accNum: string, bankCode: string) => {
    setIsResolving(true);
    setResolvedName(null);
    try {
      const res = await api.resolveAccount(accNum, bankCode);
      setResolvedName(res.account_name);
    } catch {
      setResolvedName(null);
    } finally {
      setIsResolving(false);
    }
  };

  const handleSelectBeneficiary = (ben: any) => {
    setAccountNumber(ben.account_number);
    const matchingBank = banks.find((b) => b.code === ben.bank_code);
    if (matchingBank) {
      setSelectedBank(matchingBank);
    }
    setResolvedName(ben.account_name);
  };

  const handleInitiateTransfer = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 50) {
      Alert.alert("Invalid Amount", "Minimum transfer amount is ₦50.");
      return;
    }
    if (amountNum > (ngnWallet?.balance || 0)) {
      Alert.alert(
        "Insufficient Balance",
        "Your Naira balance does not have enough funds."
      );
      return;
    }
    if (!resolvedName) {
      Alert.alert(
        "Unverified Account",
        "Please verify the 10-digit account number before sending."
      );
      return;
    }
    setPasscodeModalVisible(true);
  };

  const handlePasscodeSuccess = async (pin: string) => {
    setPasscodeModalVisible(false);
    setIsSending(true);
    try {
      const res = await api.sendTransfer({
        account_bank: selectedBank.code,
        account_number: accountNumber,
        amount: parseFloat(amount),
        narration: narration.trim() || undefined,
        save_beneficiary: saveBeneficiary,
        passcode: pin,
      });

      await refreshData();
      await loadBeneficiaries();
      showToast(`₦${parseFloat(amount).toLocaleString()} sent`);

      Alert.alert(
        "Transfer Successful",
        `Sent ${formatNGN(res.amount)} to ${res.recipient_name} (${res.bank_name}).\nReference: ${res.reference}`
      );

      setAmount("");
      setNarration("");
      setAccountNumber("");
      setResolvedName(null);
    } catch (err: any) {
      Alert.alert("Transfer Failed", err.message);
    } finally {
      setIsSending(false);
    }
  };

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(searchBankQuery.toLowerCase())
  );

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

          <Text style={styles.topNavTitle}>Send Money</Text>

          <View style={styles.avatarBtn}>
            <View style={styles.avatarInnerAccent} />
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.balanceHero}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>
            {formatNGN(ngnWallet?.balance || 0)}
          </Text>
        </View>
      </View>

      {/* CRISP WHITE ROUNDED BOTTOM SHEET */}
      <View style={styles.whiteSheet}>
        <View style={styles.sheetHandle} />

        {/* Saved Beneficiaries */}
        {beneficiaries.length > 0 && (
          <View style={styles.benSection}>
            <View style={styles.sheetSectionHeader}>
              <Text style={styles.sheetSectionTitle}>Beneficiaries</Text>
              <View style={styles.twoDots}>
                <View style={styles.darkDot} />
                <View style={styles.darkDot} />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.benScroll}
            >
              {beneficiaries.map((ben) => (
                <TouchableOpacity
                  key={ben.id}
                  style={styles.benChip}
                  onPress={() => handleSelectBeneficiary(ben)}
                  activeOpacity={0.7}
                >
                  <View style={styles.benAvatar}>
                    <Text style={styles.benInitials}>
                      {ben.account_name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.benName} numberOfLines={1}>
                    {ben.account_name.split(" ")[0]}
                  </Text>
                  <Text style={styles.benBank} numberOfLines={1}>
                    {ben.bank_name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Transfer Form Header */}
        <View style={styles.sheetSectionHeader}>
          <Text style={styles.sheetSectionTitle}>Transfer</Text>
          <View style={styles.twoDots}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        {/* Destination Bank */}
        <Text style={styles.fieldLabel}>Destination Bank</Text>
        <TouchableOpacity
          style={styles.bankPickerBtn}
          onPress={() => setBankModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.bankPickerLeft}>
            <View style={styles.fieldIconCircle}>
              <Ionicons name="business" size={16} color={Colors.textOnSheet} />
            </View>
            <Text style={styles.bankPickerText}>
              {selectedBank ? selectedBank.name : "Select Commercial Bank"}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={Colors.textOnSheetMuted}
          />
        </TouchableOpacity>

        {/* Account Number */}
        <Text style={styles.fieldLabel}>Account Number</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="10-digit NUBAN number"
            placeholderTextColor={Colors.textOnSheetMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={accountNumber}
            onChangeText={setAccountNumber}
          />
          {isResolving && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={styles.resolvingSpinner}
            />
          )}
        </View>

        {/* Verified Recipient Pill */}
        {resolvedName && (
          <View style={styles.resolvedPill}>
            <View style={styles.resolvedIconCircle}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.resolvedLabel}>VERIFIED RECIPIENT</Text>
              <Text style={styles.resolvedNameText}>{resolvedName}</Text>
            </View>
          </View>
        )}

        {/* Amount */}
        <Text style={styles.fieldLabel}>Amount (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={Colors.textOnSheetMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Quick Amount Chips */}
        <View style={styles.chipsRow}>
          {[5000, 10000, 25000, 50000].map((val) => (
            <TouchableOpacity
              key={val}
              style={styles.amountChip}
              onPress={() => setAmount(val.toString())}
            >
              <Text style={styles.chipText}>+₦{val.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Narration */}
        <Text style={styles.fieldLabel}>Note (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="What is this transfer for?"
          placeholderTextColor={Colors.textOnSheetMuted}
          value={narration}
          onChangeText={setNarration}
        />

        {/* Save Beneficiary Toggle */}
        <TouchableOpacity
          style={styles.saveBenRow}
          onPress={() => setSaveBeneficiary(!saveBeneficiary)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={saveBeneficiary ? "checkbox" : "square-outline"}
            size={20}
            color={saveBeneficiary ? Colors.primary : Colors.textOnSheetMuted}
          />
          <Text style={styles.saveBenText}>
            Save recipient for instant future transfers
          </Text>
        </TouchableOpacity>

        {/* Hot-Pink Primary Send Button */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!resolvedName || !amount) && styles.sendBtnDisabled,
          ]}
          disabled={!resolvedName || !amount || isSending}
          onPress={handleInitiateTransfer}
          activeOpacity={0.85}
        >
          {isSending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendBtnText}>
              Send{" "}
              {amount
                ? `₦${parseFloat(amount || "0").toLocaleString()}`
                : "Money"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bank Selection Modal */}
      <Modal visible={bankModalVisible} animationType="slide" transparent>
        <View style={styles.bankModalBackdrop}>
          <View style={styles.bankModalSheet}>
            <View style={styles.bankModalHeader}>
              <Text style={styles.bankModalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors.textOnSheetMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons
                name="search"
                size={18}
                color={Colors.textOnSheetMuted}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search bank name..."
                placeholderTextColor={Colors.textOnSheetMuted}
                value={searchBankQuery}
                onChangeText={setSearchBankQuery}
              />
            </View>

            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bankItem,
                    selectedBank?.code === item.code && styles.bankItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedBank(item);
                    setBankModalVisible(false);
                    setSearchBankQuery("");
                  }}
                >
                  <Text style={styles.bankItemName}>{item.name}</Text>
                  {selectedBank?.code === item.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <PasscodeModal
        visible={passcodeModalVisible}
        title="Authorize Transfer"
        subtitle={`Enter 4-digit PIN to send ${
          amount ? `₦${parseFloat(amount).toLocaleString()}` : ""
        } to ${resolvedName}`}
        onSuccess={handlePasscodeSuccess}
        onCancel={() => setPasscodeModalVisible(false)}
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
    flexGrow: 1,
    backgroundColor: Colors.sheetBackground,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 64,
    minHeight: 700,
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
    marginBottom: 12,
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
  benSection: {
    marginBottom: 18,
  },
  benScroll: {
    flexDirection: "row",
  },
  benChip: {
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 10,
    width: 86,
  },
  benAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  benInitials: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textOnSheet,
  },
  benName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheet,
    textAlign: "center",
  },
  benBank: {
    fontSize: 10,
    color: Colors.textOnSheetMuted,
    textAlign: "center",
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  bankPickerBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.sheetSurface,
    padding: 12,
    borderRadius: 18,
  },
  bankPickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fieldIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  bankPickerText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textOnSheet,
    marginLeft: 10,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textOnSheet,
  },
  resolvingSpinner: {
    position: "absolute",
    right: 14,
    top: 15,
  },
  resolvedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sheetSurface,
    padding: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  resolvedIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  resolvedLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textOnSheetMuted,
    letterSpacing: 0.5,
  },
  resolvedNameText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textOnSheet,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  amountChip: {
    flex: 1,
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
  },
  saveBenRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
  },
  saveBenText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textOnSheetSecondary,
    marginLeft: 8,
  },
  sendBtn: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  sendBtnDisabled: {
    backgroundColor: "#14141F",
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bankModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 12, 0.72)",
    justifyContent: "flex-end",
  },
  bankModalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    maxHeight: "80%",
  },
  bankModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  bankModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textOnSheet,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sheetSurface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textOnSheet,
    marginLeft: 8,
    fontWeight: "600",
  },
  bankItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sheetBorder,
  },
  bankItemSelected: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 12,
  },
  bankItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
});
