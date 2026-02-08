import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { darkTheme as T } from "../../constants/theme";
import { parseDateLocal } from "../../utils/shiftFilters";

/**
 * Time picker section for shift start and end times.
 */
export default function TimePickerSection({
  shift,
  date,
  isIOS,
  showPicker,
  setShowPicker,
  onTimeChange,
  presets,
  templates,
  onApplyPreset,
  onApplyTemplate,
}) {
  const parseTimeToDate = (dateStr, timeStr) => {
    const base = dateStr ? parseDateLocal(dateStr) : new Date();
    const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
    const next = new Date(base);
    next.setHours(hh || 0, mm || 0, 0, 0);
    return next;
  };

  const getPickerValue = () => {
    const timeStr =
      showPicker.field === "startTime" ? shift.startTime : shift.endTime;
    return parseTimeToDate(date, timeStr);
  };

  return (
    <>
      <View style={styles.presetRow}>
        {presets.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={styles.presetBtn}
            onPress={() => onApplyPreset(p)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetText}>{p.label}</Text>
            <Text style={styles.presetSub}>
              {p.start} - {p.end}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {templates.length > 0 && (
        <View style={styles.templatesRow}>
          {templates.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.templateBtn}
              onPress={() => onApplyTemplate(t)}
              activeOpacity={0.7}
            >
              <Text style={styles.templateText}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.timeRow}>
          <View style={styles.timeInput}>
            <Text style={styles.timeLabel}>זמן התחלה</Text>
            <TouchableOpacity
              style={styles.timeSelect}
              onPress={() =>
                setShowPicker({ field: "startTime", visible: true })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.timeValue}>{shift.startTime}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timeInput}>
            <Text style={styles.timeLabel}>זמן סיום</Text>
            <TouchableOpacity
              style={styles.timeSelect}
              onPress={() => setShowPicker({ field: "endTime", visible: true })}
              activeOpacity={0.7}
            >
              <Text style={styles.timeValue}>{shift.endTime}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showPicker.visible && (
        <View style={styles.pickerSheet}>
          <DateTimePicker
            value={getPickerValue()}
            mode="time"
            is24Hour={true}
            display="spinner"
            textColor={T.text}
            onChange={onTimeChange}
          />
          {isIOS && (
            <TouchableOpacity
              style={styles.pickerDone}
              onPress={() => setShowPicker({ field: null, visible: false })}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerDoneText}>סיום</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  timeRow: {
    flexDirection: "row-reverse",
    gap: 10,
    padding: 12,
  },
  presetRow: {
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusSm,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
    alignItems: "center",
  },
  presetText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  presetSub: {
    color: T.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  templatesRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  templateBtn: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusSm,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  templateText: {
    color: T.text,
    fontSize: 12,
    fontWeight: "600",
  },
  timeInput: {
    flex: 1,
    backgroundColor: T.cardBgElevated,
    borderRadius: T.radiusSm,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  timeLabel: {
    color: T.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  timeSelect: {
    width: "100%",
    alignItems: "center",
  },
  timeValue: {
    color: T.accent,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  pickerSheet: {
    marginTop: 8,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
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
