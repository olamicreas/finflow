import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Colors } from "../theme/colors";
import { formatNGN } from "../utils/formatters";
import { useFinFlow } from "../context/FinFlowContext";
import { PasscodeModal } from "../components/PasscodeModal";
import { api } from "../api/client";
import {
  detectNigerianNetwork,
  NETWORK_METAS,
  NigerianNetwork,
} from "../utils/phoneNetworkDetector";

type BillCatType = "airtime" | "data" | "electricity" | "cable";
type DataPlanFilter = "all" | "daily" | "weekly" | "monthly" | "night" | "router";

const formatUserPhoneForInput = (raw?: string): string => {
  if (!raw) return "";
  const cleaned = raw.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+234")) {
    return "0" + cleaned.slice(4);
  }
  if (cleaned.startsWith("234") && cleaned.length >= 13) {
    return "0" + cleaned.slice(3);
  }
  if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    return "0" + cleaned;
  }
  return cleaned;
};

const DATA_NETWORKS = [
  { id: "MTN", name: "MTN" },
  { id: "Airtel", name: "Airtel" },
  { id: "Glo", name: "Glo" },
  { id: "9mobile", name: "9mobile" },
  { id: "Smile", name: "Smile Router" },
  { id: "Spectranet", name: "Spectranet" },
];

const DATA_FILTERS: { id: DataPlanFilter; label: string; icon: any }[] = [
  { id: "all", label: "All Plans", icon: "grid-outline" },
  { id: "daily", label: "Daily", icon: "today-outline" },
  { id: "weekly", label: "Weekly", icon: "calendar-outline" },
  { id: "monthly", label: "Monthly", icon: "calendar" },
  { id: "night", label: "Night", icon: "moon-outline" },
  { id: "router", label: "Router & 5G", icon: "wifi-outline" },
];

interface OfflineDataPlan {
  id: string;
  label: string;
  price: number;
  validity: string;
}

const ACTUAL_OFFLINE_PLANS: Record<string, OfflineDataPlan[]> = {
  MTN: [
    { id: "500", label: "500MB", price: 317, validity: "7 Days" },
    { id: "1000", label: "1GB", price: 430, validity: "7 Days" },
    { id: "2000", label: "2GB", price: 850, validity: "7 Days" },
    { id: "3000", label: "3GB", price: 1270, validity: "7 Days" },
    { id: "5000.00", label: "5GB", price: 2601, validity: "30 Days" },
  ],
  Airtel: [
    { id: "499.91", label: "1GB", price: 520, validity: "1 Day" },
    { id: "599.91", label: "1.5GB", price: 620, validity: "2 Days" },
    { id: "749.91", label: "2GB", price: 780, validity: "2 Days" },
    { id: "999.91", label: "3GB", price: 1040, validity: "2 Days" },
    { id: "1499.91", label: "5GB", price: 1550, validity: "2 Days" },
  ],
  Glo: [
    { id: "500.01", label: "1.5GB", price: 520, validity: "14 Days" },
    { id: "500.02", label: "2GB", price: 520, validity: "1 Day" },
    { id: "1500.01", label: "5GB", price: 1550, validity: "30 Days" },
    { id: "2000.01", label: "6.15GB", price: 2070, validity: "30 Days" },
    { id: "2500.01", label: "7.5GB", price: 2590, validity: "30 Days" },
  ],
  "9mobile": [
    { id: "1000.01", label: "1.1GB", price: 1040, validity: "30 Days" },
    { id: "1500.01", label: "1.75GB", price: 1550, validity: "7 Days" },
    { id: "3000.01", label: "3.91GB", price: 3110, validity: "30 Days" },
    { id: "4000.01", label: "5.10GB", price: 4140, validity: "30 Days" },
    { id: "5000.01", label: "6.5GB", price: 5180, validity: "30 Days" },
  ],
};

interface Props {
  navigation?: {
    navigate: (screen: string) => void;
    goBack?: () => void;
  };
  initialCategory?: BillCatType;
}

