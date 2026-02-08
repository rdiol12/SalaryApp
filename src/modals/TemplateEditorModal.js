import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { darkTheme as T } from "../constants/theme";
import { emptyTemplate } from "../utils/validation";

const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={T.accent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

const SettingRow = ({
  label,
  value,
  onChange,
  keyboardType = "numeric",
  suffix,
  fullWidth,
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingText}>
      <Text style={styles.label}>{label}</Text>
    </View>
    <View style={[styles.valueWrap, fullWidth && styles.valueWrapFull]}>
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

export default function TemplateEditorModal({
  visible,
  template,
  onClose,
  onSave,
  onDelete,
}) {
  const [localTemplate, setLocalTemplate] = useState(
    template || emptyTemplate(),
  );
  const [picker, setPicker] = useState({ field: null, visible: false });
  const isIOS = Platform.OS === "ios";

  useEffect(() => {
    if (visible) setLocalTemplate(template || emptyTemplate());
  }, [visible, template]);

  const parseTimeToDate = (timeStr) => {
    const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
    const d = new Date();
    d.setHours(hh || 0, mm || 0, 0, 0);
    return d;
  };

  const formatTime = (d) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.headerBtnText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>תבנית משמרת</Text>
          <TouchableOpacity
            onPress={() => onSave(localTemplate)}
            activeOpacity={0.6}
          >
            <Text style={styles.headerBtnText}>שמור</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Section title="פרטי תבנית" icon="bookmark-outline">
            <SettingRow
              label="שם תבנית"
              value={localTemplate.name}
              onChange={(v) => setLocalTemplate({ ...localTemplate, name: v })}
              keyboardType="default"
              fullWidth
            />
            <View style={styles.cardDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.label}>סוג משמרת</Text>
              </View>
              <View style={styles.valueWrap}>
                <Picker
                  selectedValue={localTemplate.type}
                  onValueChange={(v) =>
                    setLocalTemplate({ ...localTemplate, type: v })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="עבודה" value="עבודה" />
                  <Picker.Item label="שבת" value="שבת" />
                  <Picker.Item label="מחלה" value="מחלה" />
                  <Picker.Item label="חופש" value="חופש" />
                </Picker>
              </View>
            </View>
          </Section>

          <Section title="זמנים" icon="time-outline">
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeBox}
                onPress={() => setPicker({ field: "start", visible: true })}
                activeOpacity={0.7}
              >
                <Text style={styles.timeLabel}>התחלה</Text>
                <Text style={styles.timeValue}>{localTemplate.startTime}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBox}
                onPress={() => setPicker({ field: "end", visible: true })}
                activeOpacity={0.7}
              >
                <Text style={styles.timeLabel}>סיום</Text>
                <Text style={styles.timeValue}>{localTemplate.endTime}</Text>
              </TouchableOpacity>
            </View>
          </Section>

          <Section title="שכר" icon="cash-outline">
            <SettingRow
              label="אחוז שכר"
              value={localTemplate.hourlyPercent}
              onChange={(v) =>
                setLocalTemplate({ ...localTemplate, hourlyPercent: v })
              }
              suffix="%"
            />
            <View style={styles.cardDivider} />
            <SettingRow
              label="בונוס"
              value={localTemplate.bonus}
              onChange={(v) => setLocalTemplate({ ...localTemplate, bonus: v })}
              suffix="₪"
            />
          </Section>

          <View style={styles.templateActions}>
            {!!template?.id && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDelete(template.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.deleteText}>מחיקת תבנית</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {picker.visible && (
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={parseTimeToDate(
                picker.field === "start"
                  ? localTemplate.startTime
                  : localTemplate.endTime,
              )}
              mode="time"
              is24Hour={true}
              display="spinner"
              textColor={T.text}
              onChange={(e, d) => {
                if (Platform.OS === "android") {
                  setPicker({ field: null, visible: false });
                  if (e.type === "set" && d) {
                    const timeStr = formatTime(d);
                    if (picker.field === "start")
                      setLocalTemplate({
                        ...localTemplate,
                        startTime: timeStr,
                      });
                    else
                      setLocalTemplate({ ...localTemplate, endTime: timeStr });
                  }
                  return;
                }
                if (!d) return;
                const timeStr = formatTime(d);
                if (picker.field === "start")
                  setLocalTemplate({ ...localTemplate, startTime: timeStr });
                else setLocalTemplate({ ...localTemplate, endTime: timeStr });
              }}
            />
            {isIOS && (
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={() => setPicker({ field: null, visible: false })}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerDoneText}>סיום</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.accent,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
  },
  cardDivider: {
    height: 1,
    backgroundColor: T.divider,
    marginRight: 12,
  },
  label: {
    color: T.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  settingRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  settingText: {
    flex: 1,
    alignItems: "flex-end",
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
  valueWrapFull: {
    flex: 1,
    justifyContent: "space-between",
  },
  suffix: {
    color: T.textSecondary,
    fontSize: 12,
    marginLeft: 6,
  },
  input: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
    minWidth: 60,
  },
  inputFull: {
    flex: 1,
  },
  templateActions: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  deleteBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.red,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row-reverse",
    gap: 8,
    padding: 12,
  },
  timeBox: {
    flex: 1,
    backgroundColor: T.cardBgElevated,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  timeLabel: {
    color: T.textSecondary,
    fontSize: 11,
  },
  timeValue: {
    color: T.accent,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  picker: {
    width: 120,
    color: T.accent,
  },
  pickerSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: T.cardBg,
    borderTopLeftRadius: T.radiusMd,
    borderTopRightRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  pickerDone: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: T.divider,
    backgroundColor: T.cardBg,
  },
  pickerDoneText: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
  },
});
