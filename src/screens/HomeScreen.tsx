import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
  Share,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Colors } from "../theme/colors";
import { formatDate, formatNGN, formatUSD } from "../utils/formatters";
import { useFinFlow, TransactionItemData } from "../context/FinFlowContext";
import { TransactionItem } from "../components/TransactionItem";
import { ArtisticCardArt } from "../components/ArtisticCardArt";
import { CreasPayLogo } from "../components/CreasPayLogo";

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width - 48, 380);
const CARD_HEIGHT = CARD_WIDTH * 0.6;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const {
    user,
    ngnWallet,
    virtualAccount,
    cards,
    transactions,
    refreshData,
    showToast,
    setAddMoneyModalVisible,
  } = useFinFlow();

  const [refreshing, setRefreshing] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("Jan");

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleCopyVA = async () => {
    if (virtualAccount) {
      await Clipboard.setStringAsync(virtualAccount.account_number);
      setCopiedVA(true);
      showToast("Account number copied");
      setTimeout(() => setCopiedVA(false), 2000);
    }
  };

  const ngnBalance = ngnWallet?.balance ?? 0;
  const hasCard = cards.length > 0;
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  const [selectedTxFilter, setSelectedTxFilter] = useState<"all" | "inflow" | "outflow" | "bills" | "rewards">("all");
  const [selectedTx, setSelectedTx] = useState<TransactionItemData | null>(null);
  const [txReceiptVisible, setTxReceiptVisible] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    const isCashback =
      tx.type === "cashback" ||
      tx.category === "reward" ||
      (tx.narration || "").toLowerCase().includes("cashback");
    const isInflow =
      isCashback ||
      tx.category === "inflow" ||
      tx.type === "deposit" ||
      tx.type === "refund";
    const isBill =
      tx.type === "bill_payment" ||
      tx.category === "utility" ||
      (tx.narration || "").toLowerCase().includes("payment:") ||
      (tx.narration || "").toLowerCase().includes("data") ||
      (tx.narration || "").toLowerCase().includes("airtime");
    const isOutflow = !isInflow;

    if (selectedTxFilter === "inflow") return isInflow;
    if (selectedTxFilter === "outflow") return isOutflow;
    if (selectedTxFilter === "bills") return isBill;
    if (selectedTxFilter === "rewards") return isCashback;
    return true;
  });

  const handleOpenReceipt = (tx: TransactionItemData) => {
    Haptics.selectionAsync();
    setSelectedTx(tx);
    setCopiedRef(false);
    setTxReceiptVisible(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* DARK TOP HEADER & BALANCE HERO */}
      <View style={styles.darkTopSection}>
        {/* Top Bar: 4-Dot Grid + "Bank" + Purple/Pink Avatar */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.fourDotsGrid}
            onPress={() => navigation.navigate("Receive")}
            activeOpacity={0.7}
          >
            <View style={styles.dotsRow}>
              <View style={styles.gridDot} />
              <View style={styles.gridDot} />
            </View>
            <View style={styles.dotsRow}>
              <View style={styles.gridDot} />
              <View style={styles.gridDot} />
            </View>
          </TouchableOpacity>

          <CreasPayLogo size={28} showText textSize={18} textColor="#FFFFFF" />

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <View style={styles.avatarInnerAccent} />
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Total Balance */}
        <View style={styles.balanceHero}>
          <Text style={styles.totalBalanceLabel}>Total Balance</Text>
          <Text style={styles.totalBalanceValue}>{formatNGN(ngnBalance)}</Text>

          {virtualAccount ? (
            <TouchableOpacity
              style={styles.vaCopyPill}
              onPress={handleCopyVA}
              activeOpacity={0.75}
            >
              <Text style={styles.vaCopyText}>
                {virtualAccount.bank_name} • {virtualAccount.account_number}
              </Text>
              <Ionicons
                name={copiedVA ? "checkmark-circle" : "copy-outline"}
                size={13}
                color={Colors.primary}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.kycWarningBanner}
              onPress={() => navigation.navigate("Profile", { openKyc: true })}
              activeOpacity={0.85}
            >
              <View style={styles.kycWarningIconBadge}>
                <MaterialCommunityIcons name="shield-alert" size={18} color="#F59E0B" />
              </View>
              <View style={styles.kycWarningContent}>
                <View style={styles.kycWarningTopRow}>
                  <Text style={styles.kycWarningTitle}>Verification Needed</Text>
                  <View style={styles.kycActionBadge}>
                    <Text style={styles.kycActionBadgeText}>Complete KYC</Text>
                  </View>
                </View>
                <Text style={styles.kycWarningSubtitle} numberOfLines={2}>
                  Add your BVN & Date of Birth to generate your Providus Bank account.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#F59E0B" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stylized Pink Wave Graph + Month Selector (Matching Right Reference Screen) */}
        <View style={styles.waveChartContainer}>
          <View style={styles.gridLinesContainer}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.verticalGridLine} />
            ))}
          </View>

          {/* Stylized Smooth Wave Bars/Curve */}
          <View style={styles.waveCurveRow}>
            <View style={[styles.waveNode, { height: 22 }]} />
            <View style={[styles.waveNode, { height: 42 }]} />
            <View style={[styles.waveNode, { height: 28 }]} />
            <View style={[styles.waveNode, styles.waveNodeActive, { height: 64 }]}>
              <View style={styles.wavePeakDot} />
            </View>
            <View style={[styles.waveNode, { height: 38 }]} />
            <View style={[styles.waveNode, { height: 76 }]} />
          </View>

          {/* Months Row */}
          <View style={styles.monthsRow}>
            {months.map((m) => {
              const active = m === selectedMonth;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMonth(m)}
                  style={[styles.monthPill, active && styles.monthPillActive]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.monthText, active && styles.monthTextActive]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Action Pills in Dark Header */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={[styles.quickPill, styles.quickPillPrimary]}
            onPress={() => setAddMoneyModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text style={styles.quickPillPrimaryText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => navigation.navigate("Send")}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
            <Text style={styles.quickPillText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => navigation.navigate("Bills")}
            activeOpacity={0.8}
          >
            <Ionicons name="flash-outline" size={14} color="#FFFFFF" />
            <Text style={styles.quickPillText}>Bills</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => navigation.navigate("Cards")}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={14} color={Colors.primary} />
            <Text style={styles.quickPillText}>Card</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CRISP WHITE ROUNDED BOTTOM SHEET (Matching Middle & Right Reference Screens) */}
      <View style={styles.whiteSheet}>
        <View style={styles.sheetHandle} />

        {/* CARDS SECTION */}
        <View style={styles.sheetSectionHeader}>
          <Text style={styles.sheetSectionTitle}>Cards</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Cards")}
            style={styles.twoDotsBtn}
          >
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </TouchableOpacity>
        </View>

        {/* Blank ATM Card with Artistic Blobs + Side Card Peek */}
        <View style={styles.cardsCarouselRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("Cards")}
            style={[
              styles.blankAtmCard,
              {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
              },
            ]}
          >
            <ArtisticCardArt />

            {/* Top Row: Subtle ATM Chip + VISA on Pink Blob */}
            <View style={styles.atmTopRow}>
              <View style={styles.atmChipGroup}>
                <View style={styles.atmChip}>
                  <View style={styles.atmChipInner} />
                </View>
                <MaterialCommunityIcons
                  name="contactless-payment"
                  size={18}
                  color="rgba(255,255,255,0.55)"
                  style={{ marginLeft: 8 }}
                />
              </View>
              <Text style={styles.atmVisaText}>VISA</Text>
            </View>

            {/* Center Prompt: Click to view card / Click to create card */}
            <View style={styles.atmCenterCta}>
              <View style={styles.atmPromptPill}>
                <Ionicons
                  name={hasCard ? "eye-outline" : "add-circle-outline"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.atmPromptText}>
                  {hasCard ? "Click to view card" : "Click to create card"}
                </Text>
              </View>
            </View>

            {/* Bottom Row: Blank ATM Silhouette */}
            <View style={styles.atmBottomRow}>
              <Text style={styles.atmCardSubtleLabel}>USD VIRTUAL CARD</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* BILLS & UTILITIES SECTION */}
        <View style={[styles.sheetSectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sheetSectionTitle}>Bills & Utilities</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Bills")}
            style={styles.seeAllBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Pay bills</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {[
            {
              id: "airtime",
              title: "Airtime",
              subtitle: "MTN, Airtel, Glo",
              icon: "phone-portrait-outline",
            },
            {
              id: "data",
              title: "Internet",
              subtitle: "Data bundles",
              icon: "wifi-outline",
            },
            {
              id: "electricity",
              title: "Electricity",
              subtitle: "Prepaid token",
              icon: "flash-outline",
            },
            {
              id: "cable",
              title: "Cable TV",
              subtitle: "DSTV, GOtv, StarTimes",
              icon: "tv-outline",
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate("Bills", { category: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.serviceIconCircle}>
                <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
              </View>
              <View style={styles.serviceTextGroup}>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                <Text style={styles.serviceSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* TRANSACTIONS SECTION */}
        <View style={[styles.sheetSectionHeader, { marginTop: 28 }]}>
          <View>
            <Text style={styles.sheetSectionTitle}>Transactions</Text>
            <Text style={styles.sheetSectionSubtitle}>
              {filteredTransactions.length} {filteredTransactions.length === 1 ? "activity" : "activities"}
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
        >
          {[
            { id: "all", label: "All" },
            { id: "inflow", label: "Money In" },
            { id: "outflow", label: "Money Out" },
            { id: "bills", label: "Bills & Data" },
            { id: "rewards", label: "Cashback" },
          ].map((pill) => {
            const isActive = selectedTxFilter === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTxFilter(pill.id as any);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.transactionsList}>
          {filteredTransactions.length === 0 ? (
            <View style={{ paddingVertical: 36, alignItems: "center", justifyContent: "center" }}>
              <Ionicons
                name="receipt-outline"
                size={36}
                color={Colors.textOnSheetMuted}
                style={{ marginBottom: 8, opacity: 0.4 }}
              />
              <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textOnSheet }}>
                No {selectedTxFilter === "all" ? "" : selectedTxFilter} transactions found
              </Text>
              <Text style={{ fontSize: 12, color: Colors.textOnSheetMuted, marginTop: 4, textAlign: "center", paddingHorizontal: 20 }}>
                {selectedTxFilter === "inflow"
                  ? "Inbound transfers, bank deposits, and cashback rewards appear here."
                  : selectedTxFilter === "bills"
                  ? "Airtime, internet data, electricity, and cable payments appear here."
                  : selectedTxFilter === "rewards"
                  ? "Every time you purchase data or airtime, your cashback commissions appear here."
                  : "All completed transactions and wallet activities will appear here in real time."}
              </Text>
            </View>
          ) : (
            filteredTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => handleOpenReceipt(tx)}
              />
            ))
          )}
        </View>
      </View>

      {/* TRANSACTION RECEIPT MODAL */}
      <Modal
        visible={txReceiptVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTxReceiptVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptCard}>
            {/* Header Close */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderTitle}>Transaction Receipt</Text>
              <TouchableOpacity
                onPress={() => setTxReceiptVisible(false)}
                style={styles.receiptCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textOnSheet} />
              </TouchableOpacity>
            </View>

            {/* Status Icon & Amount */}
            <View style={styles.receiptStatusBox}>
              <View style={styles.receiptStatusIconCircle}>
                <Ionicons name="checkmark" size={26} color="#10B981" />
              </View>
              <Text style={styles.receiptStatusText}>Transaction Successful</Text>
              <Text style={styles.receiptAmount}>
                {selectedTx?.currency === "USD" ? "$" : "₦"}
                {selectedTx ? selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </Text>

              {/* Commission/Cashback highlight banner */}
              {(selectedTx?.type === "cashback" || (selectedTx?.earnings_amount && selectedTx.earnings_amount > 0)) && (
                <View style={styles.cashbackBanner}>
                  <Ionicons name="sparkles" size={14} color="#10B981" style={{ marginRight: 5 }} />
                  <Text style={styles.cashbackBannerText}>
                    Cashback Reward: +₦{selectedTx.type === "cashback" ? selectedTx.amount.toFixed(2) : selectedTx.earnings_amount?.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {/* Details Rows */}
            <View style={styles.receiptDetailsBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Transaction Type</Text>
                <Text style={styles.receiptValue}>
                  {selectedTx?.type?.replace(/_/g, " ").toUpperCase() || "PAYMENT"}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Description</Text>
                <Text style={[styles.receiptValue, { flex: 1, textAlign: "right" }]} numberOfLines={2}>
                  {selectedTx?.narration}
                </Text>
              </View>
              {selectedTx?.counterparty_name && (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Recipient / Provider</Text>
                  <Text style={styles.receiptValue}>{selectedTx.counterparty_name}</Text>
                </View>
              )}
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date & Time</Text>
                <Text style={styles.receiptValue}>
                  {selectedTx ? formatDate(selectedTx.created_at) : ""}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Reference</Text>
                <TouchableOpacity
                  onPress={async () => {
                    if (selectedTx?.reference) {
                      await Clipboard.setStringAsync(selectedTx.reference);
                      setCopiedRef(true);
                      showToast("Reference copied");
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setTimeout(() => setCopiedRef(false), 2500);
                    }
                  }}
                  style={styles.copyRefBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.receiptRefText} numberOfLines={1}>
                    {selectedTx?.reference}
                  </Text>
                  <Ionicons
                    name={copiedRef ? "checkmark-circle" : "copy-outline"}
                    size={14}
                    color={copiedRef ? Colors.success : Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.shareReceiptBtn}
                onPress={async () => {
                  if (!selectedTx) return;
                  try {
                    await Share.share({
                      message: `CreasPay Transaction Receipt\n--------------------------------\nReference: ${selectedTx.reference}\nAmount: ${selectedTx.currency} ${selectedTx.amount.toLocaleString()}\nStatus: SUCCESSFUL\nDate: ${formatDate(selectedTx.created_at)}\nDescription: ${selectedTx.narration}\nChannel: CreasPay Instant Rails`,
                    });
                  } catch (e) {}
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={18} color="#0B0B12" style={{ marginRight: 6 }} />
                <Text style={styles.shareReceiptBtnText}>Share Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneReceiptBtn}
                onPress={() => setTxReceiptVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.doneReceiptBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  darkTopSection: {
    backgroundColor: Colors.background,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
  },
  topNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
    marginBottom: 14,
  },
  totalBalanceLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalBalanceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  vaCopyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 10,
  },
  vaCopyText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  kycWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginTop: 12,
    marginHorizontal: 12,
  },
  kycWarningIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  kycWarningContent: {
    flex: 1,
  },
  kycWarningTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 8,
  },
  kycWarningTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FBBF24",
  },
  kycActionBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kycActionBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#F59E0B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kycWarningSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: 15,
  },
  waveChartContainer: {
    marginTop: 6,
    marginBottom: 16,
    position: "relative",
  },
  gridLinesContainer: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    bottom: 28,
  },
  verticalGridLine: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  waveCurveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 82,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  waveNode: {
    width: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "rgba(255, 30, 117, 0.18)",
    alignItems: "center",
  },
  waveNodeActive: {
    backgroundColor: "rgba(255, 30, 117, 0.38)",
    borderTopWidth: 2.5,
    borderColor: Colors.primary,
  },
  wavePeakDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    marginTop: -7,
  },
  monthsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  monthPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  monthPillActive: {
    backgroundColor: Colors.primary,
  },
  monthText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  monthTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  quickActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  quickPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
    gap: 5,
  },
  quickPillPrimary: {
    backgroundColor: Colors.primary,
  },
  quickPillPrimaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: "600",
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
    minHeight: 520,
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
    marginBottom: 16,
  },
  sheetSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textOnSheet,
    letterSpacing: -0.3,
  },
  twoDotsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },
  darkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textOnSheet,
  },
  cardsCarouselRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  blankAtmCard: {
    backgroundColor: "#0B0B12",
    borderRadius: 26,
    padding: 22,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#090912",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 10,
  },
  atmTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  atmChipGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  atmChip: {
    width: 34,
    height: 24,
    borderRadius: 5,
    backgroundColor: "#FFB800",
    justifyContent: "center",
    alignItems: "center",
  },
  atmChipInner: {
    width: "65%",
    height: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  atmVisaText: {
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  atmCenterCta: {
    alignItems: "center",
    justifyContent: "center",
  },
  atmPromptPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11, 11, 18, 0.72)",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    gap: 8,
  },
  atmPromptText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  atmBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  atmCardSubtleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: 1.2,
  },
  peekCard: {
    width: 18,
    backgroundColor: "#0B0B12",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginLeft: 14,
    overflow: "hidden",
    justifyContent: "space-around",
  },
  peekCyanStripe: {
    width: 24,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#00E5FF",
    marginLeft: -4,
  },
  peekYellowStripe: {
    width: 24,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#FFB800",
    marginLeft: -4,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  serviceCard: {
    width: "48%",
    backgroundColor: Colors.sheetSurface,
    borderWidth: 1,
    borderColor: Colors.sheetBorder,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 30, 117, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTextGroup: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  serviceSubtitle: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
    marginTop: 2,
  },
  transactionsList: {
    marginTop: 8,
  },
  sheetSectionSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
    marginTop: 2,
  },
  filterPillsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: Colors.sheetSurface,
    borderWidth: 1,
    borderColor: Colors.sheetBorder,
  },
  filterPillActive: {
    backgroundColor: "#0B0B12",
    borderColor: "#0B0B12",
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.textOnSheetSecondary,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  receiptCard: {
    backgroundColor: Colors.sheetBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 36,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  receiptHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  receiptCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.sheetSurface,
    justifyContent: "center",
    alignItems: "center",
  },
  receiptStatusBox: {
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sheetBorder,
  },
  receiptStatusIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  receiptStatusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textOnSheet,
    letterSpacing: -0.5,
  },
  cashbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.10)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 10,
  },
  cashbackBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  receiptDetailsBox: {
    paddingVertical: 14,
    gap: 13,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
  },
  receiptValue: {
    fontSize: 13.5,
    fontWeight: "600",
    color: Colors.textOnSheet,
  },
  copyRefBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.sheetSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: "60%",
  },
  receiptRefText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheet,
    fontFamily: "monospace",
  },
  receiptActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  shareReceiptBtn: {
    flex: 1,
    flexDirection: "row",
    height: 50,
    backgroundColor: Colors.sheetSurface,
    borderWidth: 1,
    borderColor: Colors.sheetBorder,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  shareReceiptBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  doneReceiptBtn: {
    flex: 1,
    height: 50,
    backgroundColor: "#0B0B12",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  doneReceiptBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
