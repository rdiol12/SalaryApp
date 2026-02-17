import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { calculateNetSalary } from "../utils/calculations";
import { darkTheme as T } from "../constants/theme";

const fmt = (n) => (n && isFinite(n) ? Math.round(n).toLocaleString() : "0");

export default function PayslipModal({
  visible,
  onClose,
  shifts,
  config,
  displayDate,
}) {
  const stats = calculateNetSalary(shifts, config);

  const date = displayDate ? new Date(displayDate) : new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const hourlyRate = Number(config.hourlyRate || 0);
  const travelDaily = Number(config.travelDaily || 0);
  const monthlyBonus = Number(config.monthlyBonus || 0);
  const pensionPct = Math.round((config.pensionRate || 0.06) * 100);

  // Base work salary = gross minus travel minus sick pay
  const workGross = Math.max(
    0,
    stats.gross - stats.travel - stats.sicknessPay
  );

  // Travel days
  const travelDays =
    travelDaily > 0 ? Math.round(stats.travel / travelDaily) : 0;

  // Shift counts by type
  const vacationDays = shifts.filter((s) => s.type === "חופש").length;
  const sickDays = shifts.filter((s) => s.type === "מחלה").length;

  // Total deductions
  const totalDeductions = stats.tax + stats.social + stats.pensionEmployee;

  // Display gross (including bonus)
  const displayGross = stats.gross + monthlyBonus;

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.wrapper}>
        {/* App header */}
        <View style={styles.appHeader}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.headerTitle}>תלוש שכר</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Paper document */}
          <View style={styles.paper}>

            {/* === PAYSLIP HEADER === */}
            <View style={styles.docHeader}>
              <Text style={styles.docTitle}>תלוש משכורת לחודש {month}/{year}</Text>
              <View style={styles.docMeta}>
                <View style={styles.metaCol}>
                  <MetaRow label="שם העובד" value={config.userName || "—"} />
                  <MetaRow
                    label="תקופת שכר"
                    value={`${config.salaryStartDay || 1} – ${config.salaryEndDay || 24}`}
                  />
                </View>
                <View style={styles.metaCol}>
                  <MetaRow label="שכר שעתי" value={`₪${fmt(hourlyRate)}`} />
                  {travelDaily > 0 && (
                    <MetaRow label="נסיעות יומי" value={`₪${fmt(travelDaily)}`} />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.dividerBold} />

            {/* === WORK SUMMARY === */}
            <View style={styles.summaryRow}>
              <SummaryBadge icon="briefcase-outline" label="משמרות" value={stats.shiftCount} color={T.accent} />
              <SummaryBadge icon="time-outline" label="שעות" value={stats.totalHours} color={T.green} />
              {vacationDays > 0 && (
                <SummaryBadge icon="sunny-outline" label="חופשה" value={vacationDays} color={T.orange} />
              )}
              {sickDays > 0 && (
                <SummaryBadge icon="medical-outline" label="מחלה" value={sickDays} color={T.red} />
              )}
            </View>

            <View style={styles.divider} />

            {/* === EARNINGS TABLE === */}
            <SectionTitle>הכנסות (זכות)</SectionTitle>
            <View style={styles.table}>
              <TableHeader />
              <TableRow
                label="שכר יסוד"
                qty={`${stats.totalHours} שע׳`}
                rate={`₪${fmt(hourlyRate)}`}
                amount={workGross}
              />
              {stats.travel > 0 && (
                <TableRow
                  label="נסיעות"
                  qty={travelDays > 0 ? `${travelDays} ימים` : "—"}
                  rate={travelDaily > 0 ? `₪${fmt(travelDaily)}` : "—"}
                  amount={stats.travel}
                />
              )}
              {stats.sicknessPay > 0 && (
                <TableRow
                  label="דמי מחלה"
                  qty={`${sickDays} ימים`}
                  rate="—"
                  amount={stats.sicknessPay}
                />
              )}
              {monthlyBonus > 0 && (
                <TableRow
                  label="בונוס"
                  qty="—"
                  rate="—"
                  amount={monthlyBonus}
                />
              )}
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>סה״כ ברוטו</Text>
              <Text style={styles.totalValue}>₪{fmt(displayGross)}</Text>
            </View>

            <View style={styles.divider} />

            {/* === DEDUCTIONS TABLE === */}
            <SectionTitle>ניכויים (חובה)</SectionTitle>
            <View style={styles.table}>
              <DeductionRow label="מס הכנסה" amount={stats.tax} />
              <DeductionRow label="ביטוח לאומי ודמי בריאות" amount={stats.social} />
              <DeductionRow
                label={`פנסיה עובד (${pensionPct}%)`}
                amount={stats.pensionEmployee}
              />
            </View>
            <View style={[styles.totalRow, { backgroundColor: "#FBE4E3" }]}>
              <Text style={[styles.totalLabel, { color: T.red }]}>סה״כ ניכויים</Text>
              <Text style={[styles.totalValue, { color: T.red }]}>
                −₪{fmt(totalDeductions)}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* === EMPLOYER CONTRIBUTIONS === */}
            <SectionTitle muted>הפרשות מעסיק (למידע)</SectionTitle>
            <View style={styles.employerSection}>
              <EmployerRow label="תגמולי מעסיק (6.5%)" amount={stats.pensionEmployer} />
              <EmployerRow label="פיצויים (6%)" amount={stats.severanceEmployer} />
            </View>
            <Text style={styles.employerNote}>
              * הפרשות מעסיק אינן מנוכות מהנטו
            </Text>

            <View style={styles.dividerBold} />

            {/* === NET PAY === */}
            <View style={styles.netBox}>
              <Text style={styles.netLabel}>נטו לתשלום</Text>
              <Text style={styles.netValue}>₪{fmt(stats.net)}</Text>
              <Text style={styles.netSub}>
                ברוטו ₪{fmt(displayGross)} − ניכויים ₪{fmt(totalDeductions)}
              </Text>
            </View>

          </View>

          <Text style={styles.disclaimer}>
            סימולציה בלבד — אינו תלוש שכר רשמי
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// --- Sub-components ---

