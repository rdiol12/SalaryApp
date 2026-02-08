import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { darkTheme as T } from "../../constants/theme.js";
import { Ionicons } from "@expo/vector-icons";
import { emptyTemplate } from "../../utils/validation.js";

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

export default function SettingsTemplates({ config, onEditTemplate }) {
  const templates = Array.isArray(config.shiftTemplates)
    ? config.shiftTemplates
    : [];

  return (
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
            onPress={() => onEditTemplate(t)}
            activeOpacity={0.7}
          >
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{t.name}</Text>
              <Text style={styles.templateMeta}>
                {t.startTime} - {t.endTime} · {t.type}
              </Text>
            </View>
            <Ionicons name="chevron-back" size={16} color={T.textMuted} />
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity
        style={styles.addTemplateBtn}
        onPress={() => onEditTemplate(emptyTemplate())}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={18} color={T.accent} />
        <Text style={styles.addTemplateText}>הוסף תבנית</Text>
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
});
