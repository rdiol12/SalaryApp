import React from "react";
import { View, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";
import { FUND_PRESETS, newFund } from "../../utils/funds.js";

const PctInput = ({ label, value, onChange }) => (
  <View style={styles.pctCol}>
    <Text style={styles.pctLabel}>{label}</Text>
    <View style={styles.pctBox}>
      <Text style={styles.suffix}>%</Text>
      <TextInput
        style={styles.pctInput}
        value={String(value ?? "")}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={T.textPlaceholder}
      />
    </View>
  </View>
);

/**
 * Worker-defined extra funds (קרן השתלמות, קופת גמל, ...): name plus
 * employee and employer percentages. The employee share is deducted from net.
 */
export default function SettingsFunds({ config, onChange, error }) {
  const funds = Array.isArray(config.extraFunds) ? config.extraFunds : [];

  const update = (id, patch) =>
    onChange(
      "extraFunds",
      funds.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  const remove = (id) =>
    onChange(
      "extraFunds",
      funds.filter((f) => f.id !== id),
    );
  const add = (preset) => onChange("extraFunds", [...funds, newFund(preset)]);

  const missingPresets = FUND_PRESETS.filter(
    (p) => !funds.some((f) => f.name === p.name),
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="wallet-outline" size={16} color={T.accent} />
        <Text style={styles.sectionTitle}>הפרשות נוספות</Text>
      </View>
      <Text style={styles.sectionHelper}>
        קרן השתלמות, קופת גמל וכל הפרשה אחרת מהתלוש. חלק העובד יורד מהנטו.
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.card}>
        {funds.length === 0 ? (
          <Text style={styles.emptyText}>אין הפרשות נוספות</Text>
        ) : (
          funds.map((f, i) => (
            <View key={f.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.fundRow}>
                <View style={styles.nameRow}>
                  <TouchableOpacity
                    onPress={() => remove(f.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={T.red} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.nameInput}
                    value={f.name}
                    onChangeText={(v) => update(f.id, { name: v })}
                    placeholder="שם ההפרשה"
                    placeholderTextColor={T.textPlaceholder}
                  />
                </View>
                <View style={styles.pctRow}>
                  <PctInput
                    label="עובד"
                    value={f.employeePct}
                    onChange={(v) => update(f.id, { employeePct: v })}
                  />
                  <PctInput
                    label="מעסיק"
                    value={f.employerPct}
                    onChange={(v) => update(f.id, { employerPct: v })}
                  />
                </View>
              </View>
            </View>
          ))
        )}
        <View style={styles.divider} />
        <View style={styles.addRow}>
          {missingPresets.map((p) => (
            <TouchableOpacity
              key={p.name}
              style={styles.chip}
              onPress={() => add(p)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={14} color={T.accent} />
              <Text style={styles.chipText}>{p.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.chip}
            onPress={() => add()}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={14} color={T.accent} />
            <Text style={styles.chipText}>אחר</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  errorText: { color: T.red, fontSize: 11, marginBottom: 6, textAlign: "right" },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
  },
  divider: { height: 1, backgroundColor: T.divider, marginRight: 12 },
  emptyText: {
    color: T.textSecondary,
    fontSize: 12,
    textAlign: "center",
    padding: 14,
  },
  fundRow: { padding: 12, gap: 10 },
  nameRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  nameInput: {
    flex: 1,
    color: T.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    backgroundColor: T.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pctRow: { flexDirection: "row-reverse", gap: 10 },
  pctCol: { flex: 1, gap: 4 },
  pctLabel: { color: T.textSecondary, fontSize: 11, textAlign: "right" },
  pctBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: T.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suffix: { color: T.textSecondary, fontSize: 12, marginLeft: 6 },
  pctInput: {
    flex: 1,
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
  },
  addRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
  },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.accent,
  },
  chipText: { color: T.accent, fontSize: 12, fontWeight: "600" },
});
