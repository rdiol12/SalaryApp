import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateNetSalary } from '../utils/calculations';
import { getFilteredShiftsForMonth, HEBREW_MONTHS } from '../utils/shiftFilters';
import { darkTheme as T } from '../constants/theme';

export default function YearlyStats({ shifts, config, calculateEarned }) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Build 12-month summary for selected year
  const monthlySummaries = [];
  let yearlyTotalNet = 0;
  let yearlyTotalGross = 0;
  let yearlyTotalHours = 0;
  let yearlyTotalShifts = 0;
  let bestMonth = null;

  for (let m = 0; m < 12; m++) {
    const monthShifts = getFilteredShiftsForMonth(shifts, config, m, selectedYear, calculateEarned);
    if (monthShifts.length > 0) {
      const stats = calculateNetSalary(monthShifts, config);
      const summary = {
        month: m,
        year: selectedYear,
        label: HEBREW_MONTHS[m],
        net: stats.net,
        gross: stats.gross,
        hours: parseFloat(stats.totalHours),
        shiftCount: stats.shiftCount,
        tax: stats.tax,
        social: stats.social,
        pension: stats.pensionEmployee,
      };
      monthlySummaries.push(summary);
      yearlyTotalNet += stats.net;
      yearlyTotalGross += stats.gross;
      yearlyTotalHours += parseFloat(stats.totalHours);
      yearlyTotalShifts += stats.shiftCount;

      if (!bestMonth || stats.net > bestMonth.net) {
        bestMonth = summary;
      }
    } else {
      monthlySummaries.push({
        month: m,
        year: selectedYear,
        label: HEBREW_MONTHS[m],
        net: 0, gross: 0, hours: 0, shiftCount: 0,
        tax: 0, social: 0, pension: 0,
      });
    }
  }

  // Find max net for bar chart scaling
  const maxNet = Math.max(...monthlySummaries.map(s => s.net), 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Year selector */}
      <View style={styles.yearSelector}>
        <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)} activeOpacity={0.6}>
          <Ionicons name="chevron-forward" size={22} color={T.accent} />
        </TouchableOpacity>
        <Text style={styles.yearLabel}>{selectedYear}</Text>
        <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={22} color={T.accent} />
        </TouchableOpacity>
      </View>

      {/* Yearly total card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalTitle}>סיכום שנתי</Text>
        <Text style={styles.totalNet}>₪{yearlyTotalNet.toLocaleString()}</Text>
        <Text style={styles.totalSubLabel}>נטו כולל</Text>

        <View style={styles.totalGrid}>
          <StatBox label="ברוטו" value={`₪${yearlyTotalGross.toLocaleString()}`} icon="cash-outline" />
          <StatBox label="שעות" value={yearlyTotalHours.toFixed(0)} icon="time-outline" />
          <StatBox label="משמרות" value={yearlyTotalShifts.toString()} icon="calendar-outline" />
          <StatBox label="ממוצע חודשי" value={`₪${yearlyTotalShifts > 0 ? Math.round(yearlyTotalNet / monthlySummaries.filter(s => s.shiftCount > 0).length).toLocaleString() : 0}`} icon="trending-up-outline" />
        </View>

        {bestMonth && bestMonth.net > 0 && (
          <View style={styles.bestRow}>
            <Ionicons name="trophy" size={16} color={T.yellow} />
            <Text style={styles.bestText}>
              החודש הכי טוב: {bestMonth.label} (₪{bestMonth.net.toLocaleString()})
            </Text>
          </View>
        )}
      </View>

      {/* Monthly bar chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>נטו לפי חודש</Text>
        </View>

        {monthlySummaries.slice().reverse().map((item) => {
          const barWidth = item.net > 0 ? Math.max((item.net / maxNet) * 100, 3) : 0;
          const isCurrentMonth = item.month === now.getMonth() && item.year === now.getFullYear();
          const hasData = item.shiftCount > 0;

          return (
            <View key={item.month} style={styles.barRow}>
              <Text style={[styles.barAmount, !hasData && { color: T.textPlaceholder }]}>
                {hasData ? `₪${item.net.toLocaleString()}` : '-'}
              </Text>
              <View style={styles.barTrack}>
                {barWidth > 0 && (
                  <View style={[
                    styles.barFill,
                    { width: `${barWidth}%` },
                    isCurrentMonth && { backgroundColor: T.accent },
                  ]} />
                )}
              </View>
              <Text style={[
                styles.barLabel,
                isCurrentMonth && { color: T.accent, fontWeight: 'bold' },
              ]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Monthly details list */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>פירוט חודשי</Text>
        </View>

        {monthlySummaries.slice().reverse().map((item) => {
          if (item.shiftCount === 0) return null;
          return (
            <View key={item.month} style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthNet}>₪{item.net.toLocaleString()}</Text>
                <Text style={styles.monthName}>{item.label} {item.year}</Text>
              </View>
              <View style={styles.monthDetails}>
                <MiniStat label="ברוטו" value={`₪${item.gross.toLocaleString()}`} />
                <MiniStat label="שעות" value={item.hours.toFixed(1)} />
                <MiniStat label="משמרות" value={item.shiftCount.toString()} />
                <MiniStat label="מס" value={`₪${item.tax.toLocaleString()}`} color={T.red} />
              </View>
            </View>
          );
        })}

        {monthlySummaries.every(s => s.shiftCount === 0) && (
          <View style={styles.emptyYear}>
            <Ionicons name="file-tray-outline" size={40} color={T.textPlaceholder} />
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
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  yearLabel: {
    color: T.text,
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Total card
  totalCard: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusXl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  totalTitle: {
    color: T.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  totalNet: {
    color: T.green,
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  totalSubLabel: {
    color: T.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  totalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 16,
  },
  statBox: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  statValue: {
    color: T.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: T.textSecondary,
    fontSize: 11,
  },
  bestRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  bestText: {
    color: T.yellow,
    fontSize: 13,
    fontWeight: '600',
  },

  // Sections
  section: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusXl,
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sectionTitle: {
    color: T.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Bar chart
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  barLabel: {
    color: T.textSecondary,
    fontSize: 12,
    width: 55,
    textAlign: 'right',
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: T.cardBgElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: T.green,
    borderRadius: 4,
  },
  barAmount: {
    color: T.textSecondary,
    fontSize: 11,
    width: 65,
    textAlign: 'left',
    fontWeight: '500',
  },

  // Monthly details
  monthCard: {
    backgroundColor: T.cardBgElevated,
    borderRadius: T.radiusMd,
    padding: 14,
    marginBottom: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthName: {
    color: T.text,
    fontSize: 15,
    fontWeight: '600',
  },
  monthNet: {
    color: T.green,
    fontSize: 17,
    fontWeight: 'bold',
  },
  monthDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniStat: {
    alignItems: 'center',
    gap: 2,
  },
  miniValue: {
    color: T.text,
    fontSize: 13,
    fontWeight: '600',
  },
  miniLabel: {
    color: T.textMuted,
    fontSize: 10,
  },

  // Empty
  emptyYear: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    color: T.textMuted,
    fontSize: 14,
  },
});
