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
  const isPositive =
    transaction.category === "inflow" ||
    transaction.type === "deposit" ||
    (transaction.type === "card_withdrawal" && transaction.currency === "NGN");

  const getIconName = () => {
    switch (transaction.type) {
      case "deposit":
        return "arrow-down";
      case "transfer_out":
        return "paper-plane";
      case "card_funding":
        return "card";
      case "card_withdrawal":
        return "download";
      case "card_spend":
        return "bag-handle";
      default:
        return "receipt";
    }
  };

  const formattedAmount =
    transaction.currency === "USD"
      ? formatUSD(transaction.amount)
      : formatNGN(transaction.amount);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconCircle}>
        <Ionicons
          name={getIconName() as any}
          size={18}
          color={Colors.textOnSheet}
        />
      </View>

      <View style={styles.midCol}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.counterparty_name || transaction.narration}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.subText} numberOfLines={1}>
            {formatDate(transaction.created_at)}
          </Text>
          {transaction.earnings_percentage !== undefined && transaction.earnings_percentage > 0 && (
            <View style={styles.earningBadge}>
              <Ionicons name="trending-up" size={10} color="#059669" />
              <Text style={styles.earningBadgeText}>
                +{transaction.earnings_percentage}%
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
        {transaction.earnings_amount !== undefined && transaction.earnings_amount > 0 && (
          <Text style={styles.earningGainText}>
            gain +{transaction.earnings_currency === "USD" ? `$${transaction.earnings_amount.toFixed(2)}` : `₦${transaction.earnings_amount.toLocaleString()}`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
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
  midCol: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnSheet,
    marginBottom: 3,
  },
  subText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textOnSheetMuted,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  earningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 150, 105, 0.12)",
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 3,
  },
  earningBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  rightCol: {
    alignItems: "flex-end",
    marginLeft: 10,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
  },
  amountPositive: {
    color: Colors.success,
  },
  amountNegative: {
    color: Colors.danger,
  },
  earningGainText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },
});
