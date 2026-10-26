import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { formatNGN, formatUSD } from "../utils/formatters";
import { useFinFlow } from "../context/FinFlowContext";
import { VirtualCardView } from "../components/VirtualCardView";
import { PasscodeModal } from "../components/PasscodeModal";
import { api } from "../api/client";

const LIVE_FX_RATE = 1520.0;
const CARD_CREATION_FEE_USD = 3.0; // $2.00 base + $1.00 platform gain

export const CardsScreen: React.FC = () => {
  const {
    cards,
    activeCard,
    setActiveCard,
    ngnWallet,
    user,
    refreshData,
    showToast,
    setAddMoneyModalVisible,
  } = useFinFlow();

  const [unmaskedDetails, setUnmaskedDetails] = useState<any>(null);
  const [cardTxs, setCardTxs] = useState<any[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [fundModalVisible, setFundModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [passcodeAction, setPasscodeAction] = useState<
    "reveal" | "create" | "fund" | "withdraw"
  >("reveal");

  const [newCardName, setNewCardName] = useState(user?.full_name?.toUpperCase() || "");
  const [newCardAmount, setNewCardAmount] = useState("10");
  const [fundAmount, setFundAmount] = useState("20");

  useEffect(() => {
    if (user?.full_name && !newCardName) {
      setNewCardName(user.full_name.toUpperCase());
    }
  }, [user?.full_name]);

  useEffect(() => {
    if (activeCard) {
      fetchCardTransactions(activeCard.id);
    }
  }, [activeCard?.id]);

  const fetchCardTransactions = async (cardId: string) => {
    setIsLoadingTxs(true);
    try {
      const res = await api.getCardTransactions(cardId);
      setCardTxs(res.transactions || []);
    } catch {
      setCardTxs([]);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  const handleRevealPress = () => {
    if (unmaskedDetails) {
      setUnmaskedDetails(null);
    } else {
      setPasscodeAction("reveal");
      setPasscodeModalVisible(true);
    }
  };

  const handleFreezeToggle = async () => {
    if (!activeCard) return;
    try {
      const newStatus = activeCard.status === "frozen" ? "active" : "frozen";
      await api.updateCardStatus(activeCard.id, newStatus);
      await refreshData();
      showToast(newStatus === "frozen" ? "Card frozen" : "Card active");
    } catch (err: any) {
      Alert.alert("Action Failed", err.message);
    }
  };

  const handleTerminateCard = () => {
    if (!activeCard) return;
    Alert.alert(
      "Close Card",
      `Are you sure you want to permanently close card ••${activeCard.last4}? Any remaining USD balance will be converted and returned to your Naira balance.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Card",
          style: "destructive",
          onPress: async () => {
            try {
              await api.terminateCard(activeCard.id);
              await refreshData();
              showToast("Card closed");
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const handlePasscodeSuccess = async (pin: string) => {
    setPasscodeModalVisible(false);

    if (passcodeAction === "reveal" && activeCard) {
      try {
        const res = await api.revealCardSecureDetails(activeCard.id, pin);
        setUnmaskedDetails(res);
        showToast("Card details unlocked");
      } catch (err: any) {
        Alert.alert("Error", err.message);
      }
    } else if (passcodeAction === "create") {
      try {
        const amt = parseFloat(newCardAmount) || 5;
        await api.createCard({
          name: newCardName.trim() || user?.full_name?.toUpperCase() || "CREASPAY USER",
          amount: amt,
          card_theme: "obsidian",
          passcode: pin,
        });
        setCreateModalVisible(false);
        await refreshData();
        showToast("USD card created successfully!");
      } catch (err: any) {
        const isInsufficient = (err.message || "").toLowerCase().includes("insufficient");
        Alert.alert(
          isInsufficient ? "Insufficient Balance" : "Card Issuance Error",
          err.message || "Failed to create virtual USD card. Please try again."
        );
      }
    } else if (passcodeAction === "fund" && activeCard) {
      try {
        const amt = parseFloat(fundAmount);
        if (!amt || amt < 1) {
          Alert.alert("Invalid Amount", "Minimum top up is $1.00");
          return;
        }
        await api.fundCard(activeCard.id, {
          amount: amt,
          source_wallet_currency: "NGN",
          passcode: pin,
        });
        setFundModalVisible(false);
        await refreshData();
        showToast(`+$${amt.toFixed(2)} added to card`);
      } catch (err: any) {
        Alert.alert("Top Up Error", err.message);
      }
    } else if (passcodeAction === "withdraw" && activeCard) {
      try {
        const amt = parseFloat(fundAmount);
        if (!amt || amt < 1) {
          Alert.alert("Invalid Amount", "Minimum withdrawal is $1.00");
          return;
        }
        await api.withdrawCard(activeCard.id, {
          amount: amt,
          dest_wallet_currency: "NGN",
          passcode: pin,
        });
        setWithdrawModalVisible(false);
        await refreshData();
        showToast(`$${amt.toFixed(2)} withdrawn to Naira balance`);
      } catch (err: any) {
        Alert.alert("Withdrawal Error", err.message);
      }
    }
  };

  const initialAmountParsed = parseFloat(newCardAmount || "0");
  const totalCreateUsd = initialAmountParsed + CARD_CREATION_FEE_USD;
  const totalCreateNgn = totalCreateUsd * LIVE_FX_RATE;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* JET BLACK TOP BAR (Matching Middle Reference Screen) */}
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

          <Text style={styles.topNavTitle}>Bank</Text>

          <View style={styles.avatarBtn}>
            <View style={styles.avatarInnerAccent} />
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* CRISP WHITE ROUNDED BOTTOM SHEET */}
      <View style={styles.whiteSheet}>
        <View style={styles.sheetHandle} />

        {/* Header Row: "Cards" + "+ New Card" */}
        <View style={styles.sheetHeaderRow}>
          <Text style={styles.sheetTitle}>Cards</Text>

          <TouchableOpacity
            style={styles.newCardBtn}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.newCardBtnText}>New Card</Text>
          </TouchableOpacity>
        </View>

        {/* Multi-Card Selector Pills */}
        {cards.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cardTabs}
          >
            {cards.map((c) => {
              const isSelected = activeCard?.id === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.cardTab, isSelected && styles.cardTabSelected]}
                  onPress={() => {
                    setActiveCard(c);
                    setUnmaskedDetails(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isSelected && styles.tabTextSelected,
                    ]}
                  >
                    ••{c.last4} ({formatUSD(c.balance)})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Active Virtual Card View */}
        {activeCard ? (
          <VirtualCardView
            card={activeCard}
            unmaskedDetails={unmaskedDetails}
            onRevealPress={handleRevealPress}
            onFreezeToggle={handleFreezeToggle}
            onFundPress={() => setFundModalVisible(true)}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={38} color={Colors.textOnSheetMuted} />
            <Text style={styles.emptyStateTitle}>No Active USD Card</Text>
            <Text style={styles.emptyStateSub}>
              Create a virtual USD Visa card to pay online anywhere Visa is accepted
            </Text>
          </View>
        )}

        {/* Secondary Card Actions Row */}
        {activeCard && (
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.secActionBtn}
              onPress={() => setWithdrawModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.secActionIcon}>
                <Ionicons name="arrow-down" size={16} color={Colors.textOnSheet} />
              </View>
              <Text style={styles.secActionText}>Withdraw to NGN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secActionBtn}
              onPress={handleTerminateCard}
              activeOpacity={0.7}
            >
              <View style={[styles.secActionIcon, { backgroundColor: Colors.dangerMuted }]}>
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </View>
              <Text style={[styles.secActionText, { color: Colors.danger }]}>
                Close Card
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TRANSACTIONS SECTION (Matching Middle Reference Screen) */}
        <View style={styles.txSectionHeader}>
          <Text style={styles.sheetTitle}>Transactions</Text>
          <View style={styles.twoDots}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        {isLoadingTxs ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          cardTxs.map((tx, idx) => (
            <View key={idx} style={styles.cardTxRow}>
              <View style={styles.cardTxIcon}>
                <Ionicons name="bag-handle" size={18} color={Colors.textOnSheet} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.merchantName}>{tx.merchant}</Text>
                <Text style={styles.merchantCat}>
                  {tx.category} • {tx.time_ago}
                </Text>
              </View>
              <Text style={styles.txAmount}>-${tx.amount.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Modal: Create New Virtual USD Card */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Virtual USD Card</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textOnSheetMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Name on Card</Text>
            <TextInput
              style={styles.input}
              placeholder="ALEX MORGAN"
              placeholderTextColor={Colors.textOnSheetMuted}
              value={newCardName}
              onChangeText={setNewCardName}
            />

            <Text style={styles.fieldLabel}>Initial Deposit (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum $3.00"
              placeholderTextColor={Colors.textOnSheetMuted}
              keyboardType="numeric"
              value={newCardAmount}
              onChangeText={setNewCardAmount}
            />

            <View style={styles.conversionCard}>
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Initial Card Load</Text>
                <Text style={styles.convVal}>${initialAmountParsed.toFixed(2)}</Text>
              </View>
              <View style={styles.convDivider} />
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Card Creation Fee</Text>
                <Text style={styles.convVal}>${CARD_CREATION_FEE_USD.toFixed(2)}</Text>
              </View>
              <View style={styles.convDivider} />
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Exchange Rate</Text>
                <Text style={styles.convVal}>₦{LIVE_FX_RATE.toLocaleString()} / $1</Text>
              </View>
              <View style={styles.convDivider} />
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Total Naira Debit</Text>
                <Text style={[styles.convVal, { fontWeight: "800" }]}>
                  ₦{totalCreateNgn.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                const ngnBal = ngnWallet?.balance ?? 0;
                if (ngnBal < totalCreateNgn) {
                  Alert.alert(
                    "Insufficient Balance",
                    `You need at least ₦${totalCreateNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })} to create and fund this card ($${initialAmountParsed.toFixed(2)} initial balance + $${CARD_CREATION_FEE_USD.toFixed(2)} issuance fee).\n\nYour current Naira balance is ₦${ngnBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Please top up your wallet to continue.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Add Money",
                        onPress: () => {
                          setCreateModalVisible(false);
                          setAddMoneyModalVisible(true);
                        },
                      },
                    ]
                  );
                  return;
                }
                setPasscodeAction("create");
                setPasscodeModalVisible(true);
              }}
            >
              <Text style={styles.modalActionText}>Create Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Top Up Card */}
      <Modal visible={fundModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Up Card (••{activeCard?.last4})</Text>
              <TouchableOpacity onPress={() => setFundModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textOnSheetMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.sourceNgnCard}>
              <View style={styles.sourceNgnLeft}>
                <Ionicons name="wallet" size={18} color={Colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.sourceNgnTitle}>Naira Balance</Text>
                  <Text style={styles.sourceNgnBal}>
                    Available: {formatNGN(ngnWallet?.balance || 0)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Amount to Add (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="20"
              placeholderTextColor={Colors.textOnSheetMuted}
              keyboardType="numeric"
              value={fundAmount}
              onChangeText={setFundAmount}
            />

            <View style={styles.presetChipsRow}>
              {["10", "25", "50", "100"].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    fundAmount === preset && styles.presetChipActive,
                  ]}
                  onPress={() => setFundAmount(preset)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      fundAmount === preset && styles.presetChipTextActive,
                    ]}
                  >
                    ${preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.conversionCard}>
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Exchange Rate</Text>
                <Text style={styles.convVal}>₦{LIVE_FX_RATE.toLocaleString()} / $1</Text>
              </View>
              <View style={styles.convDivider} />
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Total Naira Debit</Text>
                <Text style={[styles.convVal, { fontWeight: "800" }]}>
                  ₦
                  {(parseFloat(fundAmount || "0") * LIVE_FX_RATE).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 2 }
                  )}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setPasscodeAction("fund");
                setPasscodeModalVisible(true);
              }}
            >
              <Text style={styles.modalActionText}>Confirm Top Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Withdraw Card */}
      <Modal visible={withdrawModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw to Naira</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textOnSheetMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.sourceNgnCard}>
              <View style={styles.sourceNgnLeft}>
                <Ionicons name="card" size={18} color={Colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.sourceNgnTitle}>Available on Card</Text>
                  <Text style={styles.sourceNgnBal}>
                    {formatUSD(activeCard?.balance || 0)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Amount (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={Colors.textOnSheetMuted}
              keyboardType="numeric"
              value={fundAmount}
              onChangeText={setFundAmount}
            />

            <View style={styles.conversionCard}>
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Conversion Rate</Text>
                <Text style={styles.convVal}>₦1,485.00 / $1</Text>
              </View>
              <View style={styles.convDivider} />
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>You Receive</Text>
                <Text style={[styles.convVal, { fontWeight: "800" }]}>
                  ₦
                  {(parseFloat(fundAmount || "0") * 1485.0).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 2 }
                  )}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setPasscodeAction("withdraw");
                setPasscodeModalVisible(true);
              }}
            >
              <Text style={styles.modalActionText}>Confirm Withdrawal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Passcode Security Modal */}
      <PasscodeModal
        visible={passcodeModalVisible}
        title="Verify PIN"
        subtitle="Enter your 4-digit PIN to authorize"
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
    paddingBottom: 20,
  },
  topNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  whiteSheet: {
    flex: 1,
    backgroundColor: Colors.sheetBackground,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 650,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textOnSheet,
    letterSpacing: -0.3,
  },
  newCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 4,
  },
  newCardBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardTabs: {
    flexDirection: "row",
    marginBottom: 12,
  },
  cardTab: {
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
  },
  cardTabSelected: {
    backgroundColor: Colors.textOnSheet,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textOnSheetSecondary,
    fontWeight: "600",
  },
  tabTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: Colors.sheetSurface,
    borderRadius: 22,
    padding: 28,
    marginVertical: 12,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnSheet,
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 12,
    color: Colors.textOnSheetMuted,
    textAlign: "center",
    marginTop: 4,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  secActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 8,
  },
  secActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  secActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  txSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 12,
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
  cardTxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  cardTxIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sheetSurface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  merchantCat: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 12, 0.72)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textOnSheet,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textOnSheet,
    fontWeight: "600",
  },
  conversionCard: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  convRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convDivider: {
    height: 1,
    backgroundColor: Colors.sheetBorder,
    marginVertical: 9,
  },
  convLabel: {
    fontSize: 12,
    color: Colors.textOnSheetSecondary,
    fontWeight: "500",
  },
  convVal: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  sourceNgnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.sheetSurface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 6,
  },
  sourceNgnLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceNgnTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  sourceNgnBal: {
    fontSize: 11,
    color: Colors.textOnSheetMuted,
    marginTop: 2,
  },
  presetChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    flex: 1,
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  presetChipActive: {
    backgroundColor: Colors.textOnSheet,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
  },
  presetChipTextActive: {
    color: "#FFFFFF",
  },
  modalActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 18,
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
