import React from "react";
import { View, StyleSheet, TextInput, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";

export default function SettingsProfile({ config, onChange, errors }) {
  return (
    <View style={styles.container}>
      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={T.gradients.accent}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="person" size={40} color="#fff" />
        </LinearGradient>
        <Text style={styles.displayName}>
          {config.userName ? config.userName : "שם עובד"}
        </Text>
        <Text style={styles.displaySub}>לחץ לשינוי הפרופיל</Text>
      </View>

      {/* Name input card */}
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={16} color={T.accent} style={styles.inputIcon} />
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>שם מלא</Text>
            <TextInput
              style={[styles.textInput, errors.userName && styles.inputError]}
              value={config.userName || ""}
              onChangeText={(v) => onChange("userName", v)}
              placeholder="הכנס שם..."
              placeholderTextColor={T.textPlaceholder}
              keyboardType="default"
              textAlign="right"
            />
          </View>
        </View>
        {errors.userName ? (
          <Text style={styles.errorText}>{errors.userName}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: T.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  displayName: {
    color: T.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  displaySub: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  inputIcon: {
    marginLeft: 4,
  },
  inputWrapper: {
    flex: 1,
    alignItems: "flex-end",
  },
  inputLabel: {
    color: T.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "right",
  },
  textInput: {
    color: T.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 4,
  },
  inputError: {
    borderBottomColor: T.red,
  },
  errorText: {
    color: T.red,
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
  },
});
