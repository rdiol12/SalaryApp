import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { darkTheme as T } from "../constants/theme";
import { parseDateLocal } from "../utils/shiftFilters";
import TimePickerSection from "./shift/TimePickerSection";

const PRESETS = [
  { label: "בוקר", start: "08:00", end: "16:00" },
  { label: "רגיל", start: "08:00", end: "17:00" },
  { label: "ערב", start: "16:00", end: "00:00" },
];

const TYPE_WORK = "עבודה";
const TYPE_SABBATH = "שבת";
const TYPE_SICK = "מחלה";
const TYPE_VACATION = "חופש";

const SHIFT_TYPES = [
  { label: TYPE_WORK, value: TYPE_WORK },
  { label: TYPE_SABBATH, value: TYPE_SABBATH },
  { label: TYPE_SICK, value: TYPE_SICK },
  { label: TYPE_VACATION, value: TYPE_VACATION },
];

export default function AddShiftModal({
  visible,
  date,
  onSave,
  onClose,
  templates = [],
}) {
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [shiftType, setShiftType] = useState(TYPE_WORK);
  const [bonus, setBonus] = useState("0");
  const [hourlyPercent, setHourlyPercent] = useState("100");
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });
  const isIOS = Platform.OS === "ios";
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["88%"], []);

  useEffect(() => {
    if (!visible) return;
    setStartTime("08:00");
    setEndTime("17:00");
    setShiftType(TYPE_WORK);
    setBonus("0");
    setHourlyPercent("100");
  }, [visible, date]);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handleTimeChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowPicker({ field: null, visible: false });
    }

    if (event.type === "dismissed") return;

    if (selectedDate) {
      const timeStr = selectedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      if (showPicker.field === "startTime") {
        setStartTime(timeStr);
      } else {
        setEndTime(timeStr);
      }
    }
  };

  const applyPreset = (preset) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const applyTemplate = (tpl) => {
    const nextType = tpl.type || TYPE_WORK;
    setShiftType(nextType);
    if (nextType === TYPE_SICK || nextType === TYPE_VACATION) {
      applyNonTimedDefaults();
    } else {
      setStartTime(tpl.startTime);
      setEndTime(tpl.endTime);
    }
    setBonus(tpl.bonus || "0");
    setHourlyPercent(tpl.hourlyPercent || "100");
  };

  const applyNonTimedDefaults = () => {
    setStartTime("08:00");
    setEndTime("16:00");
  };

  const isTimedShift = shiftType === TYPE_WORK || shiftType === TYPE_SABBATH;

  const calculateAndSave = () => {
    // Calculate total hours from strings
    const base = date ? parseDateLocal(date) : new Date();

    const [sh, sm] = startTime.split(":").map(Number);
    const start = new Date(base);
    start.setHours(sh, sm, 0, 0);

    const [eh, em] = endTime.split(":").map(Number);
    const end = new Date(base);
    end.setHours(eh, em, 0, 0);

    if (end <= start) end.setDate(end.getDate() + 1);

    let diff = isTimedShift ? (end - start) / (1000 * 60 * 60) : 8;
    if (diff < 0) diff += 24;

    onSave(date, {
      type: shiftType,
      startTime,
      endTime,
      totalHours: Number(diff || 0).toFixed(2),
      bonus: bonus || "0",
      notes: "",
      hourlyPercent: hourlyPercent || "100",
    });
  };

  // Mock shift object for TimePickerSection
  const shiftData = { startTime, endTime };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.cancelText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>הוספת משמרת</Text>
          <TouchableOpacity onPress={calculateAndSave} activeOpacity={0.6}>
            <Text style={styles.saveTextTop}>הוסף</Text>
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>פרטי יום העבודה - {date}</Text>

          <View style={styles.card}>
            <View style={styles.pickerRow}>
              <Text style={styles.label}>סוג משמרת</Text>
              <TouchableOpacity
                style={styles.typeSelect}
                onPress={() => setShowPicker({ field: "type", visible: true })}
                activeOpacity={0.7}
              >
                <Text style={styles.typeValue}>{shiftType}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>בונוס / טיפים (₪)</Text>
              <View style={styles.inputBoxFull}>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  value={bonus}
                  onChangeText={setBonus}
                  placeholder="0"
                  placeholderTextColor={T.textPlaceholder}
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>זמנים</Text>
          {isTimedShift ? (
            <TimePickerSection
              shift={shiftData}
              date={date}
              isIOS={isIOS}
              showPicker={showPicker}
              setShowPicker={setShowPicker}
              onTimeChange={handleTimeChange}
              presets={PRESETS}
              templates={templates}
              onApplyPreset={applyPreset}
              onApplyTemplate={applyTemplate}
            />
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                {shiftType === TYPE_VACATION
                  ? "חופשה מחושבת כברירת מחדל כ-8 שעות."
                  : "מחלה מחושבת לפי חוק (יום 1: 0%, יום 2: 50%, יום 3 ומעלה: 100%)."}
              </Text>
            </View>
          )}

          {showPicker.visible && showPicker.field === "type" && (
            <View style={styles.pickerSheet}>
              <Picker
                selectedValue={shiftType}
                onValueChange={(v) => {
                  setShiftType(v);
                  if (v === TYPE_SICK || v === TYPE_VACATION)
                    applyNonTimedDefaults();
                  if (Platform.OS === "android")
                    setShowPicker({ field: null, visible: false });
                }}
                style={styles.pickerSheetPicker}
              >
                {SHIFT_TYPES.map((t) => (
                  <Picker.Item key={t.value} label={t.label} value={t.value} />
                ))}
              </Picker>
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

          <View style={{ height: 30 }} />
        </BottomSheetScrollView>
      </SafeAreaView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: T.accent,
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  saveTextTop: { color: "#fff", fontSize: 15, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 24 },
  sectionLabel: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 16,
    textAlign: "right",
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
  },
  inputGroup: { padding: 12, gap: 8 },
  inputLabel: {
    color: T.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  label: { color: T.text, fontSize: 14 },
  inputBoxFull: {
    backgroundColor: T.inputBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  inputField: {
    color: T.accent,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
  },
  divider: { height: 1, backgroundColor: T.divider, marginLeft: 12 },
  pickerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 46,
  },
  typeSelect: {
    minWidth: 120,
    backgroundColor: T.inputBg,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  typeValue: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  pickerSheet: {
    marginTop: 8,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  pickerSheetPicker: {
    color: T.accent,
  },
  infoCard: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
  },
  infoText: {
    color: T.textSecondary,
    fontSize: 12,
    textAlign: "right",
    lineHeight: 18,
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
  sheetBackground: {
    backgroundColor: T.bg,
  },
  sheetHandle: {
    backgroundColor: T.textMuted,
    width: 60,
  },
});
