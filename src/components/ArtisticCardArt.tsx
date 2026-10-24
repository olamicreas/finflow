import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  variant?: "default" | "frozen";
}

/**
 * Renders the organic abstract vector-style blobs inside the jet-black card
 * matching the reference Dribbble banking concept (Hot Pink top-right,
 * Electric Purple bottom-right, Bright Cyan bottom-left, Warm Yellow right edge,
 * and Deep Navy central wave).
 */
export const ArtisticCardArt: React.FC<Props> = ({ variant = "default" }) => {
  if (variant === "frozen") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.navySweep, { backgroundColor: "#161822" }]} />
        <View style={[styles.pinkBlob, { backgroundColor: "#2D3142" }]} />
        <View style={[styles.purpleBlob, { backgroundColor: "#232736" }]} />
        <View style={[styles.cyanBlob, { backgroundColor: "#1F2433" }]} />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep Navy Central Organic Wave */}
      <View style={styles.navySweep} />

      {/* Top-Right Hot Pink Blob (Behind VISA) */}
      <View style={styles.pinkBlob} />

      {/* Right Edge Warm Yellow Curve */}
      <View style={styles.yellowBlob} />

      {/* Bottom-Right Electric Purple Lobe */}
      <View style={styles.purpleBlob} />

      {/* Bottom-Left Bright Cyan Wave */}
      <View style={styles.cyanBlob} />
    </View>
  );
};

const styles = StyleSheet.create({
  navySweep: {
    position: "absolute",
    width: 210,
    height: 230,
    borderRadius: 95,
    backgroundColor: "#141829",
    top: -40,
    left: 45,
    transform: [{ rotate: "28deg" }],
  },
  pinkBlob: {
    position: "absolute",
    width: 115,
    height: 120,
    borderRadius: 55,
    backgroundColor: "#FF1E75",
    top: -32,
    right: -18,
    transform: [{ rotate: "-22deg" }],
  },
  yellowBlob: {
    position: "absolute",
    width: 80,
    height: 95,
    borderRadius: 42,
    backgroundColor: "#FFB800",
    bottom: 24,
    right: -38,
    transform: [{ rotate: "18deg" }],
  },
  purpleBlob: {
    position: "absolute",
    width: 125,
    height: 115,
    borderRadius: 52,
    backgroundColor: "#6C14FF",
    bottom: -48,
    right: 12,
    transform: [{ rotate: "-30deg" }],
  },
  cyanBlob: {
    position: "absolute",
    width: 130,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#00E5FF",
    bottom: -46,
    left: -10,
    transform: [{ rotate: "16deg" }],
  },
});
