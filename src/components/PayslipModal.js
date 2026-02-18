import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Animated,
  PanResponder,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { calculateNetSalary } from "../utils/calculations";
import { computeTieredBreakdown } from "../utils/overtimeUtils";
import { darkTheme as T } from "../constants/theme";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

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

  // Overtime tier breakdown — aggregate per multiplier across all work shifts
  const overtimeTierBreakdown = (() => {
    const tierMap = {};
    const workShifts = shifts.filter(
      (s) => s.type === "עבודה" || s.type === "שבת"
    );
    workShifts.forEach((shift) => {
      const hours = Number(shift.totalHours || 0);
      const percent = Number(shift.hourlyPercent || 100) / 100;
      const breakdown = computeTieredBreakdown(hours, hourlyRate, percent, config);
      breakdown.forEach((tier) => {
        const key = String(tier.multiplier);
        if (!tierMap[key]) {
          tierMap[key] = { hours: 0, amount: 0, multiplier: tier.multiplier };
        }
        tierMap[key].hours += tier.hours;
        tierMap[key].amount += tier.amount;
      });
    });
    return Object.values(tierMap).sort((a, b) => a.multiplier - b.multiplier);
  })();

  // Travel days
  const travelDays =
    travelDaily > 0 ? Math.round(stats.travel / travelDaily) : 0;

  // Shift counts and pay by type
  const vacationShifts = shifts.filter((s) => s.type === "חופש");
  const vacationDays = vacationShifts.length;
  const vacationPay = Math.round(vacationShifts.reduce((sum, s) => sum + Number(s.earned || 0), 0));
  const sickShifts = shifts.filter((s) => s.type === "מחלה");
  const sickDays = sickShifts.length;

  // Total deductions
  const totalDeductions = stats.tax + stats.social + stats.pensionEmployee;

  // Display gross (including bonus)
  const displayGross = stats.gross + monthlyBonus;

  const buildPayslipHtml = () => {
    const baseRowsHtml = overtimeTierBreakdown.length > 0
      ? overtimeTierBreakdown.map(tier => `
          <tr>
            <td>${fmt(tier.amount)}</td>
            <td>₪${fmt(hourlyRate * tier.multiplier)}</td>
            <td>${tier.hours.toFixed(2)} שע׳</td>
            <td>${tier.multiplier === 1 ? "שכר יסוד" : `שעות נוספות ${Math.round(tier.multiplier * 100)}%`}</td>
          </tr>`).join('')
      : `<tr>
          <td>${fmt(workGross)}</td>
          <td>₪${fmt(hourlyRate)}</td>
          <td>${stats.totalHours} שע׳</td>
          <td>שכר יסוד</td>
        </tr>`;

    const travelRowHtml =
      stats.travel > 0
        ? `<tr>
            <td>${fmt(stats.travel)}</td>
            <td>${travelDaily > 0 ? fmt(travelDaily) : "—"}</td>
            <td>${travelDays > 0 ? travelDays + " ימים" : "—"}</td>
            <td>נסיעות</td>
          </tr>`
        : "";
    const vacationRowHtml =
      vacationDays > 0
        ? `<tr>
            <td>${fmt(vacationPay)}</td>
            <td>₪${fmt(hourlyRate * 8)}</td>
            <td>${vacationDays} ימים</td>
            <td>ימי חופשה</td>
          </tr>`
        : "";
    const sickRowHtml =
      sickDays > 0
        ? `<tr>
            <td>${fmt(stats.sicknessPay)}</td>
            <td>—</td>
            <td>${sickDays} ימים</td>
            <td>ימי מחלה</td>
          </tr>`
        : "";
    const bonusRowHtml =
      monthlyBonus > 0
        ? `<tr>
            <td>${fmt(monthlyBonus)}</td>
            <td>—</td>
            <td>—</td>
            <td>בונוס</td>
          </tr>`
        : "";

    return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; direction: rtl; padding: 24px; color: #222; font-size: 14px; }
    h2 { text-align: center; color: #3E8ED0; border-bottom: 2px solid #3E8ED0; padding-bottom: 10px; margin-bottom: 16px; }
    .meta { display: flex; justify-content: space-between; margin: 12px 0; font-size: 13px; background: #F0F5FB; padding: 10px 14px; border-radius: 8px; }
    .section-title { color: #3E8ED0; font-weight: bold; font-size: 13px; margin: 14px 0 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #EEF4FB; color: #3E8ED0; padding: 8px; border: 1px solid #ccc; font-size: 12px; text-align: center; }
    td { padding: 8px; border: 1px solid #ddd; font-size: 13px; text-align: center; }
    td:last-child { text-align: right; }
    .total-row { background: #F0F5FB; font-weight: bold; }
    .deduction { color: #D9534F; }
    .net-box { background: #D9ECFB; border: 2px solid #3E8ED0; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .net-label { font-size: 14px; color: #2D6FA3; font-weight: bold; }
    .net-amount { font-size: 36px; font-weight: 900; color: #3E8ED0; margin: 6px 0; }
    .net-sub { font-size: 12px; color: #6B7280; }
    .employer-section { background: #F9FAFB; border: 1px solid #E1E7EF; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .employer-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #6B7280; border-bottom: 1px solid #E1E7EF; }
    .disclaimer { text-align: center; color: #9AA4B2; font-size: 11px; margin-top: 16px; }
  </style>
</head>
<body>
  <h2>תלוש משכורת לחודש ${month}/${year}</h2>
  <div class="meta">
    <span>שם: <strong>${config.userName || "—"}</strong></span>
    <span>תקופה: ${config.salaryStartDay || 1} – ${config.salaryEndDay || 24}</span>
    <span>שכר שעתי: ₪${fmt(hourlyRate)}</span>
  </div>

  <div class="section-title">הכנסות (זכות)</div>
  <table>
    <tr>
      <th>סכום ₪</th><th>תעריף</th><th>כמות</th><th>תיאור</th>
    </tr>
    ${baseRowsHtml}
    ${travelRowHtml}
    ${vacationRowHtml}
    ${sickRowHtml}
    ${bonusRowHtml}
    <tr class="total-row">
      <td colspan="3">סה״כ ברוטו</td>
      <td style="color:#3E8ED0">₪${fmt(displayGross)}</td>
    </tr>
  </table>

  <div class="section-title">ניכויים (חובה)</div>
  <table>
    <tr>
      <th>סכום ₪</th><th>תיאור</th>
    </tr>
    <tr>
      <td class="deduction">−₪${fmt(stats.tax)}</td>
      <td>מס הכנסה</td>
    </tr>
    <tr>
      <td class="deduction">−₪${fmt(stats.social)}</td>
      <td>ביטוח לאומי ודמי בריאות</td>
    </tr>
    <tr>
      <td class="deduction">−₪${fmt(stats.pensionEmployee)}</td>
      <td>פנסיה עובד (${pensionPct}%)</td>
    </tr>
    <tr class="total-row">
      <td style="color:#D9534F">−₪${fmt(totalDeductions)}</td>
      <td>סה״כ ניכויים</td>
    </tr>
  </table>

  <div class="section-title">הפרשות מעסיק (למידע)</div>
  <div class="employer-section">
    <div class="employer-row">
      <span>₪${fmt(stats.pensionEmployer)}</span>
      <span>תגמולי מעסיק (6.5%)</span>
    </div>
    <div class="employer-row" style="border-bottom:none">
      <span>₪${fmt(stats.severanceEmployer)}</span>
      <span>פיצויים (6%)</span>
    </div>
  </div>

  <div class="net-box">
    <div class="net-label">נטו לתשלום</div>
    <div class="net-amount">₪${fmt(stats.net)}</div>
    <div class="net-sub">ברוטו ₪${fmt(displayGross)} − ניכויים ₪${fmt(totalDeductions)}</div>
  </div>

  <div class="disclaimer">סימולציה בלבד — אינו תלוש שכר רשמי</div>
</body>
</html>`;
  };

  const [webViewVisible, setWebViewVisible] = useState(false);

  // --- Drag-to-close gesture ---
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollAtTop = useRef(true);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy, dx }) =>
        scrollAtTop.current && dy > 8 && Math.abs(dy) > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 120 || vy > 1.2) {
          Animated.timing(translateY, {
            toValue: 900,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 300,
          }).start();
        }
      },
    })
  ).current;

  // Single tap → show HTML payslip in-app WebView
  const handleOpenPdf = () => {
    setWebViewVisible(true);
  };

  // Long press → generate PDF and share
  const handleSharePdf = async () => {
    try {
      const html = buildPayslipHtml();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "שתף תלוש שכר",
      });
    } catch (e) {
      Alert.alert("שגיאה", "לא ניתן לשתף את ה-PDF");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === "ios" ? "none" : "slide"}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "overFullScreen"}
    >
      <Animated.View
        style={[styles.animatedWrapper, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
      <SafeAreaView style={styles.wrapper}>
        {/* Drag handle */}
        <View style={styles.dragHandle}>
          <View style={styles.dragIndicator} />
        </View>

        {/* App header — close on LEFT, share on RIGHT (standard iOS) */}
        <View style={styles.appHeader}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>תלוש שכר</Text>
            <Ionicons name="document-text-outline" size={18} color="#fff" />
          </View>
          <TouchableOpacity onPress={handleSharePdf} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollAtTop.current = e.nativeEvent.contentOffset.y <= 0;
          }}
        >
          {/* Paper document — tap to view in-app, long press to share */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleOpenPdf}
            onLongPress={handleSharePdf}
            delayLongPress={600}
          >
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
              {overtimeTierBreakdown.length > 0 ? (
                overtimeTierBreakdown.map((tier, i) => (
                  <TableRow
                    key={i}
                    label={
                      tier.multiplier === 1
                        ? "שכר יסוד"
                        : `שעות נוספות ${Math.round(tier.multiplier * 100)}%`
                    }
                    qty={`${tier.hours.toFixed(2)} שע׳`}
                    rate={`₪${fmt(hourlyRate * tier.multiplier)}`}
                    amount={tier.amount}
                  />
                ))
              ) : (
                <TableRow
                  label="שכר יסוד"
                  qty={`${stats.totalHours} שע׳`}
                  rate={`₪${fmt(hourlyRate)}`}
                  amount={workGross}
                />
              )}
              {stats.travel > 0 && (
                <TableRow
                  label="נסיעות"
                  qty={travelDays > 0 ? `${travelDays} ימים` : "—"}
                  rate={travelDaily > 0 ? `₪${fmt(travelDaily)}` : "—"}
                  amount={stats.travel}
                />
              )}
              {vacationDays > 0 && (
                <TableRow
                  label="ימי חופשה"
                  qty={`${vacationDays} ימים`}
                  rate={`₪${fmt(hourlyRate * 8)}`}
                  amount={vacationPay}
                />
              )}
              {sickDays > 0 && (
                <TableRow
                  label="ימי מחלה"
                  qty={`${sickDays} ימים`}
                  rate={stats.sicknessPay > 0 ? `₪${fmt(Math.round(stats.sicknessPay / sickDays))}` : "—"}
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
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            סימולציה בלבד — אינו תלוש שכר רשמי
          </Text>
        </ScrollView>
      </SafeAreaView>

      </Animated.View>

      {/* In-app HTML payslip viewer */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        onRequestClose={() => setWebViewVisible(false)}
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "overFullScreen"}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity onPress={() => setWebViewVisible(false)} activeOpacity={0.7}>
              <Text style={styles.webViewClose}>סגור</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>תלוש שכר</Text>
            <TouchableOpacity onPress={handleSharePdf} activeOpacity={0.7}>
              <Text style={styles.webViewShare}>שתף</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ html: buildPayslipHtml() }}
            style={{ flex: 1 }}
            originWhitelist={["*"]}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>

    </Modal>
  );
}

// --- Sub-components ---

const MetaRow = ({ label, value }) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaLabel}>{label}:</Text>
    <Text style={styles.metaValue}>{value}</Text>
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
    <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellDesc]}>תיאור</Text>
    <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellQty]}>כמות</Text>
    <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellRate]}>תעריף</Text>
    <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellAmount]}>סכום</Text>
  </View>
);

const TableRow = ({ label, qty, rate, amount }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.tableCell, styles.cellDesc]}>{label}</Text>
    <Text style={[styles.tableCell, styles.cellQty, styles.qtyText]}>{qty}</Text>
    <Text style={[styles.tableCell, styles.cellRate, styles.rateText]}>{rate}</Text>
    <Text style={[styles.tableCell, styles.cellAmount, styles.amountText]}>
      ₪{fmt(amount)}
    </Text>
  </View>
);

const DeductionRow = ({ label, amount }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.tableCell, styles.cellDescFull]}>{label}</Text>
    <Text style={[styles.tableCell, styles.cellAmountFull, styles.deductionAmount]}>
      −₪{fmt(amount)}
    </Text>
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
  animatedWrapper: { flex: 1 },
  wrapper: { flex: 1, backgroundColor: "#EAEEF3" },
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: T.accent,
  },
  headerCenter: {
    flexDirection: "row",
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

  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E9F0",
    backgroundColor: "#fff",
  },
  webViewTitle: {
    color: "#1A2332",
    fontSize: 16,
    fontWeight: "700",
  },
  webViewClose: {
    color: T.accent,
    fontSize: 15,
  },
  webViewShare: {
    color: T.accent,
    fontSize: 15,
    fontWeight: "600",
  },
  disclaimer: {
    textAlign: "center",
    color: T.textMuted,
    fontSize: 11,
    marginTop: 14,
  },

  // Drag-to-close handle
  dragHandle: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: T.accent,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
