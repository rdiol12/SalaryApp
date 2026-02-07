import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { darkTheme as T } from '../constants/theme';
import { calculateNetSalary } from '../utils/calculations';
import { getFilteredShiftsForMonth, parseDateLocal, formatDateLocal } from '../utils/shiftFilters';

const isEmpty = (v) => v === undefined || v === null || String(v).trim() === '';
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const defaultTiers = [
  { from: 0, to: 8, multiplier: 1 },
  { from: 8, to: 10, multiplier: 1.25 },
  { from: 10, to: 12, multiplier: 1.4 },
  { from: 12, to: null, multiplier: 1.4 },
];

const normalizeConfig = (cfg) => ({
  shiftTemplates: [],
  overtimeTiers: defaultTiers,
  ...cfg,
});

const validateConfig = (cfg) => {
  const errors = {};
  const start = parseInt(cfg.salaryStartDay, 10);
  const end = parseInt(cfg.salaryEndDay, 10);

  if (!Number.isInteger(start) || start < 1 || start > 31) errors.salaryStartDay = 'טווח 1-31';
  if (!Number.isInteger(end) || end < 1 || end > 31) errors.salaryEndDay = 'טווח 1-31';

  const hourlyRate = toNumber(cfg.hourlyRate);
  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) errors.hourlyRate = 'מספר חיובי';

  const travel = toNumber(cfg.travelDaily);
  if (!Number.isFinite(travel) || travel < 0) errors.travelDaily = 'מספר חיובי';

  const goal = toNumber(cfg.monthlyGoal);
  if (!Number.isFinite(goal) || goal < 0) errors.monthlyGoal = 'מספר חיובי';

  const credit = toNumber(cfg.creditPoints);
  if (!Number.isFinite(credit) || credit < 0 || credit > 10) errors.creditPoints = '0-10';

  const pension = toNumber(cfg.pensionRate);
  if (!Number.isFinite(pension) || pension < 0 || pension > 1) errors.pensionRate = '0-1';

  if (cfg.isBreakDeducted) {
    const breakMin = toNumber(cfg.breakDeduction);
    if (!Number.isFinite(breakMin) || breakMin < 0 || breakMin > 180) errors.breakDeduction = '0-180';
  }

  if (isEmpty(cfg.userName)) errors.userName = 'חובה';

  const tiers = Array.isArray(cfg.overtimeTiers) ? cfg.overtimeTiers : [];
  if (tiers.length === 0) errors.overtimeTiers = 'חובה';
  tiers.forEach((t, i) => {
    const from = toNumber(t.from);
    const to = t.to === null || t.to === '' ? null : toNumber(t.to);
    const mult = toNumber(t.multiplier);
    if (!Number.isFinite(from) || from < 0) errors[`tier_from_${i}`] = 'מספר';
    if (to !== null && (!Number.isFinite(to) || to <= from)) errors[`tier_to_${i}`] = 'גדול מ-מ';
    if (!Number.isFinite(mult) || mult < 0.5 || mult > 3) errors[`tier_mult_${i}`] = '0.5-3';
  });
  const sorted = tiers
    .map((t, idx) => ({
      idx,
      from: toNumber(t.from),
      to: t.to === null || t.to === '' ? null : toNumber(t.to),
    }))
    .filter(t => Number.isFinite(t.from))
    .sort((a, b) => a.from - b.from);
  sorted.forEach((t, i) => {
    if (t.to === null && i !== sorted.length - 1) errors[`tier_to_${t.idx}`] = 'חייב להיות אחרון';
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevTo = prev.to === null ? prev.from : prev.to;
      if (Number.isFinite(prevTo) && t.from < prevTo) errors[`tier_from_${t.idx}`] = 'טווח חופף';
    }
  });

  return errors;
};

const emptyTemplate = () => ({
  id: Date.now().toString(),
  name: '',
  type: 'עבודה',
  startTime: '08:00',
  endTime: '17:00',
  hourlyPercent: '100',
  bonus: '0',
});

