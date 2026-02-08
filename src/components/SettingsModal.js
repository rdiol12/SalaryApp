import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../constants/theme";
import { calculateNetSalary } from "../utils/calculations";
import {
  getFilteredShiftsForMonth,
  parseDateLocal,
  formatDateLocal,
} from "../utils/shiftFilters";
import {
  validateConfig,
  normalizeConfig,
  defaultTiers,
  emptyTemplate,
} from "../utils/validation";
import TemplateEditorModal from "../modals/TemplateEditorModal";
import SettingsProfile from "./settings/SettingsProfile";
import SettingsSalary from "./settings/SettingsSalary";
import SettingsOvertime from "./settings/SettingsOvertime";
import SettingsTemplates from "./settings/SettingsTemplates";
import DataManagement from "./settings/DataManagement";

export default function SettingsModal({
  visible,
  config,
  onSave,
  onClose,
  shifts,
  displayDate,
  onRestore,
}) {
  const [localConfig, setLocalConfig] = useState(normalizeConfig(config));
  const [templateModal, setTemplateModal] = useState({
    visible: false,
    template: null,
  });

  useEffect(() => {
    if (visible) setLocalConfig(normalizeConfig(config));
  }, [visible, config]);

  const errors = useMemo(() => validateConfig(localConfig), [localConfig]);
  const canSave = Object.keys(errors).length === 0;

  const handleConfigChange = (field, value) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
  };

  const getOvertimeTiers = () => {
    const tiers = Array.isArray(localConfig.overtimeTiers)
      ? localConfig.overtimeTiers
      : [];
    return tiers.length > 0 ? tiers : defaultTiers;
  };

  const computeTieredPay = (hours, rate, percent) => {
    const tiers = getOvertimeTiers()
      .map((t) => ({
        from: Number(t.from || 0),
        to: t.to === null || t.to === "" ? null : Number(t.to),
        multiplier: Number(t.multiplier || 1),
      }))
      .filter((t) => Number.isFinite(t.from) && Number.isFinite(t.multiplier))
      .sort((a, b) => a.from - b.from);

    let total = 0;
    tiers.forEach((tier) => {
      const end = tier.to === null ? Infinity : tier.to;
      const tierHours = Math.max(0, Math.min(hours, end) - tier.from);
      if (tierHours <= 0) return;
      total += tierHours * rate * percent * tier.multiplier;
    });

    return { total };
  };

  const previewStats = useMemo(() => {
    if (!canSave || !shifts || !displayDate) return null;

    const getSickDaySequence = (dateStr) => {
      let count = 1;
      let curr = parseDateLocal(dateStr);
      while (true) {
        curr.setDate(curr.getDate() - 1);
        const prev = formatDateLocal(curr);
        if (shifts[prev] && shifts[prev].type === "מחלה") count++;
        else break;
      }
      return count;
    };

    const calculateEarnedPreview = (dateStr, data) => {
      let hours = Number(data.totalHours || 0);
      const rate = Number(localConfig.hourlyRate || 0);
      const percent = Number(data.hourlyPercent || 100) / 100;

      if (localConfig.isBreakDeducted && hours > 6) {
        hours -= Number(localConfig.breakDeduction || 0) / 60;
      }

      if (data.type === "מחלה") {
        const daySeq = getSickDaySequence(dateStr);
        if (daySeq === 1) return 0;
        if (daySeq === 2) return hours * rate * 0.5;
        return hours * rate;
      }

      const tiered = computeTieredPay(hours, rate, percent);
      const isWork = data.type === "עבודה";
      const travel = isWork ? Number(localConfig.travelDaily || 0) : 0;
      return tiered.total + Number(data.bonus || 0) + travel;
    };

    const monthlyShifts = getFilteredShiftsForMonth(
      shifts,
      localConfig,
      displayDate.getMonth(),
      displayDate.getFullYear(),
      calculateEarnedPreview,
    );

    return calculateNetSalary(monthlyShifts, localConfig);
  }, [canSave, shifts, displayDate, localConfig]);

  const upsertTemplate = (tpl) => {
    setLocalConfig((prev) => {
      const list = Array.isArray(prev.shiftTemplates)
        ? [...prev.shiftTemplates]
        : [];
      const idx = list.findIndex((t) => t.id === tpl.id);
      if (idx >= 0) list[idx] = tpl;
      else list.push(tpl);
      return { ...prev, shiftTemplates: list };
    });
    setTemplateModal({ visible: false, template: null });
  };

  const deleteTemplate = (id) => {
    setLocalConfig((prev) => ({
      ...prev,
      shiftTemplates: (prev.shiftTemplates || []).filter((t) => t.id !== id),
    }));
    setTemplateModal({ visible: false, template: null });
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <Text style={styles.headerBtnText}>ביטול</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>הגדרות</Text>
            <TouchableOpacity
              onPress={() => {
                if (canSave) onSave(localConfig);
              }}
              activeOpacity={0.6}
              disabled={!canSave}
            >
              <Text
                style={[
                  styles.headerBtnText,
                  !canSave && styles.headerBtnDisabled,
                ]}
              >
                שמור
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <GroupLabel title="בסיסי" />
            <SettingsProfile
              config={localConfig}
              onChange={handleConfigChange}
              errors={errors}
            />

            <Section
              title="מחזור שכר"
              icon="calendar-outline"
              helper="יום התחלת המחזור (הסוף נגזר אוטומטית)"
            >
              <View style={styles.rangeRow}>
                <Text style={styles.label}>יום התחלה</Text>
                <View style={styles.rangeBox}>
                  <Text style={styles.rangeText}>
                    {localConfig.salaryStartDay === "1"
                      ? "31"
                      : String(parseInt(localConfig.salaryStartDay || "1") - 1)}
                  </Text>
                  <Text style={styles.rangeText}>עד</Text>
                  <TextInput
                    style={[
                      styles.rangeInput,
                      errors.salaryStartDay && styles.inputError,
                    ]}
                    value={localConfig.salaryStartDay}
                    onChangeText={(v) =>
                      handleConfigChange("salaryStartDay", v)
                    }
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.rangeText}>מ-</Text>
                </View>
              </View>
              {errors.salaryStartDay ? (
                <Text style={styles.errorText}>טווח תקין: 1-31</Text>
              ) : null}
            </Section>

            <GroupLabel title="שכר" />
            <SettingsSalary
              config={localConfig}
              onChange={handleConfigChange}
              errors={errors}
            />

            <SettingsOvertime
              config={localConfig}
              onChange={handleConfigChange}
              errors={errors}
            />

            <Section
              title="הפסקות"
              icon="pause-circle-outline"
              helper="קיזוז אוטומטי למשמרות ארוכות"
            >
              <View style={styles.switchRow}>
                <Text style={styles.label}>לקזז הפסקה אוטומטית?</Text>
                <Switch
                  value={localConfig.isBreakDeducted}
                  onValueChange={(v) =>
                    handleConfigChange("isBreakDeducted", v)
                  }
                  trackColor={{ false: T.border, true: T.green }}
                  thumbColor="#fff"
                />
              </View>
              {localConfig.isBreakDeducted && (
                <>
                  <View style={styles.cardDivider} />
                  <SettingRow
                    label="דקות לקיזוז"
                    value={localConfig.breakDeduction}
                    onChange={(v) => handleConfigChange("breakDeduction", v)}
                    suffix="דק׳"
                    error={errors.breakDeduction}
                  />
                </>
              )}
            </Section>

            <GroupLabel title="משמרות" />
            <SettingsTemplates
              config={localConfig}
              onEditTemplate={(tpl) =>
                setTemplateModal({ visible: true, template: tpl })
              }
            />

            <GroupLabel title="מתקדם" />
            <Section title="מתקדם" icon="options-outline">
              <SettingRow
                label="נקודות זיכוי"
                value={localConfig.creditPoints}
                onChange={(v) => handleConfigChange("creditPoints", v)}
                helper="לצורך חישוב מס"
                error={errors.creditPoints}
              />
              <View style={styles.cardDivider} />
              <SettingRow
                label="אחוז פנסיה עובד"
                value={localConfig.pensionRate}
                onChange={(v) => handleConfigChange("pensionRate", v)}
                helper="לדוגמה: 0.06"
                error={errors.pensionRate}
              />
            </Section>

            <GroupLabel title="סיכום" />
            <Section
              title="תצוגה מקדימה"
              icon="analytics-outline"
              helper="חישוב נטו חודשי לפי הנתונים"
            >
              {previewStats ? (
                <View style={styles.previewCard}>
                  <Text style={styles.previewNet}>
                    ₪{previewStats.net.toLocaleString()}
                  </Text>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewItem}>
                      ברוטו: ₪{previewStats.gross}
                    </Text>
                    <Text style={styles.previewItem}>
                      שעות: {previewStats.totalHours}
                    </Text>
                    <Text style={styles.previewItem}>
                      משמרות: {previewStats.shiftCount}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.previewHint}>
                  תקן ערכים כדי לראות חישוב
                </Text>
              )}
            </Section>

            <GroupLabel title="נתונים" />
            <DataManagement
              config={config}
              shifts={shifts}
              onRestore={onRestore}
            />

            <View style={{ height: 30 }} />
          </ScrollView>

          <TemplateEditorModal
            visible={templateModal.visible}
            template={templateModal.template}
            onClose={() => setTemplateModal({ visible: false, template: null })}
            onSave={upsertTemplate}
            onDelete={deleteTemplate}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

