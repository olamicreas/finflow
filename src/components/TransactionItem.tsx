import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { formatDate, formatNGN, formatUSD } from "../utils/formatters";
import { TransactionItemData } from "../context/FinFlowContext";

interface Props {
  transaction: TransactionItemData;
  onPress?: () => void;
}

export const TransactionItem: React.FC<Props> = ({ transaction, onPress }) => {
  const isCashback =
    transaction.type === "cashback" ||
    transaction.category === "reward" ||
    transaction.narration.toLowerCase().includes("cashback");

  const isPositive =
    isCashback ||
    transaction.category === "inflow" ||
    transaction.type === "deposit" ||
    transaction.type === "refund" ||
    (transaction.type === "card_withdrawal" && transaction.currency === "NGN");

  const getVisualConfig = () => {
    if (isCashback) {
      return {
        icon: "sparkles",
        color: "#10B981",
        bg: "rgba(16, 185, 129, 0.12)",
        badge: "Cashback",
        badgeColor: "#10B981",
        badgeBg: "rgba(16, 185, 129, 0.10)",
      };
    }
    switch (transaction.type) {
      case "deposit":
        return {
          icon: "arrow-down",
          color: "#10B981",
          bg: "rgba(16, 185, 129, 0.12)",
          badge: "Inflow",
          badgeColor: "#10B981",
          badgeBg: "rgba(16, 185, 129, 0.10)",
        };
      case "refund":
        return {
          icon: "refresh",
          color: "#10B981",
          bg: "rgba(16, 185, 129, 0.12)",
          badge: "Refund",
          badgeColor: "#10B981",
          badgeBg: "rgba(16, 185, 129, 0.10)",
        };
      case "bill_payment":
        return {
          icon: "receipt-outline",
          color: Colors.primary,
          bg: Colors.primaryMuted,
          badge: "Bill",
          badgeColor: Colors.primary,
          badgeBg: Colors.primaryMuted,
        };
      case "transfer_out":
        return {
          icon: "paper-plane-outline",
          color: "#0B0B12",
          bg: Colors.sheetSurface,
          badge: "Transfer",
          badgeColor: Colors.textOnSheetSecondary,
          badgeBg: Colors.sheetSurface,
        };
      case "card_funding":
      case "card_spend":
      case "card_withdrawal":
        return {
          icon: "card-outline",
          color: "#7000FF",
          bg: "rgba(112, 0, 255, 0.10)",
          badge: "Card",
          badgeColor: "#7000FF",
          badgeBg: "rgba(112, 0, 255, 0.10)",
        };
      default:
        return {
          icon: "receipt-outline",
          color: "#0B0B12",
          bg: Colors.sheetSurface,
          badge: "Payment",
          badgeColor: Colors.textOnSheetSecondary,
          badgeBg: Colors.sheetSurface,
        };
    }
  };

  const config = getVisualConfig();

  const formattedAmount =
    transaction.currency === "USD"
      ? formatUSD(transaction.amount)
      : formatNGN(transaction.amount);

  const displayTitle =
    transaction.counterparty_name || transaction.narration || "Transaction";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
        <Ionicons
          name={config.icon as any}
          size={18}
          color={config.color}
        />
      </View>

      <View style={styles.midCol}>
        <Text style={styles.title} numberOfLines={1}>
          {displayTitle}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.subText} numberOfLines={1}>
            {formatDate(transaction.created_at)}
          </Text>
          {config.badge && (
            <View style={[styles.miniBadge, { backgroundColor: config.badgeBg }]}>
              <Text style={[styles.miniBadgeText, { color: config.badgeColor }]}>
                {config.badge}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightCol}>
        <Text
          style={[
            styles.amount,
            isPositive ? styles.amountPositive : styles.amountNegative,
          ]}
        >
          {isPositive ? "+" : "-"}
          {formattedAmount}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={13}
          color={Colors.textOnSheetMuted}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  midCol: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnSheet,
    marginBottom: 4,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rightCol: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  amountPositive: {
    color: Colors.success,
  },
  amountNegative: {
    color: Colors.textOnSheet,
  },
  chevron: {
    opacity: 0.5,
    marginLeft: 2,
  },
});
