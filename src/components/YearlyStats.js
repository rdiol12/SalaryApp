import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import useYearlyStats from "../hooks/useYearlyStats.js";
import { generateMonthlyReport, shareText } from "../utils/exportUtils.js";
import { darkTheme as T } from "../constants/theme.js";

export default function YearlyStats({ shifts, config, calculateEarned }) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { monthlySummaries, yearlyTotals, bestMonth } = useYearlyStats(
    shifts,
    config,
    selectedYear,
    calculateEarned,
  );

  const maxNet = Math.max(...monthlySummaries.map((s) => s.net), 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <BlurView
        intensity={T.glassIntensity}
        tint="light"
        style={styles.yearSelectorGlass}
      >
        <View style={styles.yearSelector}>
          <TouchableOpacity
            onPress={() => setSelectedYear((y) => y + 1)}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-forward" size={22} color={T.accent} />
          </TouchableOpacity>
          <Text style={styles.yearLabel}>{selectedYear}</Text>
          <TouchableOpacity
            onPress={() => setSelectedYear((y) => y - 1)}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={22} color={T.accent} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <BlurView
        intensity={T.glassIntensity}
        tint="light"
        style={styles.totalCardGlass}
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>סיכום שנתי</Text>
          <Text style={styles.totalNet}>
            ₪{yearlyTotals.net.toLocaleString()}
          </Text>
          <Text style={styles.totalSubLabel}>נטו כולל</Text>

          <View style={styles.totalGrid}>
            <StatBox
              label="ברוטו"
              value={`₪${yearlyTotals.gross.toLocaleString()}`}
              icon="cash-outline"
            />
            <StatBox
              label="שעות"
              value={yearlyTotals.hours.toFixed(0)}
              icon="time-outline"
            />
            <StatBox
              label="משמרות"
              value={yearlyTotals.count.toString()}
              icon="calendar-outline"
            />
            <StatBox
              label="ממוצע חודשי"
              value={`₪${yearlyTotals.count > 0 ? Math.round(yearlyTotals.net / (monthlySummaries.filter((s) => s.shiftCount > 0).length || 1)).toLocaleString() : 0}`}
              icon="trending-up-outline"
            />
          </View>

          {bestMonth && bestMonth.net > 0 && (
            <View style={styles.bestRow}>
              <Ionicons name="trophy" size={16} color={T.yellow} />
              <Text style={styles.bestText}>
                החודש הכי טוב: {bestMonth.label} (₪
                {bestMonth.net.toLocaleString()})
              </Text>
            </View>
          )}
        </View>
      </BlurView>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="bar-chart-outline"
            size={16}
            color={T.textSecondary}
          />
          <Text style={styles.sectionTitle}>נטו לפי חודש</Text>
        </View>

        {monthlySummaries
          .slice()
          .reverse()
          .map((item) => {
            const barWidth =
              item.net > 0 ? Math.max((item.net / maxNet) * 100, 3) : 0;
            const isCurrentMonth =
              item.month === now.getMonth() && item.year === now.getFullYear();
            const hasData = item.shiftCount > 0;

            return (
              <View key={`${item.year}-${item.month}`} style={styles.barRow}>
                <Text
                  style={[
                    styles.barAmount,
                    !hasData && { color: T.textPlaceholder },
                  ]}
                >
                  {hasData ? `₪${item.net.toLocaleString()}` : "-"}
                </Text>
                <View style={styles.barTrack}>
                  {barWidth > 0 && (
                    <View
                      style={[
                        styles.barFill,
                        { width: `${barWidth}%` },
                        isCurrentMonth && { backgroundColor: T.accent },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    isCurrentMonth && { color: T.accent, fontWeight: "700" },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>פירוט חודשי</Text>
        </View>

        {monthlySummaries
          .slice()
          .reverse()
          .map((item) => {
            if (item.shiftCount === 0) return null;
            return (
              <View key={`${item.year}-${item.month}`} style={styles.monthCard}>
                <View style={styles.monthHeader}>
                  <View style={styles.monthTitleRow}>
                    <Text style={styles.monthName}>
                      {item.label} {item.year}
                    </Text>
                    <TouchableOpacity
                      onPress={() => shareText(generateMonthlyReport(item))}
                      style={styles.shareBtn}
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={18}
                        color={T.accent}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.monthNet}>
                    ₪{item.net.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.monthDetails}>
                  <MiniStat
                    label="ברוטו"
                    value={`₪${item.gross.toLocaleString()}`}
                  />
                  <MiniStat label="שעות" value={item.hours.toFixed(1)} />
                  <MiniStat label="משמרות" value={item.shiftCount.toString()} />
                  <MiniStat
                    label="מס"
                    value={`₪${item.tax.toLocaleString()}`}
                    color={T.red}
                  />
                </View>
              </View>
            );
          })}

        {monthlySummaries.every((s) => s.shiftCount === 0) && (
          <View style={styles.emptyYear}>
            <Ionicons
              name="file-tray-outline"
              size={40}
              color={T.textPlaceholder}
            />
            <Text style={styles.emptyText}>אין נתונים לשנת {selectedYear}</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const StatBox = ({ label, value, icon }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={16} color={T.accent} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MiniStat = ({ label, value, color }) => (
  <View style={styles.miniStat}>
    <Text style={[styles.miniValue, color && { color }]}>{value}</Text>
    <Text style={styles.miniLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    padding: 16,
  },
  yearSelectorGlass: {
    borderRadius: T.radiusMd,
    overflow: "hidden",
    marginBottom: 12,
  },
  yearSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    gap: 24,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  yearLabel: {
    color: T.text,
    fontSize: 20,
    fontWeight: "700",
  },
  totalCardGlass: {
    borderRadius: T.radiusLg,
    overflow: "hidden",
    marginBottom: 16,
    ...T.shadows.lg,
  },
  totalCard: {
    backgroundColor: "rgba(255,255,255,0.5)",
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  totalTitle: {
    color: T.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  totalNet: {
    color: T.accent,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  totalSubLabel: {
    color: T.textMuted,
    fontSize: 11,
    marginBottom: 14,
  },
  totalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: T.divider,
    paddingTop: 12,
  },
  statBox: {
    width: "50%",
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  statValue: {
    color: T.text,
    fontSize: 14,
    fontWeight: "700",
  },
  statLabel: {
    color: T.textSecondary,
    fontSize: 10,
  },
  bestRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.divider,
  },
  bestText: {
    color: T.yellow,
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusLg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  barLabel: {
    color: T.textSecondary,
    fontSize: 12,
    width: 55,
    textAlign: "right",
    fontWeight: "500",
  },
  barTrack: {
    flex: 1,
    height: 16,
    backgroundColor: T.cardBgElevated,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: T.accent,
    borderRadius: 4,
  },
  barAmount: {
    color: T.textSecondary,
    fontSize: 11,
    width: 70,
    textAlign: "left",
    fontWeight: "500",
  },
  monthCard: {
    backgroundColor: T.cardBgElevated,
    borderRadius: T.radiusMd,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  monthHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  monthTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  shareBtn: {
    padding: 10,
  },
  monthName: {
    color: T.text,
    fontSize: 14,
    fontWeight: "600",
  },
  monthNet: {
    color: T.accent,
    fontSize: 16,
    fontWeight: "700",
  },
  monthDetails: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
  },
  miniStat: {
    alignItems: "center",
    gap: 2,
  },
  miniValue: {
    color: T.text,
    fontSize: 12,
    fontWeight: "600",
  },
  miniLabel: {
    color: T.textMuted,
    fontSize: 10,
  },
  emptyYear: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    color: T.textMuted,
    fontSize: 13,
  },
});
