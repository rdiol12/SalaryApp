import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
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

export default function SettingsModal({
  visible,
  config,
  onSave,
  onClose,
  shifts,
  displayDate,
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

  const templates = Array.isArray(localConfig.shiftTemplates)
    ? localConfig.shiftTemplates
    : [];

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

  const tiers = getOvertimeTiers();
  const addTier = () => {
    setLocalConfig((prev) => {
      const list = Array.isArray(prev.overtimeTiers)
        ? [...prev.overtimeTiers]
        : [];
      const last = list[list.length - 1] || { from: 0, to: 8, multiplier: 1 };
      const lastTo =
        last.to === null || last.to === "" ? null : Number(last.to);
      const nextFrom = Number.isFinite(lastTo)
        ? lastTo
        : Number(last.from || 0) + 1;
      if (lastTo === null) {
        list[list.length - 1] = { ...last, to: nextFrom };
      }
      list.push({ from: nextFrom, to: null, multiplier: 1.25 });
      return { ...prev, overtimeTiers: list };
    });
  };

  const removeTier = (idx) => {
    setLocalConfig((prev) => {
      const list = Array.isArray(prev.overtimeTiers)
        ? [...prev.overtimeTiers]
        : [];
      if (list.length <= 1) return prev;
      list.splice(idx, 1);
      if (list.length > 0 && list[list.length - 1].to !== null) {
        list[list.length - 1] = { ...list[list.length - 1], to: null };
      }
      return { ...prev, overtimeTiers: list };
    });
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
            <Section
              title="פרופיל"
              icon="person-outline"
              helper="מופיע בדוחות ובשיתוף"
            >
              <SettingRow
                label="שם משתמש"
                value={localConfig.userName}
                onChange={(v) =>
                  setLocalConfig({ ...localConfig, userName: v })
                }
                keyboardType="default"
                fullWidth
                error={errors.userName}
              />
            </Section>

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
                      setLocalConfig({ ...localConfig, salaryStartDay: v })
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
            <Section
              title="שכר ועבודה"
              icon="cash-outline"
              helper="כל הערכים בשקלים (₪)"
            >
              <SettingRow
                label="שכר שעתי"
                value={localConfig.hourlyRate}
                onChange={(v) =>
                  setLocalConfig({ ...localConfig, hourlyRate: v })
                }
                suffix="₪"
                error={errors.hourlyRate}
              />
              <View style={styles.cardDivider} />
              <SettingRow
                label="נסיעות יומי"
                value={localConfig.travelDaily}
                onChange={(v) =>
                  setLocalConfig({ ...localConfig, travelDaily: v })
                }
                suffix="₪"
                helper="נוסף לכל יום עבודה"
                error={errors.travelDaily}
              />
              <View style={styles.cardDivider} />
              <SettingRow
                label="יעד חודשי"
                value={localConfig.monthlyGoal}
                onChange={(v) =>
                  setLocalConfig({ ...localConfig, monthlyGoal: v })
                }
                suffix="₪"
                error={errors.monthlyGoal}
              />
            </Section>

            <Section
              title="שעות נוספות"
              icon="trending-up-outline"
              helper="הגדר לפי טווחי שעות"
            >
              {tiers.map((t, idx) => (
                <View key={`tier-${idx}`} style={styles.tierRow}>
                  <View style={styles.tierCol}>
                    <Text style={styles.tierLabel}>מ-</Text>
                    <TextInput
                      style={[
                        styles.tierInput,
                        errors[`tier_from_${idx}`] && styles.inputError,
                      ]}
                      value={String(t.from ?? "")}
                      onChangeText={(v) => {
                        const next = [...tiers];
                        next[idx] = {
                          ...next[idx],
                          from: v === "" ? "" : Number(v),
                        };
                        setLocalConfig((prev) => ({
                          ...prev,
                          overtimeTiers: next,
                        }));
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.tierCol}>
                    <Text style={styles.tierLabel}>עד</Text>
                    <TextInput
                      style={[
                        styles.tierInput,
                        errors[`tier_to_${idx}`] && styles.inputError,
                      ]}
                      value={t.to === null ? "" : String(t.to)}
                      onChangeText={(v) => {
                        const next = [...tiers];
                        next[idx] = {
                          ...next[idx],
                          to: v === "" ? null : Number(v),
                        };
                        setLocalConfig((prev) => ({
                          ...prev,
                          overtimeTiers: next,
                        }));
                      }}
                      keyboardType="numeric"
                      placeholder="∞"
                      placeholderTextColor={T.textPlaceholder}
                    />
                  </View>
                  <View style={styles.tierCol}>
                    <Text style={styles.tierLabel}>%</Text>
                    <TextInput
                      style={[
                        styles.tierInput,
                        errors[`tier_mult_${idx}`] && styles.inputError,
                      ]}
                      value={String(Math.round((t.multiplier || 1) * 100))}
                      onChangeText={(v) => {
                        const next = [...tiers];
                        const mult = v === "" ? "" : Number(v) / 100;
                        next[idx] = { ...next[idx], multiplier: mult };
                        setLocalConfig((prev) => ({
                          ...prev,
                          overtimeTiers: next,
                        }));
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.tierDelete}
                    onPress={() => removeTier(idx)}
                    activeOpacity={0.7}
                    disabled={tiers.length <= 1}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={14}
                      color={tiers.length <= 1 ? T.textMuted : T.red}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.sectionHelper}>
                לדוגמה: 0–8 = 100%, 8–10 = 125%, 10–12 = 140%
              </Text>
              <TouchableOpacity
                style={styles.addTierBtn}
                onPress={addTier}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={T.accent} />
                <Text style={styles.addTierText}>הוסף טווח</Text>
              </TouchableOpacity>
            </Section>

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
                    setLocalConfig({ ...localConfig, isBreakDeducted: v })
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
                    onChange={(v) =>
                      setLocalConfig({ ...localConfig, breakDeduction: v })
                    }
                    suffix="דק׳"
                    error={errors.breakDeduction}
                  />
                </>
              )}
            </Section>

            <GroupLabel title="משמרות" />
            <Section
              title="תבניות משמרת"
              icon="bookmark-outline"
              helper="הוספה מהירה במסך משמרת"
            >
              {templates.length === 0 ? (
                <View style={styles.emptyTemplates}>
                  <Text style={styles.emptyText}>אין תבניות עדיין</Text>
                </View>
              ) : (
                templates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.templateRow}
                    onPress={() =>
                      setTemplateModal({ visible: true, template: t })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{t.name}</Text>
                      <Text style={styles.templateMeta}>
                        {t.startTime} - {t.endTime} · {t.type}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={T.textMuted}
                    />
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                style={styles.addTemplateBtn}
                onPress={() =>
                  setTemplateModal({ visible: true, template: emptyTemplate() })
                }
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={T.accent} />
                <Text style={styles.addTemplateText}>הוסף תבנית</Text>
              </TouchableOpacity>
            </Section>

            <GroupLabel title="מתקדם" />
            <Section title="מתקדם" icon="options-outline">
              <SettingRow
                label="נקודות זיכוי"
                value={localConfig.creditPoints}
                onChange={(v) =>
                  setLocalConfig({ ...localConfig, creditPoints: v })
                }
                helper="לצורך חישוב מס"
                error={errors.creditPoints}
              />
              <View style={styles.cardDivider} />
              <SettingRow
                label="אחוז פנסיה עובד"
                value={localConfig.pensionRate}
                onChange={(v) =>
                  setLocalConfig({ ...localConfig, pensionRate: v })
                }
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

            <View style={{ height: 30 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <TemplateEditorModal
        visible={templateModal.visible}
        template={templateModal.template}
        onClose={() => setTemplateModal({ visible: false, template: null })}
        onSave={upsertTemplate}
        onDelete={deleteTemplate}
      />
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
  emptyTemplates: { padding: 12, alignItems: "center" },
  emptyText: { color: T.textMuted, fontSize: 12 },
  templateRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  templateInfo: { flex: 1, alignItems: "flex-end" },
  templateName: { color: T.text, fontSize: 14, fontWeight: "700" },
  templateMeta: { color: T.textSecondary, fontSize: 11, marginTop: 2 },
  addTemplateBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    padding: 12,
  },
  addTemplateText: { color: T.accent, fontSize: 13, fontWeight: "700" },
  tierRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  tierCol: { alignItems: "center" },
  tierLabel: { color: T.textSecondary, fontSize: 11, marginBottom: 4 },
  tierInput: {
    width: 64,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    textAlign: "center",
    color: T.accent,
    fontWeight: "700",
  },
  tierDelete: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.cardBgElevated,
  },
  addTierBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addTierText: { color: T.accent, fontSize: 12, fontWeight: "700" },
});
