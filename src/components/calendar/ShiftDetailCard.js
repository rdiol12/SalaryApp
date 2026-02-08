import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";
import { computeTieredBreakdown } from "../../utils/overtimeUtils.js";

/**
 * Shift detail card shown below calendar for selected date.
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
      <Ionicons name="trash-outline" size={18} color="#fff" />
      <Text style={styles.swipeText}>מחיקה</Text>
    </TouchableOpacity>
  );

  const renderSwipeLeft = () => (
    <TouchableOpacity
      style={styles.swipeEdit}
      onPress={() => onDayPress(selectedDate)}
      activeOpacity={0.7}
    >
      <Ionicons name="create-outline" size={18} color="#fff" />
      <Text style={styles.swipeText}>עדכון</Text>
    </TouchableOpacity>
  );

  if (!shift) return null;

  return (
    <Swipeable
      renderRightActions={renderSwipeRight}
      renderLeftActions={renderSwipeLeft}
    >
      <Animated.View entering={FadeInDown.duration(180)} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerRight}>
            <Ionicons name="time-outline" size={16} color={T.textSecondary} />
            <Text style={styles.headerTitle}>פרטי משמרת</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onDayPress(selectedDate)}
              activeOpacity={0.7}
            >
              <Text style={styles.editText}>עדכון</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
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
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.timeRow}>
          <View style={styles.totalHoursBox}>
            <Text style={styles.totalHoursValue}>
              {shift.totalHours || "0.00"}
            </Text>
            <Text style={styles.totalHoursLabel}>סך שעות</Text>
          </View>
          <View style={styles.timeRange}>
            <View style={styles.timeCol}>
              <Text style={styles.timeValue}>{shift.startTime || "--:--"}</Text>
              <Text style={styles.timeLabel}>זמן התחלה</Text>
            </View>
            <Text style={styles.timeDash}>-</Text>
            <View style={styles.timeCol}>
              <Text style={styles.timeValue}>{shift.endTime || "--:--"}</Text>
              <Text style={styles.timeLabel}>זמן סיום</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="options-outline"
              size={14}
              color={T.textSecondary}
            />
            <Text style={styles.sectionText}>תעריף</Text>
          </View>
          <View style={styles.rateGrid}>
            <InfoCell label="סוג" value={shift.type || "עבודה"} />
            <InfoCell
              label="תעריף"
              value={`${shift.hourlyPercent || "100"}%`}
            />
            <InfoCell label="שעות" value={shift.totalHours || "0.00"} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="trending-up-outline"
              size={14}
              color={T.textSecondary}
            />
            <Text style={styles.sectionText}>שעות נוספות</Text>
          </View>
          {overtimeBreakdown.length === 0 ? (
            <Text style={styles.noOvertimeText}>אין שעות נוספות</Text>
          ) : (
            overtimeBreakdown.map((b, idx) => (
              <View key={`${b.from}-${b.to}-${idx}`} style={styles.overtimeRow}>
                <Text style={styles.overtimeValue}>
                  ₪{Math.round(b.amount)}
                </Text>
                <Text style={styles.overtimeLabel}>
                  {b.to === null ? `מעל ${b.from}` : `${b.from}–${b.to}`} שעות ·{" "}
                  {Math.round(b.multiplier * 100)}%
                </Text>
                <Text style={styles.overtimeHours}>
                  {b.hours.toFixed(2)} שעות
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={14} color={T.textSecondary} />
            <Text style={styles.sectionText}>שכר</Text>
          </View>
          <Text style={styles.payValue}>₪{earned}</Text>
          <Text style={styles.paySub}>מחושב לפי שכר שעתי</Text>
        </View>
      </Animated.View>
    </Swipeable>
  );
}

const InfoCell = ({ label, value }) => (
  <View style={styles.infoCell}>
    <Text style={styles.infoValue}>{value}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    backgroundColor: T.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editText: {
    color: T.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: T.red,
    width: 32,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  timeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  totalHoursBox: {
    width: 80,
    backgroundColor: T.cardBgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
    alignItems: "center",
  },
  totalHoursValue: {
    color: T.text,
    fontSize: 16,
    fontWeight: "700",
  },
  totalHoursLabel: {
    color: T.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  timeRange: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timeCol: {
    alignItems: "center",
  },
  timeValue: {
    color: T.text,
    fontSize: 18,
    fontWeight: "700",
  },
  timeLabel: {
    color: T.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  timeDash: {
    color: T.textMuted,
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.divider,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionText: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  rateGrid: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
  },
  infoCell: {
    alignItems: "center",
  },
  infoValue: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  infoLabel: {
    color: T.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  noOvertimeText: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: "right",
  },
  overtimeRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  overtimeLabel: {
    color: T.textSecondary,
    fontSize: 11,
  },
  overtimeValue: {
    color: T.text,
    fontSize: 12,
    fontWeight: "700",
  },
  overtimeHours: {
    color: T.textMuted,
    fontSize: 11,
  },
  payValue: {
    color: T.accent,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  paySub: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  swipeDelete: {
    backgroundColor: T.red,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: T.radiusMd,
    marginTop: 12,
  },
  swipeEdit: {
    backgroundColor: T.accent,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: T.radiusMd,
    marginTop: 12,
  },
  swipeText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
});