const MetaRow = ({ label, value }) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaValue}>{value}</Text>
    <Text style={styles.metaLabel}>{label}:</Text>
  </View>
);

const SummaryBadge = ({ icon, label, value, color }) => (
  <View style={[styles.badge, { borderColor: color + "40", backgroundColor: color + "15" }]}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={[styles.badgeValue, { color }]}>{value}</Text>
    <Text style={styles.badgeLabel}>{label}</Text>
  </View>
);

const SectionTitle = ({ children, muted }) => (
  <Text style={[styles.sectionTitle, muted && { color: T.textMuted }]}>
    {children}
  </Text>
);

const TableHeader = () => (
  <View style={[styles.tableRow, styles.tableHeaderRow]}>
    <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellAmount]}>סכום</Text>
    <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellRate]}>תעריף</Text>
    <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellQty]}>כמות</Text>
    <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellDesc]}>תיאור</Text>
  </View>
);

const TableRow = ({ label, qty, rate, amount }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.tableCell, styles.cellAmount, styles.amountText]}>
      ₪{fmt(amount)}
    </Text>
    <Text style={[styles.tableCell, styles.cellRate, styles.rateText]}>{rate}</Text>
    <Text style={[styles.tableCell, styles.cellQty, styles.qtyText]}>{qty}</Text>
    <Text style={[styles.tableCell, styles.cellDesc]}>{label}</Text>
  </View>
);

const DeductionRow = ({ label, amount }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.tableCell, styles.cellAmountFull, styles.deductionAmount]}>
      −₪{fmt(amount)}
    </Text>
    <Text style={[styles.tableCell, styles.cellDescFull]}>{label}</Text>
  </View>
);