export const BillsScreen: React.FC<Props> = ({
  navigation,
  initialCategory = "airtime",
}) => {
  const { ngnWallet, refreshData, showToast, user } = useFinFlow();

  const [activeCategory, setActiveCategory] = useState<BillCatType>(initialCategory);
  const [billers, setBillers] = useState<any[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<any>(null);
  const [isLoadingBillers, setIsLoadingBillers] = useState(false);

  // Derive initial user phone and network detection
  const initialPhone = formatUserPhoneForInput(user?.phone_number);
  const initialDetected = initialPhone ? detectNigerianNetwork(initialPhone) : null;

  // Data Plans Filter & Network State
  const [selectedNetwork, setSelectedNetwork] = useState<string>(initialDetected || "Airtel");
  const [selectedPlanType, setSelectedPlanType] = useState<DataPlanFilter>("all");

  // Form Inputs
  const [customer, setCustomer] = useState(initialPhone);
  const [detectedNetwork, setDetectedNetwork] = useState<NigerianNetwork | null>(initialDetected);
  const [amount, setAmount] = useState("1000");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");

  // Zero-Data & Zero-Airtime Offline Recharge State
  const [offlineModalVisible, setOfflineModalVisible] = useState(false);
  const [offlineService, setOfflineService] = useState<"data" | "airtime">("data");
  const [offlineNetwork, setOfflineNetwork] = useState<string>(initialDetected || "MTN");
  const [offlineRecipientPhone, setOfflineRecipientPhone] = useState<string>(initialPhone);
  const [offlineSelectedPlanId, setOfflineSelectedPlanId] = useState<string>("1000");
  const [offlineAirtimeAmount, setOfflineAirtimeAmount] = useState<string>("1000");
  const [offlinePin, setOfflinePin] = useState<string>("");

  const availableOfflinePlans: OfflineDataPlan[] = useMemo(() => {
    const netKey = (offlineNetwork || "MTN").trim();
    const matchedKey =
      Object.keys(ACTUAL_OFFLINE_PLANS).find(
        (k) => k.toLowerCase() === netKey.toLowerCase()
      ) || "MTN";

    // If live billers are already loaded in memory, try to find matching plans
    const liveNetPlans = billers.filter(
      (b) =>
        b.category === "data" &&
        (b.network?.toLowerCase() === matchedKey.toLowerCase() ||
          b.biller_code?.toLowerCase() === matchedKey.toLowerCase())
    );

    if (liveNetPlans.length > 0) {
      const popular: OfflineDataPlan[] = [];
      const sizes = ["500MB", "1GB", "1.5GB", "2GB", "3GB", "5GB"];
      for (const sz of sizes) {
        const match = liveNetPlans.find((p) => {
          const pName = (p.name || "").toUpperCase();
          const pAllowance = (p.data_allowance || "").toUpperCase();
          return pAllowance === sz || pName.startsWith(sz) || pName.includes(` ${sz}`);
        });
        if (match && !popular.some((x) => x.id === (match.item_code || match.id))) {
          popular.push({
            id: String(match.item_code || match.product_id || match.id),
            label: sz,
            price: Math.round(Number(match.amount)),
            validity: match.validity || "Active",
          });
        }
      }
      if (popular.length >= 3) {
        return popular;
      }
    }

    return ACTUAL_OFFLINE_PLANS[matchedKey] || ACTUAL_OFFLINE_PLANS["MTN"];
  }, [offlineNetwork, billers]);

  useEffect(() => {
    if (availableOfflinePlans.length > 0) {
      const match = availableOfflinePlans.find((p) => p.id === offlineSelectedPlanId);
      if (!match) {
        setOfflineSelectedPlanId(availableOfflinePlans[0].id);
      }
    }
  }, [availableOfflinePlans]);

  const handleLaunchOfflineSms = async () => {
    if (!offlinePin || offlinePin.length < 4) {
      Alert.alert("Enter Passcode", "Please enter your 4-digit transaction passcode.");
      return;
    }
    const cleanPhone = offlineRecipientPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      Alert.alert("Recipient Phone", "Please enter a valid 11-digit recipient phone number.");
      return;
    }
    const normPhone =
      cleanPhone.length === 10
        ? "0" + cleanPhone
        : cleanPhone.startsWith("234")
        ? "0" + cleanPhone.slice(3)
        : cleanPhone;

    const shortcode = "38477"; // CreasPay toll-free reverse-billed inbound shortcode
    let cmd = "";
    if (offlineService === "data") {
      const selectedPlan =
        availableOfflinePlans.find((p) => p.id === offlineSelectedPlanId) ||
        availableOfflinePlans[0];
      const planCode = selectedPlan?.id || "1000";
      cmd = `CPAY DATA ${offlineNetwork.toUpperCase()} ${planCode} ${normPhone} ${offlinePin}`;
    } else {
      cmd = `CPAY AIRTIME ${offlineNetwork.toUpperCase()} ${offlineAirtimeAmount} ${normPhone} ${offlinePin}`;
    }

    const sep = Platform.OS === "ios" ? "&" : "?";
    const url = `sms:${shortcode}${sep}body=${encodeURIComponent(cmd)}`;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const canOpen = await Linking.canOpenURL(url).catch(() => true);
      if (canOpen) {
        await Linking.openURL(url);
        setOfflineModalVisible(false);
        setOfflinePin("");
        showToast("Opening SMS • Toll-free carrier delivery");
      } else {
        Alert.alert("SMS Not Supported", `Please text: "${cmd}" to ${shortcode}`);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not launch Messages app");
    }
  };

  // Pre-fill registered phone number if profile loads asynchronously
  useEffect(() => {
    if (user?.phone_number) {
      const formatted = formatUserPhoneForInput(user.phone_number);
      if (!customer) {
        setCustomer(formatted);
        const detected = detectNigerianNetwork(formatted);
        setDetectedNetwork(detected);
        if (detected) {
          setSelectedNetwork(detected);
        }
      }
      if (!offlineRecipientPhone) {
        setOfflineRecipientPhone(formatted);
      }
    }
  }, [user?.phone_number]);

  // Handler for customer phone / meter input with real-time network detection
  const handleCustomerChange = (txt: string) => {
    setCustomer(txt);
    setValidatedCustomer(null);

    if (activeCategory === "airtime" || activeCategory === "data") {
      const detected = detectNigerianNetwork(txt);
      setDetectedNetwork(detected);
      if (detected) {
        if (activeCategory === "data") {
          setSelectedNetwork(detected);
        } else if (activeCategory === "airtime") {
          const matched = billers.find(
            (b) =>
              b.network?.toLowerCase() === detected.toLowerCase() ||
              b.name?.toLowerCase().includes(detected.toLowerCase())
          );
          if (matched) {
            setSelectedBiller(matched);
          }
        }
      }
    } else {
      setDetectedNetwork(null);
    }
  };

  // Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validatedCustomer, setValidatedCustomer] = useState<{
    name?: string;
    address?: string;
  } | null>(null);

  // Payment & PIN State
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Receipt Modal State
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Filtered data plans for Data category
  const filteredDataPlans =
    activeCategory === "data"
      ? billers.filter((b) => {
          const matchNet = b.network
            ? b.network.toLowerCase() === selectedNetwork.toLowerCase()
            : b.name.toLowerCase().includes(selectedNetwork.toLowerCase());
          const matchType =
            selectedPlanType === "all" ? true : b.plan_type === selectedPlanType;
          return matchNet && matchType;
        })
      : [];

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    loadBillers(activeCategory);
  }, [activeCategory]);

  // Synchronize selected biller when changing network or plan type in Data mode
  useEffect(() => {
    if (activeCategory === "data" && filteredDataPlans.length > 0) {
      const alreadyInList = filteredDataPlans.some((p) => p.id === selectedBiller?.id);
      if (!alreadyInList) {
        setSelectedBiller(filteredDataPlans[0]);
        if (filteredDataPlans[0].amount) {
          setAmount(filteredDataPlans[0].amount.toString());
        }
      }
    }
  }, [selectedNetwork, selectedPlanType, activeCategory, billers]);

  const loadBillers = async (cat: BillCatType) => {
    setIsLoadingBillers(true);
    setValidatedCustomer(null);
    try {
      const data = await api.getBillers(cat);
      setBillers(data);
      if (data.length > 0) {
        const detected = (cat === "data" || cat === "airtime") ? detectNigerianNetwork(customer) : null;
        if (cat === "data") {
          const targetNet = detected || selectedNetwork || "MTN";
          const mtnPlan = data.find((b: any) => b.network === targetNet) || data[0];
          setSelectedBiller(mtnPlan);
          if (mtnPlan?.amount) {
            setAmount(mtnPlan.amount.toString());
          }
        } else if (cat === "airtime" && detected) {
          const matched = data.find(
            (b: any) =>
              b.network?.toLowerCase() === detected.toLowerCase() ||
              b.name?.toLowerCase().includes(detected.toLowerCase())
          );
          setSelectedBiller(matched || data[0]);
          if ((matched || data[0])?.amount) {
            setAmount((matched || data[0]).amount.toString());
          }
        } else {
          setSelectedBiller(data[0]);
          if (data[0].amount) {
            setAmount(data[0].amount.toString());
          }
        }
      }
    } catch {
      setBillers([]);
    } finally {
      setIsLoadingBillers(false);
    }
  };

  const handleSelectBiller = (b: any) => {
    setSelectedBiller(b);
    setValidatedCustomer(null);
    if (b.amount) {
      setAmount(b.amount.toString());
    }
    if (b.meter_type) {
      setMeterType(b.meter_type);
    }
  };

  const handleValidateCustomer = async () => {
    if (!customer || customer.trim().length < 8) {
      Alert.alert("Invalid Number", "Please enter a valid meter number or account ID.");
      return;
    }
    setIsValidating(true);
    try {
      const res = await api.validateBillCustomer({
        item_code: selectedBiller?.item_code || "IKEDC_PREPAID",
        biller_code: selectedBiller?.biller_code || "BIL112",
        customer: customer.trim(),
      });
      setValidatedCustomer({
        name: res.customer_name,
        address: res.customer_address,
      });
      showToast("Account verified successfully");
    } catch (err: any) {
      Alert.alert("Verification Error", err.message || "Could not verify meter.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleInitiatePayment = () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum < 50) {
      Alert.alert("Invalid Amount", "Minimum payment amount is ₦50.");
      return;
    }
    if (amtNum > (ngnWallet?.balance || 0)) {
      Alert.alert("Insufficient Balance", "Your Naira wallet does not have enough funds.");
      return;
    }
    if (!customer || customer.trim().length < 8) {
      Alert.alert("Missing Details", "Please provide a valid phone or meter number.");
      return;
    }
    setPasscodeModalVisible(true);
  };

  const handlePasscodeSuccess = async (pin: string) => {
    setPasscodeModalVisible(false);
    setIsPaying(true);
    try {
      const res = await api.payBill({
        category: activeCategory,
        biller_code: selectedBiller?.biller_code || "BIL099",
        item_code: selectedBiller?.item_code || selectedBiller?.id,
        customer: customer.trim(),
        amount: parseFloat(amount),
        meter_type: activeCategory === "electricity" ? meterType : undefined,
        passcode: pin,
      });

      await refreshData();
      setReceiptData(res);
      setReceiptVisible(true);
      showToast(`${activeCategory.toUpperCase()} payment successful`);
    } catch (err: any) {
      Alert.alert("Payment Failed", err.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopyToken = async () => {
    if (receiptData?.token) {
      await Clipboard.setStringAsync(receiptData.token.replace(/-/g, ""));
      setCopiedToken(true);
      showToast("Meter token copied to clipboard");
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      {/* JET BLACK TOP HEADER */}
      <View style={styles.darkHeader}>
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.fourDotsGrid}
            onPress={() => navigation?.navigate?.("Home")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.topNavTitle}>Pay Bills</Text>

          <TouchableOpacity
            style={styles.offlineBtn}
            onPress={() => setOfflineModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="cellular-outline" size={13} color="#A29BFE" />
            <Text style={styles.offlineBtnText}>Offline</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Hero */}
        <View style={styles.balanceHero}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>
            {formatNGN(ngnWallet?.balance || 0)}
          </Text>
        </View>

        {/* Offline Zero-Data & Zero-Airtime Banner */}
        <TouchableOpacity
          style={styles.offlineBanner}
          onPress={() => setOfflineModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.offlineBannerLeft}>
            <View style={styles.offlineIconBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#A29BFE" />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.offlineBannerTitle}>Zero-Data & Zero-Airtime Recharge</Text>
              <Text style={styles.offlineBannerSub}>Toll-free SMS recharge powered by CreasPay.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        {/* Category Selector Tabs */}
        <View style={styles.categoryTabsRow}>
          {[
            { id: "airtime", label: "Airtime", icon: "phone-portrait" },
            { id: "data", label: "Data", icon: "wifi" },
            { id: "electricity", label: "Power", icon: "flash" },
            { id: "cable", label: "Cable TV", icon: "tv" },
          ].map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catTab, active && styles.catTabActive]}
                onPress={() => {
                  setActiveCategory(cat.id as BillCatType);
                  setCustomer("");
                  setValidatedCustomer(null);
                }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={15}
                  color={active ? "#FFFFFF" : Colors.textSecondary}
                />
                <Text style={[styles.catTabText, active && styles.catTabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CRISP WHITE ROUNDED BOTTOM SHEET */}
      <View style={styles.whiteSheet}>
        <View style={styles.sheetHandle} />

        {/* Section Title */}
        <View style={styles.sheetSectionHeader}>
          <Text style={styles.sheetSectionTitle}>
            {activeCategory === "airtime" && "Airtime Top-Up"}
            {activeCategory === "data" && "Internet Data Bundle"}
            {activeCategory === "electricity" && "Electricity Bills"}
            {activeCategory === "cable" && "Cable TV Subscription"}
          </Text>
          <View style={styles.twoDots}>
            <View style={styles.darkDot} />
            <View style={styles.darkDot} />
          </View>
        </View>

        {/* ========================================================= */}
        {/* DATA BUNDLE VIEW: Night, Daily, Weekly, Monthly, Router */}
        {/* ========================================================= */}
        {activeCategory === "data" ? (
          <>
            {/* Network Selector */}
            <Text style={styles.fieldLabel}>Select Network</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.providerScroll}
              contentContainerStyle={styles.providerScrollContent}
            >
              {DATA_NETWORKS.map((net) => {
                const isSelected = selectedNetwork === net.id;
                return (
                  <TouchableOpacity
                    key={net.id}
                    style={[
                      styles.providerChip,
                      isSelected && styles.providerChipActive,
                    ]}
                    onPress={() => setSelectedNetwork(net.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.providerChipText,
                        isSelected && styles.providerChipTextActive,
                      ]}
                    >
                      {net.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Plan Category Filter Tabs (Night, Daily, Weekly, Monthly, Router) */}
            <Text style={styles.fieldLabel}>Plan Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {DATA_FILTERS.map((f) => {
                const isSelected = selectedPlanType === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.dataFilterChip,
                      isSelected && styles.dataFilterChipActive,
                    ]}
                    onPress={() => setSelectedPlanType(f.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={f.icon as any}
                      size={13}
                      color={isSelected ? "#FFFFFF" : Colors.textOnSheetSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.dataFilterChipText,
                        isSelected && styles.dataFilterChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Customer Identifier (Phone or Router Number) */}
            {/* Customer Identifier (Phone or Router Number) */}
            <View style={styles.phoneLabelRow}>
              <Text style={styles.fieldLabelInline}>
                {selectedPlanType === "router" ||
                ["Smile", "Spectranet"].includes(selectedNetwork)
                  ? "Router ID / Account / Phone Number"
                  : "Phone Number"}
              </Text>
              {detectedNetwork && (
                <View
                  style={[
                    styles.detectedBadge,
                    {
                      backgroundColor: NETWORK_METAS[detectedNetwork].badgeBg,
                      borderColor: NETWORK_METAS[detectedNetwork].badgeBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.detectedDot,
                      { backgroundColor: NETWORK_METAS[detectedNetwork].brandColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.detectedBadgeText,
                      { color: NETWORK_METAS[detectedNetwork].textColor },
                    ]}
                  >
                    {detectedNetwork} Auto-Selected
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  detectedNetwork ? styles.inputWithBadge : null,
                ]}
                placeholder={
                  selectedPlanType === "router" ||
                  ["Smile", "Spectranet"].includes(selectedNetwork)
                    ? "e.g. 07020000000 or Account ID"
                    : "e.g. 08012345678"
                }
                placeholderTextColor={Colors.textOnSheetMuted}
                keyboardType="number-pad"
                value={customer}
                onChangeText={handleCustomerChange}
              />
              {detectedNetwork && (
                <View
                  style={[
                    styles.inputNetworkPill,
                    { backgroundColor: NETWORK_METAS[detectedNetwork].brandColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.inputNetworkPillText,
                      detectedNetwork === "MTN" ? { color: "#07070C" } : { color: "#FFFFFF" },
                    ]}
                  >
                    {detectedNetwork}
                  </Text>
                </View>
              )}
            </View>

            {/* Data Plans List */}
            <View style={styles.planListHeaderRow}>
              <Text style={styles.fieldLabel}>
                Choose Data Plan ({filteredDataPlans.length})
              </Text>
              {filteredDataPlans.length > 3 && (
                <View style={styles.scrollHintBadge}>
                  <Ionicons name="swap-vertical" size={11} color={Colors.primary} />
                  <Text style={styles.scrollHintText}>Vertical scroll</Text>
                </View>
              )}
            </View>

            {isLoadingBillers ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginVertical: 20 }}
              />
            ) : filteredDataPlans.length === 0 ? (
              <View style={styles.emptyPlansCard}>
                <Ionicons name="search-outline" size={24} color={Colors.textOnSheetMuted} />
                <Text style={styles.emptyPlansText}>
                  No plans available for this filter.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.dataPlansScroll}
                contentContainerStyle={styles.dataPlansScrollContent}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.dataPlansGrid}>
                  {filteredDataPlans.map((plan) => {
                    const isSelected = selectedBiller?.id === plan.id;
                    return (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.dataPlanCard,
                          isSelected && styles.dataPlanCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedBiller(plan);
                          if (plan.amount) {
                            setAmount(plan.amount.toString());
                          }
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.dataPlanTopRow}>
                          <View style={styles.allowanceBadge}>
                            <Text style={styles.allowanceBadgeText}>
                              {plan.data_allowance || "Data"}
                            </Text>
                          </View>

                          <View style={styles.validityBadge}>
                            <Ionicons
                              name={
                                plan.plan_type === "night"
                                  ? "moon-outline"
                                  : plan.plan_type === "router"
                                  ? "wifi-outline"
                                  : "time-outline"
                              }
                              size={11}
                              color={Colors.primary}
                              style={{ marginRight: 3 }}
                            />
                            <Text style={styles.validityBadgeText}>
                              {plan.validity}
                            </Text>
                          </View>

                          {isSelected && (
                            <View style={styles.checkCircle}>
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </View>

                        <View style={styles.dataPlanInfoRow}>
                          <Text style={styles.dataPlanTitle} numberOfLines={2}>
                            {plan.name}
                          </Text>
                          <Text style={styles.dataPlanPriceText}>
                            ₦{plan.amount?.toLocaleString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </>
        ) : (
          <>
            {/* Standard Provider Selector (for Airtime, Electricity, Cable) */}
            <Text style={styles.fieldLabel}>Select Provider</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.providerScroll}
              contentContainerStyle={styles.providerScrollContent}
            >
              {billers.map((b) => {
                const isSelected = selectedBiller?.id === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.providerChip,
                      isSelected && styles.providerChipActive,
                    ]}
                    onPress={() => handleSelectBiller(b)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.providerChipText,
                        isSelected && styles.providerChipTextActive,
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* For Electricity: Prepaid vs Postpaid selector */}
            {activeCategory === "electricity" && (
              <View style={styles.meterTypeRow}>
                {(["prepaid", "postpaid"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.meterTypeBtn,
                      meterType === t && styles.meterTypeBtnActive,
                    ]}
                    onPress={() => setMeterType(t)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.meterTypeText,
                        meterType === t && styles.meterTypeTextActive,
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Customer Identifier Input */}
            <View style={styles.phoneLabelRow}>
              <Text style={styles.fieldLabelInline}>
                {activeCategory === "electricity"
                  ? "Meter Number"
                  : activeCategory === "cable"
                  ? "Smartcard / IUC Number"
                  : "Phone Number"}
              </Text>
              {activeCategory === "airtime" && detectedNetwork && (
                <View
                  style={[
                    styles.detectedBadge,
                    {
                      backgroundColor: NETWORK_METAS[detectedNetwork].badgeBg,
                      borderColor: NETWORK_METAS[detectedNetwork].badgeBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.detectedDot,
                      { backgroundColor: NETWORK_METAS[detectedNetwork].brandColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.detectedBadgeText,
                      { color: NETWORK_METAS[detectedNetwork].textColor },
                    ]}
                  >
                    {detectedNetwork} Auto-Selected
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  activeCategory === "airtime" && detectedNetwork ? styles.inputWithBadge : null,
                ]}
                placeholder={
                  activeCategory === "electricity"
                    ? "e.g. 04293810294"
                    : activeCategory === "cable"
                    ? "e.g. 1029384756"
                    : "e.g. 08012345678"
                }
                placeholderTextColor={Colors.textOnSheetMuted}
                keyboardType="number-pad"
                value={customer}
                onChangeText={handleCustomerChange}
              />
              {activeCategory === "airtime" && detectedNetwork && (
                <View
                  style={[
                    styles.inputNetworkPill,
                    { backgroundColor: NETWORK_METAS[detectedNetwork].brandColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.inputNetworkPillText,
                      detectedNetwork === "MTN" ? { color: "#07070C" } : { color: "#FFFFFF" },
                    ]}
                  >
                    {detectedNetwork}
                  </Text>
                </View>
              )}
              {activeCategory === "electricity" && (
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={handleValidateCustomer}
                  disabled={isValidating}
                  activeOpacity={0.7}
                >
                  {isValidating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Verified Customer Card (for Electricity / Cable) */}
            {validatedCustomer && (
              <View style={styles.verifiedCard}>
                <View style={styles.verifiedIconCircle}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.verifiedTag}>VERIFIED CUSTOMER</Text>
                  <Text style={styles.verifiedName}>{validatedCustomer.name}</Text>
                  {validatedCustomer.address && (
                    <Text style={styles.verifiedAddress}>
                      {validatedCustomer.address}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Amount Input */}
            <Text style={styles.fieldLabel}>Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="1,000"
              placeholderTextColor={Colors.textOnSheetMuted}
              keyboardType="numeric"
              editable={!selectedBiller?.amount}
              value={amount}
              onChangeText={setAmount}
            />

            {/* Quick Amount Chips (when custom amount allowed) */}
            {!selectedBiller?.amount && (
              <View style={styles.chipsRow}>
                {[1000, 2000, 5000, 10000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={styles.amountChip}
                    onPress={() => setAmount(val.toString())}
                  >
                    <Text style={styles.chipText}>+₦{val.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Submit Jet-Black Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!customer || !amount) && styles.submitBtnDisabled,
          ]}
          disabled={!customer || !amount || isPaying}
          onPress={handleInitiatePayment}
          activeOpacity={0.85}
        >
          {isPaying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              Pay{" "}
              {amount
                ? `₦${parseFloat(amount || "0").toLocaleString()}`
                : "Now"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* PIN Security Modal */}
      <PasscodeModal
        visible={passcodeModalVisible}
        title="Authorize Payment"
        subtitle={`Enter 4-digit PIN to pay ₦${parseFloat(amount || "0").toLocaleString()} for ${selectedBiller?.name}`}
        onSuccess={handlePasscodeSuccess}
        onCancel={() => setPasscodeModalVisible(false)}
      />

      {/* Success / Processing Receipt Modal */}
      <Modal visible={receiptVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptSheet}>
            <View
              style={[
                styles.successIconCircle,
                receiptData?.status === "processing" && {
                  backgroundColor: "#3B82F6",
                },
              ]}
            >
              <Ionicons
                name={
                  receiptData?.status === "processing"
                    ? "time-outline"
                    : "checkmark"
                }
                size={32}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.receiptTitle}>
              {receiptData?.status === "processing"
                ? "Order Processing"
                : "Payment Successful"}
            </Text>
            <Text style={styles.receiptSub}>
              {receiptData?.message ||
                `${formatNGN(receiptData?.amount || 0)} paid to ${
                  receiptData?.biller_name
                }`}
            </Text>

            {/* If Electricity: Prominently show 20-digit token */}
            {receiptData?.token && (
              <View style={styles.tokenCard}>
                <Text style={styles.tokenLabel}>20-DIGIT METER TOKEN</Text>
                <Text style={styles.tokenNumber}>{receiptData.token}</Text>
                {receiptData.units && (
                  <Text style={styles.tokenUnits}>
                    Units: {receiptData.units}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.copyTokenBtn}
                  onPress={handleCopyToken}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={copiedToken ? "checkmark-circle" : "copy-outline"}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.copyTokenBtnText}>
                    {copiedToken ? "Token Copied!" : "Copy Token"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptRowLabel}>Recipient / Meter</Text>
              <Text style={styles.receiptRowVal}>{receiptData?.customer}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptRowLabel}>Reference</Text>
              <Text style={styles.receiptRowVal}>{receiptData?.reference}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptRowLabel}>Status</Text>
              <Text
                style={[
                  styles.receiptRowVal,
                  {
                    color:
                      receiptData?.status === "processing"
                        ? "#3B82F6"
                        : "#10B981",
                    fontWeight: "800",
                  },
                ]}
              >
                {receiptData?.status === "processing"
                  ? "PROCESSING"
                  : "SUCCESSFUL"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setReceiptVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Offline Zero-Data & Zero-Airtime Toll-Free Modal */}
      <Modal visible={offlineModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View style={styles.offlineSheet}>
            {/* Header */}
            <View style={styles.offlineHeaderRow}>
              <View style={styles.offlineHeaderTitleBox}>
                <View style={styles.offlineHeaderIconBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#A29BFE" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.offlineSheetTitle}>Offline SMS Recharge</Text>
                  <Text style={styles.offlineSheetSub}>Toll-Free • 0MB Data & ₦0 Airtime</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.offlineCloseBtn}
                onPress={() => setOfflineModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.tollFreeBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.tollFreeBadgeText}>CreasPay covers the ₦4 carrier SMS fee</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {/* Service Toggle: Data vs Airtime */}
              <View style={styles.offlineToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.offlineToggleBtn,
                    offlineService === "data" && styles.offlineToggleBtnActive,
                  ]}
                  onPress={() => setOfflineService("data")}
                >
                  <Ionicons
                    name="wifi"
                    size={16}
                    color={offlineService === "data" ? "#FFFFFF" : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.offlineToggleText,
                      offlineService === "data" && styles.offlineToggleTextActive,
                    ]}
                  >
                    Data Bundle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.offlineToggleBtn,
                    offlineService === "airtime" && styles.offlineToggleBtnActive,
                  ]}
                  onPress={() => setOfflineService("airtime")}
                >
                  <Ionicons
                    name="phone-portrait"
                    size={16}
                    color={offlineService === "airtime" ? "#FFFFFF" : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.offlineToggleText,
                      offlineService === "airtime" && styles.offlineToggleTextActive,
                    ]}
                  >
                    Airtime
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Recipient Phone Input */}
              <View style={{ marginBottom: 16 }}>
                <View style={styles.offlineFieldHeaderRow}>
                  <Text style={styles.offlineFieldLabel}>Recipient Phone Number</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const myNum = formatUserPhoneForInput(user?.phone_number || "");
                      if (myNum) {
                        setOfflineRecipientPhone(myNum);
                        const detected = detectNigerianNetwork(myNum);
                        if (detected) setOfflineNetwork(detected);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.offlineMyNumBtn}>My Number</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.offlineInputContainer}>
                  <TextInput
                    style={styles.offlineInput}
                    placeholder="0801 234 5678"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    value={offlineRecipientPhone}
                    onChangeText={(text) => {
                      setOfflineRecipientPhone(text);
                      const clean = text.replace(/\D/g, "");
                      if (clean.length >= 4) {
                        const detected = detectNigerianNetwork(clean);
                        if (detected) {
                          setOfflineNetwork(detected);
                        }
                      }
                    }}
                  />
                  {offlineNetwork && (
                    <View style={styles.offlineNetBadge}>
                      <Text style={styles.offlineNetBadgeText}>{offlineNetwork}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Network Selector */}
              <Text style={styles.offlineFieldLabel}>Select Network</Text>
              <View style={styles.offlineNetRow}>
                {["MTN", "Airtel", "Glo", "9mobile"].map((net) => {
                  const isSelected = offlineNetwork.toUpperCase() === net.toUpperCase();
                  return (
                    <TouchableOpacity
                      key={net}
                      style={[
                        styles.offlineNetChip,
                        isSelected && styles.offlineNetChipActive,
                      ]}
                      onPress={() => setOfflineNetwork(net)}
                    >
                      <Text
                        style={[
                          styles.offlineNetText,
                          isSelected && styles.offlineNetTextActive,
                        ]}
                      >
                        {net}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Bundle / Amount Selector */}
              {offlineService === "data" ? (
                <>
                  <Text style={styles.offlineFieldLabel}>Choose Available Data Plan</Text>
                  <View style={styles.offlinePresetsGrid}>
                    {availableOfflinePlans.map((plan) => {
                      const isSelected = offlineSelectedPlanId === plan.id;
                      return (
                        <TouchableOpacity
                          key={plan.id}
                          style={[
                            styles.offlinePresetBox,
                            isSelected && styles.offlinePresetBoxActive,
                          ]}
                          onPress={() => setOfflineSelectedPlanId(plan.id)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.offlinePresetVol,
                              isSelected && styles.offlinePresetVolActive,
                            ]}
                          >
                            {plan.label}
                          </Text>
                          <Text
                            style={[
                              styles.offlinePresetPrice,
                              isSelected && styles.offlinePresetPriceActive,
                            ]}
                          >
                            ₦{plan.price.toLocaleString()}
                          </Text>
                          <Text style={styles.offlinePresetValidity}>
                            {plan.validity}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.offlineFieldLabel}>Airtime Amount</Text>
                  <View style={styles.offlinePresetsGrid}>
                    {["500", "1000", "2000", "5000"].map((amtStr) => {
                      const isSelected = offlineAirtimeAmount === amtStr;
                      return (
                        <TouchableOpacity
                          key={amtStr}
                          style={[
                            styles.offlinePresetBox,
                            isSelected && styles.offlinePresetBoxActive,
                          ]}
                          onPress={() => setOfflineAirtimeAmount(amtStr)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.offlinePresetVol,
                              isSelected && styles.offlinePresetVolActive,
                            ]}
                          >
                            ₦{parseInt(amtStr).toLocaleString()}
                          </Text>
                          <Text style={styles.offlinePresetValidity}>Airtime</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* 4-digit PIN Input */}
              <Text style={styles.offlineFieldLabel}>CreasPay 4-Digit Passcode</Text>
              <TextInput
                style={styles.offlinePinInput}
                placeholder="••••"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={offlinePin}
                onChangeText={setOfflinePin}
              />

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.offlineActionBtn,
                  (!offlinePin || offlinePin.length < 4) && styles.offlineActionBtnDisabled,
                ]}
                disabled={!offlinePin || offlinePin.length < 4}
                onPress={handleLaunchOfflineSms}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                <Text style={styles.offlineActionBtnText}>
                  Send Toll-Free SMS (₦0.00)
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    marginBottom: 16,
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
    marginBottom: 16,
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
  categoryTabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  catTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 14,
    gap: 5,
  },
  catTabActive: {
    backgroundColor: Colors.primary,
  },
  catTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  catTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: Colors.sheetBackground,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    minHeight: 580,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sheetSectionTitle: {
    fontSize: 19,
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
    marginBottom: 5,
    marginTop: 8,
  },
  phoneLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 5,
  },
  fieldLabelInline: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
  },
  detectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  detectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detectedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  providerScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  providerScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  providerChip: {
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  providerChipActive: {
    backgroundColor: Colors.textOnSheet,
  },
  providerChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textOnSheetSecondary,
  },
  providerChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  meterTypeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  meterTypeBtn: {
    flex: 1,
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: "center",
  },
  meterTypeBtnActive: {
    backgroundColor: Colors.textOnSheet,
  },
  meterTypeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheetSecondary,
  },
  meterTypeTextActive: {
    color: "#FFFFFF",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  inputWithBadge: {
    paddingRight: 88,
  },
  inputNetworkPill: {
    position: "absolute",
    right: 10,
    top: 9,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  inputNetworkPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  verifyBtn: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  verifyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  verifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sheetSurface,
    padding: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  verifiedIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedTag: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.textOnSheetMuted,
    letterSpacing: 0.5,
  },
  verifiedName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textOnSheet,
    marginTop: 1,
  },
  verifiedAddress: {
    fontSize: 11,
    color: Colors.textOnSheetSecondary,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
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
  submitBtn: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  submitBtnDisabled: {
    backgroundColor: "#14141F",
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 12, 0.75)",
    justifyContent: "flex-end",
  },
  receiptSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 26,
    alignItems: "center",
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textOnSheet,
  },
  receiptSub: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textOnSheetSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  tokenCard: {
    width: "100%",
    backgroundColor: Colors.sheetSurface,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    marginVertical: 10,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textOnSheetMuted,
    letterSpacing: 1,
  },
  tokenNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textOnSheet,
    letterSpacing: 2,
    marginVertical: 8,
  },
  tokenUnits: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 8,
  },
  copyTokenBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
  },
  copyTokenBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  receiptDivider: {
    width: "100%",
    height: 1,
    backgroundColor: Colors.sheetBorder,
    marginVertical: 14,
  },
  receiptRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  receiptRowLabel: {
    fontSize: 12,
    color: Colors.textOnSheetMuted,
  },
  receiptRowVal: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
  doneBtn: {
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  filterScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  dataFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 8,
  },
  dataFilterChipActive: {
    backgroundColor: Colors.primary,
  },
  dataFilterChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textOnSheetSecondary,
  },
  dataFilterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  planListHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  scrollHintBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 30, 117, 0.08)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  scrollHintText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  dataPlansScroll: {
    maxHeight: 200,
    borderRadius: 18,
    marginVertical: 4,
  },
  dataPlansScrollContent: {
    paddingBottom: 4,
    paddingRight: 2,
  },
  emptyPlansCard: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    gap: 8,
  },
  emptyPlansText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textOnSheetMuted,
  },
  dataPlansGrid: {
    gap: 8,
    marginTop: 2,
  },
  dataPlanCard: {
    backgroundColor: Colors.sheetSurface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dataPlanCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#FFF5F8",
  },
  dataPlanTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  allowanceBadge: {
    backgroundColor: Colors.textOnSheet,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  allowanceBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  validityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 30, 117, 0.08)",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  validityBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  dataPlanInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  dataPlanTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textOnSheetSecondary,
    flex: 1,
    marginRight: 8,
  },
  dataPlanPriceText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textOnSheet,
  },
  // Offline Zero-Data & Zero-Airtime Styles
  offlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(162, 155, 254, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(162, 155, 254, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  offlineBtnText: {
    color: "#A29BFE",
    fontSize: 12,
    fontWeight: "700",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  offlineBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  offlineIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(162, 155, 254, 0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  offlineBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  offlineBannerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  offlineSheet: {
    backgroundColor: "#12131A",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
    width: "100%",
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  offlineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  offlineHeaderTitleBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  offlineHeaderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(162, 155, 254, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(162, 155, 254, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  offlineSheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  offlineSheetSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  offlineCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  tollFreeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 16,
  },
  tollFreeBadgeText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },
  offlineFieldHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  offlineMyNumBtn: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A29BFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(162, 155, 254, 0.12)",
    borderRadius: 6,
  },
  offlineInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 14,
    height: 48,
  },
  offlineInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  offlineNetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.4)",
  },
  offlineNetBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A29BFE",
  },
  offlineToggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  offlineToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  offlineToggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  offlineToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  offlineToggleTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  offlineFieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  offlineNetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  offlineNetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  offlineNetChipActive: {
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    borderColor: Colors.primary,
  },
  offlineNetText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  offlineNetTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  offlinePresetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  offlinePresetBox: {
    width: "31%",
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  offlinePresetBoxActive: {
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    borderColor: Colors.primary,
  },
  offlinePresetVol: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  offlinePresetVolActive: {
    color: "#FFFFFF",
  },
  offlinePresetPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    marginTop: 2,
  },
  offlinePresetPriceActive: {
    color: "#A29BFE",
  },
  offlinePresetValidity: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 2,
  },
  offlinePinInput: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 8,
    textAlign: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },
  offlineActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  offlineActionBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.5,
  },
  offlineActionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
