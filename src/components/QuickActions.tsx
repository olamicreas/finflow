import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

interface Props {
  onAddMoney: () => void;
  onSendMoney: () => void;
  onNewCard: () => void;
  onFundCard: () => void;
}

export const QuickActions: React.FC<Props> = ({
  onAddMoney,
  onSendMoney,
  onNewCard,
  onFundCard,
}) => {
  const actions = [
    {
      label: "Add Money",
      icon: "add-outline" as const,
      onPress: onAddMoney,
    },
    {
      label: "Send",
      icon: "arrow-up-outline" as const,
      onPress: onSendMoney,
    },
    {
      label: "New Card",
      icon: "card-outline" as const,
      onPress: onNewCard,
    },
    {
      label: "Top Up",
      icon: "flash-outline" as const,
      onPress: onFundCard,
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((act, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.actionBtn}
          onPress={act.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={act.icon} size={22} color={Colors.primary} />
          </View>
          <Text style={styles.actionLabel}>{act.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 18,
    paddingHorizontal: 8,
  },
  actionBtn: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
