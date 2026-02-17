import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { backupData } from "../../utils/exportUtils.js";
import { darkTheme as T } from "../../constants/theme.js";

export default function DataManagement({ config, shifts, onRestore }) {
  const handleBackup = async () => {
    try {
      const data = {
        config,
        shifts,
        timestamp: Date.now(),
        version: 1,
      };
      await backupData(data);
    } catch (e) {
      Alert.alert("שגיאה", "הגיבוי נכשל");
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "public.json", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets ? result.assets[0] : result;
      const content = await FileSystem.readAsStringAsync(file.uri);
      const data = JSON.parse(content);

      if (!data.config || !data.shifts) {
        Alert.alert("שגיאה", "הקובץ אינו קובץ גיבוי תקין של SalaryApp");
        return;
      }

      Alert.alert(
        "שחזור נתונים",
        "האם את/ה בטוח/ה? כל הנתונים הנוכחיים יימחקו.",
        [
          { text: "ביטול", style: "cancel" },
          {
            text: "שחזר",
            style: "destructive",
            onPress: () => {
              onRestore(data);
              Alert.alert("הצלחה", "הנתונים שוחזרו בהצלחה");
            },
          },
        ],
      );
    } catch (e) {
      console.error(e);
      Alert.alert("שגיאה", "שחזור נכשל");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ניהול נתונים</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, styles.backupBtn]}
          onPress={handleBackup}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={T.accent} />
          <Text style={styles.btnText}>גיבוי נתונים</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.restoreBtn]}
          onPress={handleRestore}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-download-outline" size={20} color={T.red} />
          <Text style={[styles.btnText, { color: T.red }]}>שחזור נתונים</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>
        גיבוי יוצר קובץ שניתן לשמור ב-WhatsApp או ב-Drive. שחזור ידרוס את כל
        הנתונים הקיימים באפליקציה.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: T.divider,
    marginTop: 16,
  },
  sectionTitle: {
    color: T.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "right",
  },
  row: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBgElevated,
    gap: 8,
  },
  backupBtn: {
    borderColor: T.accent,
  },
  restoreBtn: {
    borderColor: T.red,
  },
  btnText: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  infoText: {
    color: T.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
  },
});
