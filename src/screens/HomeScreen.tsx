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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Colors } from "../theme/colors";
import { formatNGN } from "../utils/formatters";
import { useFinFlow } from "../context/FinFlowContext";
import { TransactionItem } from "../components/TransactionItem";
import { ArtisticCardArt } from "../components/ArtisticCardArt";

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

          <Text style={styles.topNavTitle}>Bank</Text>

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

          {virtualAccount && (
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
            onPress={() => navigation.navigate("Receive")}
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
          <Text style={styles.sheetSectionTitle}>Transactions</Text>
          <View style={styles.twoDotsBtn}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        <View style={styles.transactionsList}>
          {transactions.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="receipt-outline" size={36} color={Colors.textOnSheetMuted} style={{ marginBottom: 8, opacity: 0.4 }} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textOnSheet }}>No transactions yet</Text>
              <Text style={{ fontSize: 12, color: Colors.textOnSheetMuted, marginTop: 4, textAlign: "center" }}>
                Add funds via your dedicated virtual account or make a payment to see activity here.
              </Text>
            </View>
          ) : (
            transactions.slice(0, 10).map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => {
                  Alert.alert(
                    "Transaction Details",
                    `Reference: ${tx.reference}\nDescription: ${tx.narration}\nAmount: ${tx.currency} ${tx.amount.toLocaleString()}\nStatus: ${tx.status.toUpperCase()}`
                  );
                }}
              />
            ))
          )}
        </View>
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
    marginTop: 2,
  },
});