const TemplateEditor = ({ visible, template, onClose, onSave, onDelete }) => {
  const [localTemplate, setLocalTemplate] = useState(template || emptyTemplate());
  const [picker, setPicker] = useState({ field: null, visible: false });
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    if (visible) setLocalTemplate(template || emptyTemplate());
  }, [visible, template]);

  const parseTimeToDate = (timeStr) => {
    const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
    const d = new Date();
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d;
  };

  const formatTime = (d) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.headerBtnText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>תבנית משמרת</Text>
          <TouchableOpacity onPress={() => onSave(localTemplate)} activeOpacity={0.6}>
            <Text style={styles.headerBtnText}>שמור</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="פרטי תבנית" icon="bookmark-outline">
            <SettingRow
              label="שם תבנית"
              value={localTemplate.name}
              onChange={(v) => setLocalTemplate({ ...localTemplate, name: v })}
              keyboardType="default"
              fullWidth
            />
            <View style={styles.cardDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.label}>סוג משמרת</Text>
              </View>
              <View style={styles.valueWrap}>
                <Picker
                  selectedValue={localTemplate.type}
                  onValueChange={(v) => setLocalTemplate({ ...localTemplate, type: v })}
                  style={styles.picker}
                >
                  <Picker.Item label="עבודה" value="עבודה" />
                  <Picker.Item label="שבת" value="שבת" />
                  <Picker.Item label="מחלה" value="מחלה" />
                  <Picker.Item label="חופש" value="חופש" />
                </Picker>
              </View>
            </View>
          </Section>

          <Section title="זמנים" icon="time-outline">
            <View style={styles.timeRow}>
              <TouchableOpacity style={styles.timeBox} onPress={() => setPicker({ field: 'start', visible: true })} activeOpacity={0.7}>
                <Text style={styles.timeLabel}>התחלה</Text>
                <Text style={styles.timeValue}>{localTemplate.startTime}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeBox} onPress={() => setPicker({ field: 'end', visible: true })} activeOpacity={0.7}>
                <Text style={styles.timeLabel}>סיום</Text>
                <Text style={styles.timeValue}>{localTemplate.endTime}</Text>
              </TouchableOpacity>
            </View>
          </Section>

          <Section title="שכר" icon="cash-outline">
            <SettingRow
              label="אחוז שכר"
              value={localTemplate.hourlyPercent}
              onChange={(v) => setLocalTemplate({ ...localTemplate, hourlyPercent: v })}
              suffix="%"
            />
            <View style={styles.cardDivider} />
            <SettingRow
              label="בונוס"
              value={localTemplate.bonus}
              onChange={(v) => setLocalTemplate({ ...localTemplate, bonus: v })}
              suffix="₪"
            />
          </Section>

          <View style={styles.templateActions}>
            {!!template?.id && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(template.id)} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.deleteText}>מחיקת תבנית</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {picker.visible && (
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={parseTimeToDate(picker.field === 'start' ? localTemplate.startTime : localTemplate.endTime)}
              mode="time"
              is24Hour={true}
              display="spinner"
              textColor={T.text}
              onChange={(e, d) => {
                if (Platform.OS === 'android') {
                  setPicker({ field: null, visible: false });
                  if (e.type === 'set' && d) {
                    const timeStr = formatTime(d);
                    if (picker.field === 'start') setLocalTemplate({ ...localTemplate, startTime: timeStr });
                    else setLocalTemplate({ ...localTemplate, endTime: timeStr });
                  }
                  return;
                }
                if (!d) return;
                const timeStr = formatTime(d);
                if (picker.field === 'start') setLocalTemplate({ ...localTemplate, startTime: timeStr });
                else setLocalTemplate({ ...localTemplate, endTime: timeStr });
              }}
            />
            {isIOS && (
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={() => setPicker({ field: null, visible: false })}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerDoneText}>סיום</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default function SettingsModal({ visible, config, onSave, onClose, shifts, displayDate }) {
  const [localConfig, setLocalConfig] = useState(normalizeConfig(config));
  const [templateModal, setTemplateModal] = useState({ visible: false, template: null });

  useEffect(() => { if (visible) setLocalConfig(normalizeConfig(config)); }, [visible, config]);

  const errors = useMemo(() => validateConfig(localConfig), [localConfig]);
  const canSave = Object.keys(errors).length === 0;

  const getOvertimeTiers = () => {
    const tiers = Array.isArray(localConfig.overtimeTiers) ? localConfig.overtimeTiers : [];
    return tiers.length > 0 ? tiers : defaultTiers;
  };

  const computeTieredPay = (hours, rate, percent) => {
    const tiers = getOvertimeTiers()
      .map(t => ({
        from: Number(t.from || 0),
        to: t.to === null || t.to === '' ? null : Number(t.to),
        multiplier: Number(t.multiplier || 1),
      }))
      .filter(t => Number.isFinite(t.from) && Number.isFinite(t.multiplier))
      .sort((a, b) => a.from - b.from);

    const breakdown = [];
    let total = 0;

    tiers.forEach((tier) => {
      const end = tier.to === null ? Infinity : tier.to;
      const tierHours = Math.max(0, Math.min(hours, end) - tier.from);
      if (tierHours <= 0) return;
      const tierPay = tierHours * rate * percent * tier.multiplier;
      breakdown.push({ hours: tierHours, multiplier: tier.multiplier, amount: tierPay });
      total += tierPay;
    });

    return { total, breakdown };
  };

  const previewStats = useMemo(() => {
    if (!canSave || !shifts || !displayDate) return null;

    const getSickDaySequence = (dateStr) => {
      let count = 1;
      let curr = parseDateLocal(dateStr);
      while (true) {
        curr.setDate(curr.getDate() - 1);
        const prev = formatDateLocal(curr);
        if (shifts[prev] && shifts[prev].type === 'מחלה') count++;
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

      if (data.type === 'מחלה') {
        const daySeq = getSickDaySequence(dateStr);
        if (daySeq === 1) return 0;
        if (daySeq === 2 || daySeq === 3) return hours * rate * 0.5;
        return hours * rate;
      }

      const tiered = computeTieredPay(hours, rate, percent);
      const isWork = data.type === 'עבודה';
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

  const templates = Array.isArray(localConfig.shiftTemplates) ? localConfig.shiftTemplates : [];

  const upsertTemplate = (tpl) => {
    setLocalConfig(prev => {
      const list = Array.isArray(prev.shiftTemplates) ? [...prev.shiftTemplates] : [];
      const idx = list.findIndex(t => t.id === tpl.id);
      if (idx >= 0) list[idx] = tpl;
      else list.push(tpl);
      return { ...prev, shiftTemplates: list };
    });
    setTemplateModal({ visible: false, template: null });
  };

  const deleteTemplate = (id) => {
    setLocalConfig(prev => ({
      ...prev,
      shiftTemplates: (prev.shiftTemplates || []).filter(t => t.id !== id),
    }));
    setTemplateModal({ visible: false, template: null });
  };

  const tiers = getOvertimeTiers();
  const addTier = () => {
    setLocalConfig(prev => {
      const list = Array.isArray(prev.overtimeTiers) ? [...prev.overtimeTiers] : [];
      const last = list[list.length - 1] || { from: 0, to: 8, multiplier: 1 };
      const lastTo = last.to === null || last.to === '' ? null : Number(last.to);
      const nextFrom = Number.isFinite(lastTo) ? lastTo : Number(last.from || 0) + 1;
      if (lastTo === null) {
        list[list.length - 1] = { ...last, to: nextFrom };
      }
      list.push({ from: nextFrom, to: null, multiplier: 1.25 });
      return { ...prev, overtimeTiers: list };
    });
  };

  const removeTier = (idx) => {
    setLocalConfig(prev => {
      const list = Array.isArray(prev.overtimeTiers) ? [...prev.overtimeTiers] : [];
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
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <Text style={styles.headerBtnText}>ביטול</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>הגדרות</Text>
            <TouchableOpacity
              onPress={() => { if (canSave) onSave(localConfig); }}
              activeOpacity={0.6}
              disabled={!canSave}
            >
              <Text style={[styles.headerBtnText, !canSave && styles.headerBtnDisabled]}>שמור</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Section title="פרופיל" icon="person-outline" helper="מופיע בדוחות ובשיתוף">
              <SettingRow
                label="שם משתמש"
                value={localConfig.userName}
                onChange={(v) => setLocalConfig({ ...localConfig, userName: v })}
                keyboardType="default"
                fullWidth
                error={errors.userName}
              />
            </Section>

            <Section title="מחזור שכר" icon="calendar-outline" helper="לדוגמה: 25 עד 24">
              <View style={styles.rangeRow}>
                <Text style={styles.label}>ימי מחזור</Text>
                <View style={styles.rangeBox}>
                  <TextInput
                    style={[styles.rangeInput, errors.salaryEndDay && styles.inputError]}
                    value={localConfig.salaryEndDay}
                    onChangeText={(v) => setLocalConfig({ ...localConfig, salaryEndDay: v })}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.rangeText}>עד</Text>
                  <TextInput
                    style={[styles.rangeInput, errors.salaryStartDay && styles.inputError]}
                    value={localConfig.salaryStartDay}
                    onChangeText={(v) => setLocalConfig({ ...localConfig, salaryStartDay: v })}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.rangeText}>מ-</Text>
                </View>
              </View>
              {(errors.salaryStartDay || errors.salaryEndDay) ? (
                <Text style={styles.errorText}>טווח תקין: 1-31</Text>
              ) : null}
            </Section>

            <Section title="שכר ועבודה" icon="cash-outline" helper="כל הערכים בשקלים (₪)">
              <SettingRow
                label="שכר שעתי"
                value={localConfig.hourlyRate}
                onChange={(v) => setLocalConfig({ ...localConfig, hourlyRate: v })}
                suffix="₪"
                error={errors.hourlyRate}
              />
              <View style={styles.cardDivider} />
              <SettingRow
                label="נסיעות יומי"
                value={localConfig.travelDaily}
                onChange={(v) => setLocalConfig({ ...localConfig, travelDaily: v })}
                suffix="₪"
                helper="נוסף לכל יום עבודה"
                error={errors.travelDaily}
              />
              <View style={styles.cardDivider} />
              <SettingRow
                label="יעד חודשי"
                value={localConfig.monthlyGoal}
                onChange={(v) => setLocalConfig({ ...localConfig, monthlyGoal: v })}
                suffix="₪"
                error={errors.monthlyGoal}
              />
            </Section>

            <Section title="שעות נוספות" icon="trending-up-outline" helper="הגדר לפי טווחי שעות">
              {tiers.map((t, idx) => (
                <View key={`tier-${idx}`} style={styles.tierRow}>
                  <View style={styles.tierCol}>
                    <Text style={styles.tierLabel}>מ-</Text>
                    <TextInput
                      style={[styles.tierInput, errors[`tier_from_${idx}`] && styles.inputError]}
                      value={String(t.from ?? '')}
                      onChangeText={(v) => {
                        const next = [...tiers];
                        next[idx] = { ...next[idx], from: v === '' ? '' : Number(v) };
                        setLocalConfig(prev => ({ ...prev, overtimeTiers: next }));
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.tierCol}>
                    <Text style={styles.tierLabel}>עד</Text>
                    <TextInput
                      style={[styles.tierInput, errors[`tier_to_${idx}`] && styles.inputError]}
                      value={t.to === null ? '' : String(t.to)}
                      onChangeText={(v) => {
                        const next = [...tiers];
                        next[idx] = { ...next[idx], to: v === '' ? null : Number(v) };
                        setLocalConfig(prev => ({ ...prev, overtimeTiers: next }));
                      }}
                      keyboardType="numeric"
                      placeholder="∞"
                      placeholderTextColor={T.textPlaceholder}
                    />
                  </View>
                  <View style={styles.tierCol}>
                    <Text style={styles.tierLabel}>%</Text>
                    <TextInput
                      style={[styles.tierInput, errors[`tier_mult_${idx}`] && styles.inputError]}
                      value={String(Math.round((t.multiplier || 1) * 100))}
                      onChangeText={(v) => {
                        const next = [...tiers];
                        const mult = v === '' ? '' : Number(v) / 100;
                        next[idx] = { ...next[idx], multiplier: mult };
                        setLocalConfig(prev => ({ ...prev, overtimeTiers: next }));
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
                    <Ionicons name="trash-outline" size={14} color={tiers.length <= 1 ? T.textMuted : T.red} />
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.sectionHelper}>לדוגמה: 0–8 = 100%, 8–10 = 125%, 10–12 = 140%</Text>
              <TouchableOpacity style={styles.addTierBtn} onPress={addTier} activeOpacity={0.7}>
                <Ionicons name="add" size={16} color={T.accent} />
                <Text style={styles.addTierText}>הוסף טווח</Text>
              </TouchableOpacity>
            </Section>

            <Section title="הפסקות" icon="pause-circle-outline" helper="קיזוז אוטומטי למשמרות ארוכות">
              <View style={styles.switchRow}>
                <Text style={styles.label}>לקזז הפסקה אוטומטית?</Text>
                <Switch
                  value={localConfig.isBreakDeducted}
                  onValueChange={(v) => setLocalConfig({ ...localConfig, isBreakDeducted: v })}
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
                    onChange={(v) => setLocalConfig({ ...localConfig, breakDeduction: v })}
                    suffix="דק׳"
                    error={errors.breakDeduction}
                  />
                </>
              )}
            </Section>

            <Section title="תבניות משמרת" icon="bookmark-outline" helper="הוספה מהירה במסך משמרת">
              {templates.length === 0 ? (
                <View style={styles.emptyTemplates}>
                  <Text style={styles.emptyText}>אין תבניות עדיין</Text>
                </View>
              ) : (
                templates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.templateRow}
                    onPress={() => setTemplateModal({ visible: true, template: t })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{t.name}</Text>
                      <Text style={styles.templateMeta}>{t.startTime} - {t.endTime} · {t.type}</Text>
                    </View>
                    <Ionicons name="chevron-back" size={16} color={T.textMuted} />
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                style={styles.addTemplateBtn}
                onPress={() => setTemplateModal({ visible: true, template: emptyTemplate() })}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={T.accent} />
                <Text style={styles.addTemplateText}>הוסף תבנית</Text>
              </TouchableOpacity>
            </Section>

            <Section title="מתקדם" icon="options-outline">
              <SettingRow
                label="נקודות זיכוי"
                value={localConfig.creditPoints}
                onChange={(v) => setLocalConfig({ ...localConfig, creditPoints: v })}
                helper="לצורך חישוב מס"
                error={errors.creditPoints}
              />
              <View style={styles.cardDivider} />
              <SettingRow
                label="אחוז פנסיה עובד"
                value={localConfig.pensionRate}
                onChange={(v) => setLocalConfig({ ...localConfig, pensionRate: v })}
                helper="לדוגמה: 0.06"
                error={errors.pensionRate}
              />
            </Section>

            <Section title="תצוגה מקדימה" icon="analytics-outline" helper="חישוב נטו חודשי לפי הנתונים">
              {previewStats ? (
                <View style={styles.previewCard}>
                  <Text style={styles.previewNet}>₪{previewStats.net.toLocaleString()}</Text>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewItem}>ברוטו: ₪{previewStats.gross}</Text>
                    <Text style={styles.previewItem}>שעות: {previewStats.totalHours}</Text>
                    <Text style={styles.previewItem}>משמרות: {previewStats.shiftCount}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.previewHint}>תקן ערכים כדי לראות חישוב</Text>
              )}
            </Section>

            <View style={{ height: 30 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <TemplateEditor
        visible={templateModal.visible}
        template={templateModal.template}
        onClose={() => setTemplateModal({ visible: false, template: null })}
        onSave={upsertTemplate}
        onDelete={deleteTemplate}
      />
    </>
  );
}

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

const SettingRow = ({ label, value, onChange, keyboardType = 'numeric', helper, suffix, fullWidth, error }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingText}>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
    <View style={[styles.valueWrap, fullWidth && styles.valueWrapFull, error && styles.inputError]}>
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      <TextInput
        style={[styles.input, fullWidth && styles.inputFull]}
        value={String(value ?? '')}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={T.textPlaceholder}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.accent,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  headerBtnDisabled: {
    opacity: 0.5,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHelper: {
    color: T.textSecondary,
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'right',
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
  },
  cardDivider: {
    height: 1,
    backgroundColor: T.divider,
    marginRight: 12,
  },
  label: {
    color: T.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  helperText: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  errorText: {
    color: T.red,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  settingText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  valueWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: T.inputBg,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.border,
    minWidth: 110,
  },
  valueWrapFull: {
    flex: 1,
    justifyContent: 'space-between',
  },
  suffix: {
    color: T.textSecondary,
    fontSize: 12,
    marginLeft: 6,
  },
  input: {
    color: T.accent,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'left',
    minWidth: 60,
  },
  inputFull: {
    flex: 1,
  },
  rangeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rangeBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  rangeInput: {
    color: T.accent,
    backgroundColor: T.inputBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    width: 42,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: T.border,
  },
  rangeText: {
    color: T.textSecondary,
    fontSize: 12,
  },
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: T.red,
  },
  previewCard: {
    padding: 14,
    alignItems: 'center',
  },
  previewNet: {
    color: T.accent,
    fontSize: 28,
    fontWeight: '800',
  },
  previewRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 8,
  },
  previewItem: {
    color: T.textSecondary,
    fontSize: 11,
  },
  previewHint: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: 'right',
    padding: 12,
  },
  emptyTemplates: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: T.textMuted,
    fontSize: 12,
  },
  templateRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  templateInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  templateName: {
    color: T.text,
    fontSize: 14,
    fontWeight: '700',
  },
  templateMeta: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  addTemplateBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  addTemplateText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  templateActions: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  deleteBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.red,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    padding: 12,
  },
  timeBox: {
    flex: 1,
    backgroundColor: T.cardBgElevated,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  timeLabel: {
    color: T.textSecondary,
    fontSize: 11,
  },
  timeValue: {
    color: T.accent,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  picker: {
    color: T.accent,
    width: 140,
  },
  pickerSheet: {
    marginTop: 8,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  pickerDone: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: T.divider,
    backgroundColor: T.cardBg,
  },
  pickerDoneText: {
    color: T.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  tierRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  tierCol: {
    alignItems: 'center',
  },
  tierLabel: {
    color: T.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  tierInput: {
    width: 64,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    textAlign: 'center',
    color: T.accent,
    fontWeight: '700',
  },
  tierDelete: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.cardBgElevated,
  },
  addTierBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addTierText: {
    color: T.accent,
    fontSize: 12,
    fontWeight: '700',
  },
});
