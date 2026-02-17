import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";

const MODULES = [
  { key: "calendar", label: "לוח שנה", icon: "calendar-outline" },
  { key: "list", label: "רשימת משמרות", icon: "list-outline" },
  { key: "stats", label: "סטטיסטיקות חודשיות", icon: "bar-chart-outline" },
  { key: "yearly", label: "סטטיסטיקות שנתיות", icon: "trophy-outline" },
];

const VIEWS = [
  { key: "calendar", label: "לוח שנה", icon: "calendar-outline" },
  { key: "list", label: "רשימה", icon: "list-outline" },
  { key: "stats", label: "חודשי", icon: "bar-chart-outline" },
  { key: "yearly", label: "שנתי", icon: "trophy-outline" },
];

export default function SettingsModules({ config, onChange }) {
  const enabledModules = config.enabledModules || {};
  const defaultView = config.defaultView || "calendar";

  const toggleModule = (key) => {
    // Must keep at least one module enabled
    const current = { ...enabledModules, [key]: !enabledModules[key] };
    const enabledCount = Object.values(current).filter(Boolean).length;
    if (enabledCount === 0) return; // can't disable all

    onChange("enabledModules", current);

    // If we disabled the default view, switch default to first enabled
    if (key === defaultView && !current[key]) {
      const first = VIEWS.find((v) => current[v.key]);
      if (first) onChange("defaultView", first.key);
    }
  };

  return (
    <View>
      {/* Default start view */}
      <View style={styles.section}>
        <Text style={styles.groupTitle}>מסך פתיחה</Text>
        <View style={styles.card}>
          {VIEWS.filter((v) => enabledModules[v.key] !== false).map((v, i, arr) => (
            <View key={v.key}>
              <TouchableOpacity
                style={styles.viewRow}
                onPress={() => onChange("defaultView", v.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    defaultView === v.key
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={defaultView === v.key ? T.accent : T.textSecondary}
                />
                <Ionicons
                  name={v.icon}
                  size={16}
                  color={defaultView === v.key ? T.accent : T.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.viewLabel,
                    defaultView === v.key && styles.viewLabelActive,
                  ]}
                >
                  {v.label}
                </Text>
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      {/* Module toggles */}
      <View style={styles.section}>
        <Text style={styles.groupTitle}>מודולים פעילים</Text>
        <View style={styles.card}>
          {MODULES.map((m, i) => {
            const enabled = enabledModules[m.key] !== false;
            const enabledCount = Object.values(enabledModules).filter(Boolean).length;
            const isLast = !enabled || enabledCount <= 1;
            return (
              <View key={m.key}>
                <View style={styles.moduleRow}>
                  <Switch
                    value={enabled}
                    onValueChange={() => toggleModule(m.key)}
                    trackColor={{ false: T.border, true: T.green }}
                    thumbColor="#fff"
                    disabled={enabled && isLast}
                  />
                  <View style={styles.moduleInfo}>
                    <Ionicons
                      name={m.icon}
                      size={16}
                      color={enabled ? T.accent : T.textMuted}
                    />
                    <Text
                      style={[
                        styles.moduleLabel,
                        !enabled && styles.moduleLabelDisabled,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </View>
                </View>
                {i < MODULES.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>
        <Text style={styles.hint}>לפחות מודול אחד חייב להישאר פעיל</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 8 },
  groupTitle: {
    color: T.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  divider: { height: 1, backgroundColor: T.divider, marginRight: 12 },

  // Default view selector
  viewRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  viewLabel: {
    flex: 1,
    color: T.text,
    fontSize: 14,
    textAlign: "right",
  },
  viewLabelActive: {
    color: T.accent,
    fontWeight: "700",
  },

  // Module toggles
  moduleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  moduleInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  moduleLabel: {
    color: T.text,
    fontSize: 14,
  },
  moduleLabelDisabled: {
    color: T.textMuted,
  },
  hint: {
    color: T.textMuted,
    fontSize: 11,
    textAlign: "right",
    marginTop: 6,
  },
});
