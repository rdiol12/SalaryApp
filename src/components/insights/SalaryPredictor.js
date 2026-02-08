import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";

const safeLocale = (n) => (n && isFinite(n) ? n.toLocaleString() : "0");

export default function SalaryPredictor({ predictedNet, currentNet }) {
  if (!predictedNet || !isFinite(predictedNet) || predictedNet <= currentNet)
    return null;

  const diff = predictedNet - currentNet;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.label}>תחזית לסוף חודש (נטו)</Text>
          <Text style={styles.value}>₪{safeLocale(predictedNet)}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={24} color={T.green} />
        </View>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          פלוס ₪{safeLocale(diff)} מהמצב הנוכחי
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.green + "15",
    borderRadius: T.radiusLg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.green + "30",
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    alignItems: "flex-end",
  },
  label: {
    color: T.green,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  value: {
    color: T.text,
    fontSize: 24,
    fontWeight: "800",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.green + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    marginTop: 10,
    backgroundColor: T.green + "25",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  badgeText: {
    color: T.green,
    fontSize: 11,
    fontWeight: "700",
  },
});
