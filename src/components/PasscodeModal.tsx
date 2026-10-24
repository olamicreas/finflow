import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

interface Props {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
}

export const PasscodeModal: React.FC<Props> = ({
  visible,
  title = "Enter Security PIN",
  subtitle = "Authorize this transaction with your 4-digit PIN",
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState<string>("");

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          onSuccess(nextPin);
          setPin("");
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleClose = () => {
    setPin("");
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textOnSheetMuted} />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* 4-PIN Indicators */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <View
                  key={idx}
                  style={[styles.dot, filled && styles.dotFilled]}
                />
              );
            })}
          </View>

          {/* Keypad */}
          <View style={styles.keypad}>
            {[
              ["1", "2", "3"],
              ["4", "5", "6"],
              ["7", "8", "9"],
              ["empty", "0", "delete"],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((item, cIdx) => {
                  if (item === "empty") {
                    return <View key={cIdx} style={styles.keyBtnEmpty} />;
                  }
                  if (item === "delete") {
                    return (
                      <TouchableOpacity
                        key={cIdx}
                        style={styles.keyBtn}
                        onPress={handleDelete}
                        activeOpacity={0.6}
                      >
                        <Ionicons
                          name="backspace-outline"
                          size={22}
                          color={Colors.textOnSheet}
                        />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={cIdx}
                      style={styles.keyBtn}
                      onPress={() => handleKeyPress(item)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.keyText}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <Text style={styles.hintText}>PIN: 1234</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 12, 0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: 12,
    paddingBottom: 38,
    paddingHorizontal: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    padding: 6,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: Colors.textOnSheet,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textOnSheetMuted,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
    gap: 18,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.sheetSurface,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.15 }],
  },
  keypad: {
    marginTop: 8,
    alignItems: "center",
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 22,
  },
  keyBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.sheetSurface,
    justifyContent: "center",
    alignItems: "center",
  },
  keyBtnEmpty: {
    width: 68,
    height: 68,
  },
  keyText: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textOnSheet,
  },
  hintText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textOnSheetMuted,
    marginTop: 10,
  },
});