const EmployerRow = ({ label, amount }) => (
  <View style={styles.employerRow}>
    <Text style={styles.employerAmount}>₪{fmt(amount)}</Text>
    <Text style={styles.employerLabel}>{label}</Text>
  </View>
);

// --- Styles ---

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#EAEEF3" },
  appHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: T.accent,
  },
  headerCenter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40 },

  // Paper
  paper: {
    backgroundColor: "#fff",
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: "#D0D8E4",
    overflow: "hidden",
    ...T.shadows.md,
  },

  // Doc header
  docHeader: {
    backgroundColor: "#F0F5FB",
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: T.accent,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: T.accent,
    textAlign: "center",
    marginBottom: 12,
  },
  docMeta: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    gap: 12,
  },
  metaCol: { flex: 1 },
  metaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  metaLabel: { color: T.textSecondary, fontSize: 11 },
  metaValue: { color: T.text, fontSize: 12, fontWeight: "700" },

  // Summary badges
  summaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
  },
  badge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeValue: { fontSize: 13, fontWeight: "700" },
  badgeLabel: { fontSize: 11, color: T.textSecondary },

  // Dividers
  dividerBold: { height: 2, backgroundColor: "#D0D8E4", marginHorizontal: 0 },
  divider: { height: 1, backgroundColor: T.divider, marginVertical: 4 },

  // Section title
  sectionTitle: {
    color: T.accent,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    letterSpacing: 0.3,
  },

  // Table
  table: {
    borderTopWidth: 1,
    borderTopColor: T.divider,
    marginHorizontal: 14,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
    alignItems: "center",
    minHeight: 34,
  },
  tableHeaderRow: { backgroundColor: "#F0F5FB" },
  tableCell: { paddingHorizontal: 6, paddingVertical: 6 },
  tableHeaderText: {
    color: T.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  cellDesc: { flex: 2.5, color: T.text, fontSize: 12, textAlign: "right" },
  cellQty: { flex: 1.5, textAlign: "center", color: T.textSecondary, fontSize: 11 },
  cellRate: { flex: 1.5, textAlign: "center", color: T.textSecondary, fontSize: 11 },
  cellAmount: { flex: 1.5, textAlign: "left" },
  cellDescFull: { flex: 3, color: T.text, fontSize: 12, textAlign: "right" },
  cellAmountFull: { flex: 1.5, textAlign: "left" },
  amountText: { color: T.accent, fontSize: 12, fontWeight: "700", textAlign: "left" },
  rateText: { color: T.textSecondary, fontSize: 11, textAlign: "center" },
  qtyText: { color: T.textSecondary, fontSize: 11, textAlign: "center" },
  deductionAmount: { color: T.red, fontSize: 12, fontWeight: "700" },

  // Total rows
  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F0F5FB",
    marginTop: 2,
    marginBottom: 4,
  },
  totalLabel: { color: T.text, fontSize: 13, fontWeight: "800" },
  totalValue: { color: T.accent, fontSize: 14, fontWeight: "800" },

  // Employer contributions
  employerSection: { paddingHorizontal: 14, paddingTop: 4 },
  employerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  employerLabel: { color: T.textSecondary, fontSize: 12 },
  employerAmount: { color: T.textSecondary, fontSize: 12, fontWeight: "600" },
  employerNote: {
    color: T.textMuted,
    fontSize: 10,
    textAlign: "right",
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 4,
  },

  // Net box
  netBox: {
    backgroundColor: T.accentLight,
    margin: 14,
    borderRadius: T.radiusMd,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.accent,
  },
  netLabel: {
    color: T.accentDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  netValue: {
    color: T.accent,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  netSub: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 6,
  },

  disclaimer: {
    textAlign: "center",
    color: T.textMuted,
    fontSize: 11,
    marginTop: 14,
  },
});
