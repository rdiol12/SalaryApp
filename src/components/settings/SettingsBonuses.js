import React from "react";
import { View, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";
import { newBonus, monthKeyOf, monthKeyLabel } from "../../utils/bonuses.js";

/**
 * Named bonuses of the job: any number, each with a name, an amount, and
 * whether it is paid every month or only in the month being viewed.
 * Bonuses of other months are kept but not listed here.
 */
export default function SettingsBonuses({ config, onChange, displayDate, error }) {
  const all = Array.isArray(config.bonuses) ? config.bonuses : [];
  const monthKey = monthKeyOf(displayDate || new Date());
  const monthLabel = monthKeyLabel(monthKey);
  const shown = all.filter((b) => !b.month || b.month === monthKey);
  const otherMonths = all.length - shown.length;

  const update = (id, patch) =>
    onChange("bonuses", all.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id) => onChange("bonuses", all.filter((b) => b.id !== id));
  const add = () => onChange("bonuses", [...all, newBonus({ month: monthKey })]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="gift-outline" size={16} color={T.accent} />
        <Text style={styles.sectionTitle}>בונוסים</Text>
      </View>
      <Text style={styles.sectionHelper}>
        אפשר להוסיף כמה בונוסים שרוצים, עם שם וסכום. בונוס הוא הכנסה חייבת במס.
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.card}>
        {shown.length === 0 ? (
          <Text style={styles.emptyText}>אין בונוסים ב{monthLabel}</Text>
        ) : (
          shown.map((b, i) => (
            <View key={b.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={styles.nameRow}>
                  <TouchableOpacity
                    onPress={() => remove(b.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={T.red} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.nameInput}
                    value={b.name}
                    onChangeText={(v) => update(b.id, { name: v })}
                    placeholder="שם הבונוס (למשל מענק חג)"
                    placeholderTextColor={T.textPlaceholder}
                  />
                  <View style={styles.amountBox}>
                    <Text style={styles.suffix}>₪</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={String(b.amount ?? "")}
                      onChangeText={(v) => update(b.id, { amount: v })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={T.textPlaceholder}
                    />
                  </View>
                </View>
                <View style={styles.whenRow}>
                  {[
                    { key: "month", label: `רק ב${monthLabel}`, value: monthKey },
                    { key: "every", label: "כל חודש", value: null },
                  ].map((opt) => {
                    const active = (b.month || null) === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => update(b.id, { month: opt.value })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          ))
        )}
        <View style={styles.divider} />
        <TouchableOpacity style={styles.addBtn} onPress={add} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={18} color={T.accent} />
          <Text style={styles.addText}>הוסף בונוס</Text>
        </TouchableOpacity>
      </View>
      {otherMonths > 0 ? (
        <Text style={styles.sectionHelper}>
          עוד {otherMonths} בונוסים שמורים לחודשים אחרים. עבור לחודש שלהם כדי לערוך.
        </Text>
      ) : null}
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
    marginTop: 4,
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
  emptyText: { color: T.textSecondary, fontSize: 12, textAlign: "center", padding: 14 },
  row: { padding: 12, gap: 10 },
  nameRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
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
  amountBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: T.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 100,
  },
  suffix: { color: T.textSecondary, fontSize: 12, marginLeft: 6 },
  amountInput: { flex: 1, color: T.accent, fontSize: 14, fontWeight: "700", textAlign: "left" },
  whenRow: { flexDirection: "row-reverse", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.accent,
  },
  chipActive: { backgroundColor: T.accent },
  chipText: { color: T.accent, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  addBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  addText: { color: T.accent, fontSize: 13, fontWeight: "700" },
});
