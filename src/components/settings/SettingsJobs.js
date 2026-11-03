import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";
import { createJob } from "../../utils/jobs.js";
import { SECONDARY_JOB_TAX_RATE } from "../../constants/israeliTax.js";

/**
 * The worker's jobs: add, rename, delete, choose the main job, and set a tax
 * coordination (תיאום מס) for additional jobs. Tapping a job chooses which
 * job the pay settings below belong to.
 */
export default function SettingsJobs({
  jobs,
  editingJobId,
  onSelectEdit,
  onChangeJobs,
  jobErrors = {},
}) {
  const update = (id, patch) =>
    onChangeJobs(jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const setPrimary = (id) =>
    onChangeJobs(jobs.map((j) => ({ ...j, isPrimary: j.id === id })));

  const add = () => {
    const editing = jobs.find((j) => j.id === editingJobId) || jobs[0];
    // Start from the current job's settings, so only what differs needs editing.
    const job = createJob({
      name: `עבודה ${jobs.length + 1}`,
      settings: { ...(editing?.settings || {}), extraFunds: [], shiftTemplates: [] },
    });
    onChangeJobs([...jobs, job]);
    onSelectEdit(job.id);
  };

  const remove = (job) => {
    Alert.alert(
      "מחיקת עבודה",
      `למחוק את "${job.name}"? כל המשמרות של העבודה הזו יימחקו כשתשמור.`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק",
          style: "destructive",
          onPress: () => {
            const rest = jobs.filter((j) => j.id !== job.id);
            const next = job.isPrimary
              ? rest.map((j, i) => ({ ...j, isPrimary: i === 0 }))
              : rest;
            onChangeJobs(next);
            if (editingJobId === job.id) onSelectEdit(next[0].id);
          },
        },
      ],
    );
  };

  const flatPct = Math.round(SECONDARY_JOB_TAX_RATE * 100);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="briefcase-outline" size={16} color={T.accent} />
        <Text style={styles.sectionTitle}>העבודות שלי</Text>
      </View>
      <Text style={styles.sectionHelper}>
        לכל עבודה הגדרות שכר משלה. בחר עבודה כדי לערוך את ההגדרות שלה למטה.
      </Text>
      <View style={styles.card}>
        {jobs.map((job, i) => {
          const editing = job.id === editingJobId;
          const error = jobErrors[job.id];
          return (
            <View key={job.id}>
              {i > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelectEdit(job.id)}
                style={[styles.jobRow, editing && styles.jobRowEditing]}
              >
                <View style={styles.nameRow}>
                  <Ionicons
                    name={editing ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={T.accent}
                  />
                  <TextInput
                    style={[styles.nameInput, !job.name?.trim() && styles.inputError]}
                    value={job.name}
                    onChangeText={(v) => update(job.id, { name: v })}
                    onFocus={() => onSelectEdit(job.id)}
                    placeholder="שם העבודה"
                    placeholderTextColor={T.textPlaceholder}
                  />
                  {jobs.length > 1 && (
                    <TouchableOpacity
                      onPress={() => remove(job)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={T.red} />
                    </TouchableOpacity>
                  )}
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {jobs.length > 1 && (
                  <>
                    <View style={styles.switchRow}>
                      <Text style={styles.label}>עבודה ראשית (נקודות זיכוי)</Text>
                      <Switch
                        value={!!job.isPrimary}
                        onValueChange={(v) => v && setPrimary(job.id)}
                        trackColor={{ false: T.border, true: T.green }}
                        thumbColor="#fff"
                      />
                    </View>

                    {!job.isPrimary && (
                      <>
                        <View style={styles.switchRow}>
                          <Text style={styles.label}>יש תיאום מס</Text>
                          <Switch
                            value={!!job.taxCoordination}
                            onValueChange={(v) => update(job.id, { taxCoordination: v })}
                            trackColor={{ false: T.border, true: T.green }}
                            thumbColor="#fff"
                          />
                        </View>
                        {job.taxCoordination ? (
                          <View style={styles.switchRow}>
                            <Text style={styles.label}>שיעור מס מהאישור</Text>
                            <View style={styles.pctBox}>
                              <Text style={styles.suffix}>%</Text>
                              <TextInput
                                style={styles.pctInput}
                                value={String(job.coordinatedTaxRate ?? "")}
                                onChangeText={(v) => update(job.id, { coordinatedTaxRate: v })}
                                keyboardType="decimal-pad"
                                placeholder="10"
                                placeholderTextColor={T.textPlaceholder}
                              />
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.helper}>
                            עבודה נוספת בלי תיאום מס: {flatPct}% מס הכנסה, בלי נקודות זיכוי.
                          </Text>
                        )}
                      </>
                    )}
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={styles.divider} />
        <TouchableOpacity style={styles.addBtn} onPress={add} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={18} color={T.accent} />
          <Text style={styles.addText}>הוסף עבודה</Text>
        </TouchableOpacity>
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
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
  },
  divider: { height: 1, backgroundColor: T.divider, marginRight: 12 },
  jobRow: { padding: 12, gap: 8 },
  jobRowEditing: { backgroundColor: T.accentLight },
  nameRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  nameInput: {
    flex: 1,
    color: T.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    backgroundColor: T.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inputError: { borderColor: T.red },
  errorText: { color: T.red, fontSize: 11, textAlign: "right" },
  switchRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { color: T.text, fontSize: 13, fontWeight: "600", textAlign: "right" },
  helper: { color: T.textSecondary, fontSize: 11, textAlign: "right" },
  pctBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: T.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 80,
  },
  suffix: { color: T.textSecondary, fontSize: 12, marginLeft: 6 },
  pctInput: {
    flex: 1,
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
  },
  addBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  addText: { color: T.accent, fontSize: 13, fontWeight: "700" },
});
