import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { calculateNetSalary } from '../utils/calculations';
import GoalProgressBar from './GoalProgressBar';
import { parseDateLocal } from '../utils/shiftFilters';
import { darkTheme as T } from '../constants/theme';

export default function AdvancedStats({ monthlyShifts, config, displayDate }) {
  const stats = calculateNetSalary(monthlyShifts, config);
  const goal = Number(config.monthlyGoal || 0);
  const remaining = Math.max(goal - stats.net, 0);
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const month = displayDate ? displayDate.getMonth() : new Date().getMonth();
  const year = displayDate ? displayDate.getFullYear() : new Date().getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const today = new Date();
  const monthStart = new Date(year, month, 1);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const isCurrentMonth = monthStart.getTime() === currentMonthStart.getTime();
  const isPastMonth = monthStart.getTime() < currentMonthStart.getTime();
  const daysLeft = isPastMonth ? 0 : (isCurrentMonth ? (daysInMonth - today.getDate() + 1) : daysInMonth);
  const dailyTarget = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0;
  const chartWidth = Math.max(Dimensions.get('window').width - 32, 280);

  const hexToRgba = (hex, opacity = 1) => {
    if (!hex || hex[0] !== '#') return hex;
    const value = hex.replace('#', '');
    const bigint = parseInt(value.length === 3
      ? value.split('').map(c => c + c).join('')
      : value, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getOvertimeTiers = () => {
    const tiers = Array.isArray(config.overtimeTiers) ? config.overtimeTiers : [];
    if (tiers.length > 0) return tiers;
    const threshold = Number(config.overtimeStartThreshold || 0);
    const mult = Number(config.overtimeMultiplier || 1.25);
    if (!threshold) return [{ from: 0, to: null, multiplier: 1 }];
    return [
      { from: 0, to: threshold, multiplier: 1 },
      { from: threshold, to: null, multiplier: mult },
    ];
  };

  const computeOvertimeHours = (shift) => {
    if (shift.type !== 'עבודה') return 0;
    let hours = Number(shift.totalHours || 0);
    if (config.isBreakDeducted && hours > 6) {
      hours -= Number(config.breakDeduction || 0) / 60;
    }
    const tiers = getOvertimeTiers()
      .map(t => ({
        from: Number(t.from || 0),
        to: t.to === null || t.to === '' ? null : Number(t.to),
        multiplier: Number(t.multiplier || 1),
      }))
      .filter(t => Number.isFinite(t.from) && Number.isFinite(t.multiplier))
      .sort((a, b) => a.from - b.from);

    let overtime = 0;
    tiers.forEach((tier) => {
      if (tier.multiplier <= 1) return;
      const end = tier.to === null ? Infinity : tier.to;
      const tierHours = Math.max(0, Math.min(hours, end) - tier.from);
      if (tierHours > 0) overtime += tierHours;
    });
    return overtime;
  };

  const sortedAsc = [...monthlyShifts].sort((a, b) => parseDateLocal(a.date) - parseDateLocal(b.date));
  const weeklyMap = new Map();
  const typeCounts = { עבודה: 0, שבת: 0, מחלה: 0, חופש: 0 };

  sortedAsc.forEach((shift) => {
    const d = parseDateLocal(shift.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = `${String(weekStart.getMonth() + 1).padStart(2, '0')}/${String(weekStart.getDate()).padStart(2, '0')}`;
    const entry = weeklyMap.get(key) || { earned: 0, overtime: 0 };
    entry.earned += Number(shift.earned || 0);
    entry.overtime += computeOvertimeHours(shift);
    weeklyMap.set(key, entry);
    if (typeCounts[shift.type] !== undefined) typeCounts[shift.type] += 1;
  });

  const weeklyLabels = Array.from(weeklyMap.keys());
  const weeklyEarned = weeklyLabels.map(k => Math.round(weeklyMap.get(k).earned));
  const weeklyOvertime = weeklyLabels.map(k => Number(weeklyMap.get(k).overtime.toFixed(1)));

  const normalizeSeries = (labels, data) => {
    if (labels.length === 0) return { labels: [''], data: [0] };
    if (labels.length === 1) return { labels: [labels[0], ''], data: [data[0], data[0]] };
    return { labels, data };
  };

  const lineSeries = normalizeSeries(weeklyLabels, weeklyEarned);
  const barSeries = normalizeSeries(weeklyLabels, weeklyOvertime);

  const pieData = [
    { name: 'עבודה', count: typeCounts.עבודה, color: T.accent },
    { name: 'שבת', count: typeCounts.שבת, color: T.orange },
    { name: 'מחלה', count: typeCounts.מחלה, color: T.red },
    { name: 'חופש', count: typeCounts.חופש, color: T.green },
  ].filter(p => p.count > 0).map(p => ({
    name: p.name,
    count: p.count,
    color: p.color,
    legendFontColor: T.textSecondary,
    legendFontSize: 11,
  }));

  const chartConfig = {
    backgroundGradientFrom: T.cardBg,
    backgroundGradientTo: T.cardBg,
    color: (opacity = 1) => hexToRgba(T.accent, opacity),
    labelColor: (opacity = 1) => hexToRgba(T.textSecondary, opacity),
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: T.accent,
    },
  };

  if (monthlyShifts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={48} color={T.textPlaceholder} />
        <Text style={styles.emptyTitle}>אין נתונים למחזור זה</Text>
        <Text style={styles.emptySubtext}>הוסף משמרות כדי לראות סטטיסטיקות</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>סיכום שכר חודשי</Text>

      <View style={styles.netCard}>
        <Text style={styles.netLabel}>נטו משוער לבנק</Text>
        <Text style={styles.netValue}>₪{stats.net.toLocaleString()}</Text>

        <View style={styles.quickStats}>
          <View style={styles.quickItem}>
            <Text style={styles.quickVal}>{stats.totalHours}</Text>
            <Text style={styles.quickLab}>שעות</Text>
          </View>
          <View style={styles.quickDivider} />
          <View style={styles.quickItem}>
            <Text style={styles.quickVal}>{stats.shiftCount}</Text>
            <Text style={styles.quickLab}>משמרות</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flag-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>יעד חודשי</Text>
        </View>
        <GoalProgressBar current={stats.net} goal={config.monthlyGoal} />
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>נותרו</Text>
          <Text style={styles.goalValue}>
            ₪{remaining.toLocaleString()}
          </Text>
        </View>
        <View style={styles.goalRowSecondary}>
          <Text style={styles.goalMeta}>ימים נותרו: {daysLeft}</Text>
          <Text style={styles.goalMeta}>נדרש ליום: ₪{dailyTarget.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pulse-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>גרפים חודשיים</Text>
        </View>

        <Text style={styles.chartTitle}>שכר שבועי</Text>
        <LineChart
          data={{
            labels: lineSeries.labels,
            datasets: [{ data: lineSeries.data }],
          }}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />

        <Text style={styles.chartTitle}>שעות נוספות לפי שבוע</Text>
        <BarChart
          data={{
            labels: barSeries.labels,
            datasets: [{ data: barSeries.data }],
          }}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          fromZero
          style={styles.chart}
        />

        <Text style={styles.chartTitle}>התפלגות סוגי משמרות</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={chartWidth}
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>פירוט תלוש (משוער)</Text>
        </View>

        <DetailRow label="שכר ברוטו" value={`₪${stats.gross}`} />
        <DetailRow label="דמי נסיעות (חודשי)" value={`+ ₪${stats.travel}`} isPositive />
        {stats.sicknessPay > 0 && (
          <DetailRow label="דמי מחלה ששולמו" value={`+ ₪${stats.sicknessPay}`} isPositive />
        )}
        <View style={styles.divider} />
        <DetailRow label="מס הכנסה" value={`- ₪${stats.tax}`} isNegative />
        <DetailRow label="ביטוח לאומי ובריאות" value={`- ₪${stats.social}`} isNegative />
        <DetailRow label="פנסיה (חלק העובד)" value={`- ₪${stats.pensionEmployee}`} isNegative />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={16} color={T.accent} />
          <Text style={[styles.sectionTitle, { color: T.accent }]}>הפרשות מעסיק</Text>
        </View>
        <DetailRow label="תגמולי מעסיק (6.5%)" value={`₪${stats.pensionEmployer}`} color={T.accent} />
        <DetailRow label="פיצויים (6%)" value={`₪${stats.severanceEmployer}`} color={T.accent} />
        <View style={[styles.divider, { backgroundColor: T.accentLight }]} />
        <DetailRow
          label="סה״כ הפרשות סוציאליות"
          value={`₪${stats.pensionEmployer + stats.severanceEmployer}`}
          color={T.accent}
          isBold
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const DetailRow = ({ label, value, isNegative, isPositive, isBold, color }) => (
  <View style={styles.detailRow}>
    <Text style={[
      styles.detailValue,
      isNegative && { color: T.red },
      isPositive && { color: T.green },
      color && { color },
      isBold && { fontWeight: '700', fontSize: 16 },
    ]}>
      {value}
    </Text>
    <Text style={[styles.detailLabel, isBold && { fontWeight: '700', color: T.text }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    padding: 16,
  },
  headerTitle: {
    color: T.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 16,
  },
  netCard: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusLg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  netLabel: {
    color: T.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  netValue: {
    color: T.accent,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: 16,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: T.divider,
    paddingTop: 12,
    alignItems: 'center',
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickDivider: {
    width: 1,
    height: 28,
    backgroundColor: T.divider,
  },
  quickVal: {
    color: T.text,
    fontSize: 18,
    fontWeight: '700',
  },
  quickLab: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  goalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  goalRowSecondary: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  goalText: {
    color: T.textSecondary,
    fontSize: 12,
  },
  goalValue: {
    color: T.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  goalMeta: {
    color: T.textMuted,
    fontSize: 11,
  },
  detailLabel: {
    color: T.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: T.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chartTitle: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 6,
    textAlign: 'right',
  },
  chart: {
    borderRadius: T.radiusMd,
    marginBottom: 12,
  },
  chartEmpty: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: T.divider,
    marginVertical: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: T.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: T.textMuted,
    fontSize: 13,
  },
});
