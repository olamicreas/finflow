import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "../theme/colors";

interface Props {
  size?: number;
  showText?: boolean;
  textSize?: number;
  textColor?: string;
  style?: ViewStyle;
}

export const CreasPayLogo: React.FC<Props> = ({
  size = 36,
  showText = false,
  textSize = 18,
  textColor = "#FFFFFF",
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require("../../assets/creaspay-mark.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize: textSize, color: textColor }]}>
            Creas<Text style={{ color: Colors.primary }}>Pay</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textContainer: {
    justifyContent: "center",
  },
  brandText: {
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});
