import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";
import { computeTieredBreakdown } from "../../utils/overtimeUtils.js";

/**
 * Shift detail card shown below calendar for selected date.
 * Premium Redesign with Gradients and Glassmorphism.
 */
export default function ShiftDetailCard({
  shift,
  selectedDate,
  config,
  earned,
  onDayPress,
  onDeleteShift,
}) {
  const rate = Number(config?.hourlyRate || 0);
  const percent = Number(shift?.hourlyPercent || 100) / 100;
  const hours = Number(shift?.totalHours || 0);
  const overtimeBreakdown =
    shift && shift.type === "עבודה"
      ? computeTieredBreakdown(hours, rate, percent, config)
      : [];

  const renderSwipeRight = () => (
    <TouchableOpacity
      style={styles.swipeDelete}
      onPress={() => {
        Alert.alert("מחיקה", "למחוק משמרת זו?", [
          { text: "ביטול", style: "cancel" },
          {
            text: "מחק",
            style: "destructive",
            onPress: () => onDeleteShift?.(selectedDate),
          },
        ]);
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="trash-outline" size={20} color="#fff" />
      <Text style={styles.swipeText}>מחיקה</Text>
    </TouchableOpacity>
  );

  const renderSwipeLeft = () => (
    <TouchableOpacity
      style={styles.swipeEdit}
      onPress={() => onDayPress(selectedDate)}
      activeOpacity={0.7}
    >
      <Ionicons name="create-outline" size={20} color="#fff" />
      <Text style={styles.swipeText}>עדכון</Text>
    </TouchableOpacity>
  );

  if (!shift) return null;

  return (
    <Swipeable
      renderRightActions={renderSwipeRight}
      renderLeftActions={renderSwipeLeft}
    >
      <Animated.View
        entering={FadeInDown.duration(250)}
        style={styles.container}
      >
        <LinearGradient colors={["#ffffff", "#f1f3f5"]} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerRight}>
              <View style={styles.iconCircle}>
                <Ionicons name="time" size={18} color={T.accent} />
              </View>
              <View>
                <Text style={styles.headerTitle}>פרטי משמרת</Text>
                <Text style={styles.headerSubtitle}>{selectedDate}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onDayPress(selectedDate)}
              >
                <Ionicons name="create-outline" size={18} color={T.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => {
                  Alert.alert("מחיקה", "למחוק משמרת זו?", [
                    { text: "ביטול", style: "cancel" },
                    {
                      text: "מחק",
                      style: "destructive",
                      onPress: () => onDeleteShift?.(selectedDate),
                    },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={T.red} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mainInfo}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>סה"כ שעות</Text>
              <Text style={styles.timeValue}>{shift.totalHours || "0.00"}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.timeRangeBox}>
              <View style={styles.timeBit}>
                <Text style={styles.bitValue}>
                  {shift.startTime || "--:--"}
                </Text>
                <Text style={styles.bitLabel}>התחלה</Text>
              </View>
              <Ionicons name="arrow-back" size={14} color={T.textMuted} />
              <View style={styles.timeBit}>
                <Text style={styles.bitValue}>{shift.endTime || "--:--"}</Text>
                <Text style={styles.bitLabel}>סיום</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <DetailItem
              label="סוג"
              value={shift.type || "עבודה"}
              icon="bookmark-outline"
              color={T.accent}
            />
            <DetailItem
              label="תעריף"
              value={`${shift.hourlyPercent || "100"}%`}
              icon="flash-outline"
              color={T.orange}
            />
            <DetailItem
              label="שכר"
              value={`₪${earned}`}
              icon="cash-outline"
              color={T.green}
            />
          </View>

          {overtimeBreakdown.length > 0 && (
            <View style={styles.overtimeSection}>
              <Text style={styles.sectionTitle}>פירוט שעות נוספות</Text>
              {overtimeBreakdown.map((b, idx) => (
                <View key={idx} style={styles.otRow}>
                  <Text style={styles.otHours}>{b.hours.toFixed(2)} שעות</Text>
                  <Text style={styles.otLabel}>
                    {b.multiplier * 100}% ({b.from}-{b.to || "∞"})
                  </Text>
                  <Text style={styles.otValue}>₪{Math.round(b.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {shift.notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>הערות:</Text>
              <Text style={styles.notesText}>{shift.notes}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </Animated.View>
    </Swipeable>
  );
}

const DetailItem = ({ label, value, icon, color }) => (
  <View style={styles.detailItem}>
    <View style={[styles.detailIcon, { backgroundColor: color + "10" }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <View style={styles.detailText}>
      <Text style={styles.detailLabelText}>{label}</Text>
      <Text style={styles.detailValueText}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    ...T.shadows.md,
  },
  card: {
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  headerSubtitle: {
    color: T.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "right",
  },
  headerActions: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "rgba(217, 83, 79, 0.05)",
  },
  mainInfo: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 14,
    borderRadius: T.radiusMd,
    marginBottom: 16,
  },
  timeBox: {
    alignItems: "center",
  },
  timeLabel: {
    color: T.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
  },
  timeValue: {
    color: T.accent,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -1,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  timeRangeBox: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  timeBit: {
    alignItems: "center",
  },
  bitValue: {
    color: T.text,
    fontSize: 16,
    fontWeight: "800",
  },
  bitLabel: {
    color: T.textMuted,
    fontSize: 9,
    fontWeight: "600",
  },
  detailsGrid: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
    padding: 8,
    borderRadius: T.radiusSm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  detailLabelText: {
    color: T.textMuted,
    fontSize: 9,
    fontWeight: "600",
    textAlign: "right",
  },
  detailValueText: {
    color: T.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  overtimeSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    color: T.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "right",
  },
  otRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  otHours: {
    color: T.text,
    fontSize: 12,
    fontWeight: "600",
  },
  otLabel: {
    color: T.textMuted,
    fontSize: 11,
    flex: 1,
    textAlign: "right",
    paddingRight: 8,
  },
  otValue: {
    color: T.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  notesSection: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: T.radiusSm,
  },
  notesLabel: {
    color: T.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "right",
  },
  notesText: {
    color: T.text,
    fontSize: 12,
    textAlign: "right",
    fontStyle: "italic",
  },
  swipeDelete: {
    backgroundColor: T.red,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: T.radiusLg,
    marginTop: 16,
  },
  swipeEdit: {
    backgroundColor: T.accent,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: T.radiusLg,
    marginTop: 16,
  },
  swipeText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },
});
