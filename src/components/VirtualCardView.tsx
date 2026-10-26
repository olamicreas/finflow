import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Colors } from "../theme/colors";
import { formatCardPan, formatUSD } from "../utils/formatters";
import { VirtualCardItem } from "../context/FinFlowContext";
import { ArtisticCardArt } from "./ArtisticCardArt";
import { CreasPayLogo } from "./CreasPayLogo";

interface Props {
  card: VirtualCardItem;
  unmaskedDetails?: {
    card_number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
  } | null;
  onRevealPress?: () => void;
  onFreezeToggle?: () => void;
  onFundPress?: () => void;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width - 48, 360);
const CARD_HEIGHT = CARD_WIDTH * 0.62;

export const VirtualCardView: React.FC<Props> = ({
  card,
  unmaskedDetails,
  onRevealPress,
  onFreezeToggle,
  onFundPress,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const isFrozen = card.status === "frozen";

  const copyToClipboard = async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const displayPan = unmaskedDetails
    ? formatCardPan(unmaskedDetails.card_number)
    : `••••  ${card.last4}`;
  const displayCvv = unmaskedDetails ? unmaskedDetails.cvv : "•••";
  const displayExp = unmaskedDetails
    ? `${unmaskedDetails.expiry_month}/${unmaskedDetails.expiry_year.slice(-2)}`
    : `${card.expiry_month}/${card.expiry_year.slice(-2)}`;

  return (
    <View style={styles.container}>
      <View style={styles.cardRowWrapper}>
        {/* Main Artistic Black Visa Card */}
        <View
          style={[
            styles.card,
            {
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
            },
          ]}
        >
          <ArtisticCardArt variant={isFrozen ? "frozen" : "default"} />

          {/* Top Row: CreasPay Brand Logo on left, VISA on right */}
          <View style={styles.topRow}>
            <CreasPayLogo size={22} showText textSize={15} textColor="#FFFFFF" />
            <Text style={styles.visaLogo}>VISA</Text>
          </View>

          {/* Middle Row: Balance Label + Large USD Balance on left, PAN on right */}
          <View style={styles.middleRow}>
            <View style={styles.balanceBlock}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceValue}>{formatUSD(card.balance)}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                unmaskedDetails &&
                copyToClipboard(unmaskedDetails.card_number, "PAN")
              }
              style={styles.panTouch}
            >
              <Text
                style={[
                  styles.panText,
                  unmaskedDetails && styles.panTextFull,
                ]}
              >
                {displayPan}
              </Text>
              {unmaskedDetails && (
                <Ionicons
                  name={copiedField === "PAN" ? "checkmark-circle" : "copy-outline"}
                  size={15}
                  color="#FFFFFF"
                  style={{ marginLeft: 6 }}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Cardholder, Expiry & CVV */}
          <View style={styles.bottomRow}>
            <Text style={styles.holderName} numberOfLines={1}>
              {card.cardholder_name}
            </Text>

            <View style={styles.metaGroup}>
              <Text style={styles.metaItem}>EXP {displayExp}</Text>
              <TouchableOpacity
                onPress={() =>
                  unmaskedDetails && copyToClipboard(unmaskedDetails.cvv, "CVV")
                }
                style={{ flexDirection: "row", alignItems: "center", marginLeft: 12 }}
              >
                <Text style={styles.metaItem}>CVV {displayCvv}</Text>
                {unmaskedDetails && (
                  <Ionicons
                    name={copiedField === "CVV" ? "checkmark" : "copy-outline"}
                    size={12}
                    color="#FFFFFF"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* FROZEN OVERLAY */}
          {isFrozen && (
            <View style={styles.frozenOverlay}>
              <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
              <Text style={styles.frozenTitle}>Card Frozen</Text>
              <Text style={styles.frozenSub}>Tap Unfreeze below to resume</Text>
            </View>
          )}
        </View>
      </View>

      {/* Clean Control Bar on White Sheet */}
      <View style={[styles.controlBar, { width: CARD_WIDTH }]}>
        <TouchableOpacity
          style={styles.controlPill}
          onPress={onRevealPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={unmaskedDetails ? "eye-off-outline" : "eye-outline"}
            size={16}
            color={Colors.textOnSheet}
          />
          <Text style={styles.controlPillText}>
            {unmaskedDetails ? "Hide Details" : "Card Details"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlPill}
          onPress={onFreezeToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFrozen ? "lock-open-outline" : "lock-closed-outline"}
            size={16}
            color={Colors.textOnSheet}
          />
          <Text style={styles.controlPillText}>
            {isFrozen ? "Unfreeze" : "Freeze"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlPill, styles.controlPillPrimary]}
          onPress={onFundPress}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={17} color="#FFFFFF" />
          <Text style={[styles.controlPillText, { color: "#FFFFFF" }]}>
            Top Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 6,
  },
  cardRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#0B0B12",
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingVertical: 22,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#090912",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
  },
  panTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
  panText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  panTextFull: {
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  visaLogo: {
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  balanceBlock: {
    marginTop: 6,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.72)",
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  holderName: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.8,
    maxWidth: 140,
  },
  metaGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaItem: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  frozenOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7, 7, 12, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 26,
  },
  frozenTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 6,
  },
  frozenSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  controlBar: {
    flexDirection: "row",
    marginTop: 14,
    justifyContent: "space-between",
    gap: 8,
  },
  controlPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.sheetSurface,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
  },
  controlPillPrimary: {
    backgroundColor: Colors.primary,
  },
  controlPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnSheet,
  },
});
