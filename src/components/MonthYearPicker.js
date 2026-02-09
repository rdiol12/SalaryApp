import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { darkTheme as T } from "../constants/theme.js";

const { width } = Dimensions.get("window");

const MONTHS_HEB = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export default function MonthYearPicker({ visible, value, onClose, onSelect }) {
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());

  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(selectedYear, monthIndex, 1);
    onSelect(newDate);
    onClose();
  };

  const changeYear = (delta) => {
    setSelectedYear((prev) => prev + delta);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

        <TouchableOpacity
          activeOpacity={1}
          style={styles.content}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => changeYear(1)}
              style={styles.yearBtn}
            >
              <Ionicons name="chevron-forward" size={24} color={T.accent} />
            </TouchableOpacity>

            <Text style={styles.yearText}>{selectedYear}</Text>

            <TouchableOpacity
              onPress={() => changeYear(-1)}
              style={styles.yearBtn}
            >
              <Ionicons name="chevron-back" size={24} color={T.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthsGrid}>
            {MONTHS_HEB.map((month, index) => {
              const isSelected =
                value.getMonth() === index &&
                value.getFullYear() === selectedYear;

              return (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthItem,
                    isSelected && styles.monthItemActive,
                  ]}
                  onPress={() => handleMonthSelect(index)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      isSelected && styles.monthTextActive,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>סגור</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  content: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    ...T.shadows.lg,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  yearBtn: {
    padding: 8,
    backgroundColor: T.accentLight,
    borderRadius: 12,
  },
  yearText: {
    fontSize: 22,
    fontWeight: "900",
    color: T.text,
    letterSpacing: 1,
  },
  monthsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  monthItem: {
    width: (width * 0.85 - 48 - 20) / 3,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(62, 142, 208, 0.05)",
  },
  monthItemActive: {
    backgroundColor: T.accent,
  },
  monthText: {
    fontSize: 14,
    fontWeight: "600",
    color: T.textSecondary,
  },
  monthTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  closeBtn: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeBtnText: {
    color: T.accent,
    fontSize: 15,
    fontWeight: "700",
  },
});
