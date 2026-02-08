import React from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
} from "react-native";
import { darkTheme as T } from "../../constants/theme.js";
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

export default function SettingsOvertime({ config, onChange, errors }) {
  const tiers = Array.isArray(config.overtimeTiers) ? config.overtimeTiers : [];
  // Ensure at least one tier exist logic is handled in addTier but we should display what we have

  const updateTiers = (newTiers) => {
    onChange("overtimeTiers", newTiers);
  };

  const addTier = () => {
    const list = [...tiers];
    const last = list[list.length - 1] || { from: 0, to: 8, multiplier: 1 };
    const lastTo = last.to === null || last.to === "" ? null : Number(last.to);
    const nextFrom = Number.isFinite(lastTo)
      ? lastTo
      : Number(last.from || 0) + 1;

    if (lastTo === null) {
      list[list.length - 1] = { ...last, to: nextFrom };
    }
    list.push({ from: nextFrom, to: null, multiplier: 1.25 });
    updateTiers(list);
  };

  const removeTier = (idx) => {
    const list = [...tiers];
    if (list.length <= 1) return;
    list.splice(idx, 1);
    // If we removed the last one, ensure the new last one extends to infinity (null)
    if (list.length > 0 && list[list.length - 1].to !== null) {
      // Only if it was the last tier that was infinite.
      // Actually, logic in SettingsModal was:
      // if (list.length > 0 && list[list.length - 1].to !== null) ...
      // Wait, if we remove a middle tier, we might have gaps.
      // The original logic just set the *new* last tier to null.
      // Let's stick to the original logic for now.
      list[list.length - 1] = { ...list[list.length - 1], to: null };
    }
    updateTiers(list);
  };

  const updateTierField = (idx, field, value) => {
    const next = [...tiers];
    next[idx] = { ...next[idx], [field]: value };
    updateTiers(next);
  };

  return (
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
              onChangeText={(v) =>
                updateTierField(idx, "from", v === "" ? "" : Number(v))
              }
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
              onChangeText={(v) =>
                updateTierField(idx, "to", v === "" ? null : Number(v))
              }
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
              onChangeText={(v) =>
                updateTierField(
                  idx,
                  "multiplier",
                  v === "" ? "" : Number(v) / 100,
                )
              }
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
  inputError: { borderColor: T.red },
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
