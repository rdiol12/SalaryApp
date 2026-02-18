import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { darkTheme as T } from "../../constants/theme.js";
import { parseDateLocal } from "../../utils/shiftFilters.js";
import { computeTieredBreakdown } from "../../utils/overtimeUtils.js";

export default function StatCharts({ monthlyShifts, config, chartWidth }) {
  const width =
    chartWidth || Math.max(Dimensions.get("window").width - 32, 280);

  const processData = () => {
    const sortedAsc = [...monthlyShifts].sort(
      (a, b) => parseDateLocal(a.date) - parseDateLocal(b.date),
    );
    const weeklyMap = new Map();
    const typeCounts = { עבודה: 0, שבת: 0, מחלה: 0, חופש: 0 };

    sortedAsc.forEach((shift) => {
      const d = parseDateLocal(shift.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = `${String(weekStart.getMonth() + 1).padStart(2, "0")}/${String(weekStart.getDate()).padStart(2, "0")}`;

      const entry = weeklyMap.get(key) || { earned: 0, overtime: 0 };
      entry.earned += Number(shift.earned || 0);

      // Compute overtime for this shift using shared utility
      if (shift.type === "עבודה") {
        const rate = Number(config?.hourlyRate || 0);
        const percent = Number(shift.hourlyPercent || 100) / 100;
        const hours = Number(shift.totalHours || 0);
        const breakdown = computeTieredBreakdown(hours, rate, percent, config);
        const overtimeHours = breakdown.reduce(
          (sum, b) => (b.multiplier > 1 ? sum + b.hours : sum),
          0,
        );
        entry.overtime += overtimeHours;
      }

      weeklyMap.set(key, entry);
      if (typeCounts[shift.type] !== undefined) typeCounts[shift.type] += 1;
    });

    const weeklyLabels = Array.from(weeklyMap.keys());
    const weeklyEarned = weeklyLabels.map((k) =>
      Math.round(weeklyMap.get(k).earned),
    );
    const weeklyOvertime = weeklyLabels.map((k) =>
      Number(weeklyMap.get(k).overtime.toFixed(1)),
    );

    return { weeklyLabels, weeklyEarned, weeklyOvertime, typeCounts };
  };

  const { weeklyLabels, weeklyEarned, weeklyOvertime, typeCounts } =
    processData();

  const normalizeSeries = (labels, data) => {
    if (labels.length === 0) return { labels: [""], data: [0] };
    if (labels.length === 1)
      return { labels: [labels[0], ""], data: [data[0], data[0]] };
    return { labels, data };
  };

  const lineSeries = normalizeSeries(weeklyLabels, weeklyEarned);
  const barSeries = normalizeSeries(weeklyLabels, weeklyOvertime);

  const pieData = [
    { name: "עבודה", count: typeCounts.עבודה, color: T.accent },
    { name: "שבת", count: typeCounts.שבת, color: T.orange },
    { name: "מחלה", count: typeCounts.מחלה, color: T.red },
    { name: "חופש", count: typeCounts.חופש, color: T.green },
  ]
    .filter((p) => p.count > 0)
    .map((p) => ({
      name: p.name,
      count: p.count,
      color: p.color,
      legendFontColor: T.textSecondary,
      legendFontSize: 11,
    }));

  const hexToRgba = (hex, opacity = 1) => {
    if (!hex || hex[0] !== "#") return hex;
    const value = hex.replace("#", "");
    const bigint = parseInt(
      value.length === 3
        ? value
            .split("")
            .map((c) => c + c)
            .join("")
        : value,
      16,
    );
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const chartConfig = {
    backgroundGradientFrom: T.cardBg,
    backgroundGradientTo: T.cardBg,
    color: (opacity = 1) => hexToRgba(T.accent, opacity),
    labelColor: (opacity = 1) => hexToRgba(T.textSecondary, opacity),
    decimalPlaces: 0,
    formatYLabel: (val) => {
      const n = Math.round(Number(val));
      return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
    },
    propsForDots: {
      r: "3",
      strokeWidth: "1",
      stroke: T.accent,
    },
  };

  return (
    <View style={styles.section}>
      <Text style={styles.chartTitle}>שכר שבועי</Text>
      <View style={styles.chartMirrorWrap}>
        <LineChart
          data={{
            labels: lineSeries.labels,
            datasets: [{ data: lineSeries.data }],
          }}
          width={width}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={[styles.chart, styles.chartMirror]}
        />
      </View>

      <Text style={styles.chartTitle}>שעות נוספות לפי שבוע</Text>
      <View style={styles.chartMirrorWrap}>
        <BarChart
          data={{
            labels: barSeries.labels,
            datasets: [{ data: barSeries.data }],
          }}
          width={width}
          height={200}
          chartConfig={chartConfig}
          fromZero
          style={[styles.chart, styles.chartMirror]}
        />
      </View>

      <Text style={styles.chartTitle}>התפלגות סוגי משמרות</Text>
      {pieData.length > 0 ? (
        <PieChart
          data={pieData}
          width={width}
          height={200}
          chartConfig={chartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="10"
          absolute
          style={styles.chart}
        />
      ) : (
        <Text style={styles.chartEmpty}>אין נתונים להצגה</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusLg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  chartTitle: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 6,
    textAlign: "right",
  },
  chart: {
    borderRadius: T.radiusMd,
    marginBottom: 12,
  },
  // Double-mirror trick: outer scaleX(-1) + inner scaleX(-1) = net normal, fixes RTL text mirroring
  chartMirrorWrap: {
    transform: [{ scaleX: -1 }],
  },
  chartMirror: {
    transform: [{ scaleX: -1 }],
  },
  chartEmpty: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 12,
  },
});
