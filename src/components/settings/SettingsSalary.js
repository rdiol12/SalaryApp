import React from "react";
import { View, StyleSheet, TextInput, Text } from "react-native";
import { darkTheme as T } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

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

export default function SettingsSalary({ config, onChange, errors }) {
  return (
    <Section
      title="שכר ועבודה"
      icon="cash-outline"
      helper="כל הערכים בשקלים (₪)"
    >
      <SettingRow
        label="שכר שעתי"
        value={config.hourlyRate}
        onChange={(v) => onChange("hourlyRate", v)}
        suffix="₪"
        error={errors.hourlyRate}
      />
      <View style={styles.cardDivider} />
      <SettingRow
        label="נסיעות יומי"
        value={config.travelDaily}
        onChange={(v) => onChange("travelDaily", v)}
        suffix="₪"
        helper="נוסף לכל יום עבודה"
        error={errors.travelDaily}
      />
      <View style={styles.cardDivider} />
      <SettingRow
        label="יעד חודשי"
        value={config.monthlyGoal}
        onChange={(v) => onChange("monthlyGoal", v)}
        suffix="₪"
        error={errors.monthlyGoal}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
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
  settingRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  settingText: { flex: 1, alignItems: "flex-end" },
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
  inputError: { borderColor: T.red },
  suffix: { color: T.textSecondary, fontSize: 12, marginLeft: 6 },
  input: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
    minWidth: 60,
  },
  inputFull: { flex: 1 },
});
