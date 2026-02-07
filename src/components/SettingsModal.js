import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';

export default function SettingsModal({ visible, config, onSave, onClose }) {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => { if (visible) setLocalConfig(config); }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.headerBtnText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>הגדרות</Text>
          <TouchableOpacity onPress={() => onSave(localConfig)} activeOpacity={0.6}>
            <Text style={styles.headerBtnText}>שמור</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <SectionHeader icon="calendar-outline" label="מחזור שכר" />
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rangeBox}>
                <TextInput
                  style={styles.rangeInput}
                  value={localConfig.salaryEndDay}
                  onChangeText={(v) => setLocalConfig({ ...localConfig, salaryEndDay: v })}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.rangeText}>עד</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={localConfig.salaryStartDay}
                  onChangeText={(v) => setLocalConfig({ ...localConfig, salaryStartDay: v })}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.rangeText}>מ-</Text>
              </View>
              <Text style={styles.label}>ימי מחזור</Text>
            </View>
          </View>

          <SectionHeader icon="pause-circle-outline" label="הפסקות" />
          <View style={styles.card}>
            <View style={styles.row}>
              <Switch
                value={localConfig.isBreakDeducted}
                onValueChange={(v) => setLocalConfig({ ...localConfig, isBreakDeducted: v })}
                trackColor={{ false: T.border, true: T.green }}
                thumbColor="#fff"
              />
              <Text style={styles.label}>לקזז הפסקה אוטומטית?</Text>
            </View>
            {localConfig.isBreakDeducted && (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={localConfig.breakDeduction}
                    onChangeText={(v) => setLocalConfig({ ...localConfig, breakDeduction: v })}
                    keyboardType="numeric"
                  />
                  <Text style={styles.label}>דקות להורדה</Text>
                </View>
              </>
            )}
          </View>

          <SectionHeader icon="cash-outline" label="שכר ובסיס" />
          <View style={styles.card}>
            <SettingInput
              label="שם משתמש"
              value={localConfig.userName}
              onChange={(v) => setLocalConfig({ ...localConfig, userName: v })}
              keyboardType="default"
            />
            <View style={styles.cardDivider} />
            <SettingInput
              label="שכר שעתי (₪)"
              value={localConfig.hourlyRate}
              onChange={(v) => setLocalConfig({ ...localConfig, hourlyRate: v })}
            />
            <View style={styles.cardDivider} />
            <SettingInput
              label="נסיעות יומי (₪)"
              value={localConfig.travelDaily}
              onChange={(v) => setLocalConfig({ ...localConfig, travelDaily: v })}
            />
            <View style={styles.cardDivider} />
            <SettingInput
              label="יעד חודשי (₪)"
              value={localConfig.monthlyGoal}
              onChange={(v) => setLocalConfig({ ...localConfig, monthlyGoal: v })}
            />
          </View>

          <SectionHeader icon="options-outline" label="הגדרות מתקדמות" />
          <View style={styles.card}>
            <SettingInput
              label="נקודות זיכוי"
              value={localConfig.creditPoints}
              onChange={(v) => setLocalConfig({ ...localConfig, creditPoints: v })}
            />
            <View style={styles.cardDivider} />
            <SettingInput
              label="אחוז פנסיה עובד (למשל 0.06)"
              value={localConfig.pensionRate}
              onChange={(v) => setLocalConfig({ ...localConfig, pensionRate: v })}
            />
            <View style={styles.cardDivider} />
            <SettingInput
              label="סף שעות לנוספות"
              value={localConfig.overtimeStartThreshold}
              onChange={(v) => setLocalConfig({ ...localConfig, overtimeStartThreshold: v })}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const SectionHeader = ({ icon, label }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={15} color={T.textSecondary} />
    <Text style={styles.sectionLabel}>{label}</Text>
  </View>
);

const SettingInput = ({ label, value, onChange, keyboardType = 'numeric' }) => (
  <View style={styles.inputRow}>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      placeholderTextColor={T.textPlaceholder}
    />
    <Text style={styles.label}>{label}</Text>
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
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 20,
  },
  sectionLabel: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: T.divider,
    marginLeft: 12,
  },
  label: {
    color: T.text,
    fontSize: 14,
  },
  input: {
    color: T.accent,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'left',
    minWidth: 60,
  },
  rangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rangeInput: {
    color: T.accent,
    backgroundColor: T.inputBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: T.radiusSm,
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  rangeText: {
    color: T.textSecondary,
    fontSize: 12,
  },
});