// --- Sub-components ---

const Section = ({ title, icon, helper, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={T.accent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {helper ? <Text style={styles.sectionHelper}>{helper}</Text> : null}
    <View style={styles.card}>{children}</View>
  </View>
);

const SettingRow = ({
  label,
  value,
  onChange,
  keyboardType = "numeric",
  helper,
  suffix,
  fullWidth,
  error,
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingText}>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
    <View
      style={[
        styles.valueWrap,
        fullWidth && styles.valueWrapFull,
        error && styles.inputError,
      ]}
    >
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      <TextInput
        style={[styles.input, fullWidth && styles.inputFull]}
        value={String(value ?? "")}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={T.textPlaceholder}
      />
    </View>
  </View>
);

const GroupLabel = ({ title }) => (
  <View style={styles.groupLabel}>
    <Text style={styles.groupLabelText}>{title}</Text>
  </View>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.accent,
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  headerBtnDisabled: { opacity: 0.5 },
  content: { padding: 16 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: { color: T.text, fontSize: 13, fontWeight: "700" },
  sectionHelper: {
    color: T.textSecondary,
    fontSize: 11,
    marginBottom: 8,
    textAlign: "right",
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
  },
  cardDivider: { height: 1, backgroundColor: T.divider, marginRight: 12 },
  groupLabel: { marginTop: 6, marginBottom: 6 },
  groupLabelText: {
    color: T.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    letterSpacing: 0.5,
  },
  label: { color: T.text, fontSize: 13, fontWeight: "600", textAlign: "right" },
  helperText: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  errorText: {
    color: T.red,
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  settingRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  settingText: { flex: 1, alignItems: "flex-end" },
  valueWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: T.inputBg,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.border,
    minWidth: 110,
  },
  valueWrapFull: { flex: 1, justifyContent: "space-between" },
  suffix: { color: T.textSecondary, fontSize: 12, marginLeft: 6 },
  input: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
    minWidth: 60,
  },
  inputFull: { flex: 1 },
  rangeRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rangeBox: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  rangeInput: {
    color: T.accent,
    backgroundColor: T.inputBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    width: 42,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: T.border,
  },
  rangeText: { color: T.textSecondary, fontSize: 12 },
  switchRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  inputError: { borderColor: T.red },
  previewCard: { padding: 14, alignItems: "center" },
  previewNet: { color: T.accent, fontSize: 28, fontWeight: "800" },
  previewRow: { flexDirection: "row-reverse", gap: 10, marginTop: 8 },
  previewItem: { color: T.textSecondary, fontSize: 11 },
  previewHint: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: "right",
    padding: 12,
  },
});
