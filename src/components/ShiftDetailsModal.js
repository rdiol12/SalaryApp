import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { darkTheme as T } from "../constants/theme.js";
import { parseDateLocal, formatDateLocal } from "../utils/shiftFilters.js";
import TimePickerSection from "./shift/TimePickerSection.js";
import EarningsBreakdown from "./shift/EarningsBreakdown.js";

import {
  TYPE_WORK,
  TYPE_SABBATH,
  TYPE_SICK,
  TYPE_VACATION,
  SHIFT_TYPES,
  PRESETS,
  isTimedShift,
  computeTotalHours,
  applyPreset,
  applyTemplate,
} from "../utils/shiftUtils.js";

export default function ShiftDetailsModal({
  visible,
  date,
  existingData,
  onSave,
  onClose,
  onDuplicate,
  templates = [],
  config,
}) {
  const [shift, setShift] = useState({
    startTime: "08:00",
    endTime: "17:00",
    totalHours: "9.00",
    type: TYPE_WORK,
    bonus: "0",
    notes: "",
    hourlyPercent: "100",
  });
  const [localDate, setLocalDate] = useState(new Date());
  const [receiptImage, setReceiptImage] = useState(null);
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });
  const [dupPickerVisible, setDupPickerVisible] = useState(false);
  const [dupDateDraft, setDupDateDraft] = useState(null);

  const isIOS = Platform.OS === "ios";
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["92%"], []);

  useEffect(() => {
    if (existingData) {
      const baseType = existingData.type || TYPE_WORK;
      if (baseType === TYPE_SICK || baseType === TYPE_VACATION) {
        setShift({
          ...existingData,
          type: baseType,
          startTime: "08:00",
          endTime: "16:00",
          totalHours: "8.00",
        });
      } else {
        const startTime = existingData.startTime || "08:00";
        const endTime = existingData.endTime || "17:00";
        const totalHours =
          computeTotalHours(startTime, endTime) ||
          existingData.totalHours ||
          "0.00";
        setShift({ ...existingData, startTime, endTime, totalHours });
      }
      setReceiptImage(existingData.receiptImage || null);
    } else {
      const totalHours = computeTotalHours("08:00", "17:00");
      setShift({
        startTime: "08:00",
        endTime: "17:00",
        totalHours,
        type: TYPE_WORK,
        bonus: "0",
        notes: "",
        hourlyPercent: "100",
      });
    }
    setLocalDate(date ? parseDateLocal(date) : new Date());
  }, [visible, existingData, date]);

  useEffect(() => {
    if (!dupPickerVisible) setDupDateDraft(null);
  }, [dupPickerVisible]);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const handleSave = () => {
    const totalHours = isTimedShift(shift.type)
      ? computeTotalHours(shift.startTime, shift.endTime) ||
        shift.totalHours ||
        "0.00"
      : "8.00";
    const finalDate = formatDateLocal(localDate);
    onSave(finalDate, { ...shift, totalHours, receiptImage });
  };

  const handleApplyPreset = (preset) => {
    setShift(applyPreset(preset, shift));
  };

  const handleApplyTemplate = (tpl) => {
    setShift(applyTemplate(tpl, shift));
  };

  const handleDuplicateDate = (d) => {
    if (!d) return;
    const target = formatDateLocal(d);
    onDuplicate?.(target, shift);
    setDupPickerVisible(false);
  };

  const onTimeChange = (e, d) => {
    if (Platform.OS === "android") {
      setShowPicker({ field: null, visible: false });
      if (e.type === "set" && d) {
        if (showPicker.field === "date") {
          setLocalDate(d);
        } else {
          const timeStr = formatTime(d);
          const next =
            showPicker.field === "startTime"
              ? { ...shift, startTime: timeStr }
              : { ...shift, endTime: timeStr };
          next.totalHours =
            computeTotalHours(next.startTime, next.endTime) || next.totalHours;
          setShift(next);
        }
      }
      return;
    }
    if (!d) return;
    if (showPicker.field === "date") {
      setLocalDate(d);
    } else {
      const timeStr = formatTime(d);
      const next =
        showPicker.field === "startTime"
          ? { ...shift, startTime: timeStr }
          : { ...shift, endTime: timeStr };
      next.totalHours =
        computeTotalHours(next.startTime, next.endTime) || next.totalHours;
      setShift(next);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("סליחה, אנחנו זקוקים לגישה לגלריה כדי להעלות קבלה.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
  };

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
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBtn}
            activeOpacity={0.6}
          >
            <Text style={styles.cancelText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>פרטי משמרת</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerBtn}
            activeOpacity={0.6}
          >
            <Text style={styles.saveText}>שמור</Text>
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => setShowPicker({ field: "date", visible: true })}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={16} color={T.accent} />
            <Text style={styles.dateText}>
              {formatDisplayDate(formatDateLocal(localDate))}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={T.textSecondary}
              style={{ marginRight: "auto" }}
            />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>סוג משמרת</Text>
          <TouchableOpacity
            style={styles.typeSelect}
            onPress={() => setShowPicker({ field: "type", visible: true })}
            activeOpacity={0.7}
          >
            <View style={styles.typeSelectContent}>
              <Ionicons
                name={
                  (
                    SHIFT_TYPES.find((t) => t.value === shift.type) ||
                    SHIFT_TYPES[0]
                  ).icon
                }
                size={16}
                color={
                  (
                    SHIFT_TYPES.find((t) => t.value === shift.type) ||
                    SHIFT_TYPES[0]
                  ).color
                }
              />
              <Text style={styles.typeSelectText}>{shift.type}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={T.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>זמני עבודה</Text>
          {isTimedShift(shift.type) ? (
            <TimePickerSection
              shift={shift}
              date={formatDateLocal(localDate)}
              isIOS={isIOS}
              showPicker={showPicker}
              setShowPicker={setShowPicker}
              onTimeChange={onTimeChange}
              presets={PRESETS}
              templates={templates}
              onApplyPreset={handleApplyPreset}
              onApplyTemplate={handleApplyTemplate}
            />
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                {shift.type === TYPE_VACATION
                  ? "חופשה מחושבת כברירת מחדל כ-8 שעות."
                  : "מחלה מחושבת לפי חוק (יום 1: 0%, יום 2: 50%, יום 3 ומעלה: 100%)."}
              </Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>סה״כ שעות</Text>
          <View style={styles.card}>
            <Text style={styles.totalHoursText}>{shift.totalHours}</Text>
          </View>

          <EarningsBreakdown shift={shift} config={config} />

          <Text style={styles.sectionLabel}>תעריף (אחוז שכר)</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.inputFull}
              value={shift.hourlyPercent}
              onChangeText={(v) => setShift({ ...shift, hourlyPercent: v })}
              keyboardType="numeric"
              placeholder="100"
              placeholderTextColor={T.textPlaceholder}
            />
          </View>

          <Text style={styles.sectionLabel}>תוספות ובונוסים</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.inputFull}
              value={shift.bonus}
              onChangeText={(v) => setShift({ ...shift, bonus: v })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={T.textPlaceholder}
            />
          </View>

          <Text style={styles.sectionLabel}>הערות</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              value={shift.notes}
              onChangeText={(v) => setShift({ ...shift, notes: v })}
              multiline
              placeholder="הערות למשמרת..."
              placeholderTextColor={T.textPlaceholder}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.dupRow}>
            <TouchableOpacity
              style={styles.dupBtn}
              onPress={() => setDupPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color={T.accent} />
              <Text style={styles.dupText}>שכפל משמרת</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>קבלה / הוצאה</Text>
          <View style={styles.card}>
            {receiptImage ? (
              <View style={styles.receiptContainer}>
                <Animated.Image
                  source={{ uri: receiptImage }}
                  style={styles.receiptImage}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={24} color={T.red} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addReceiptBtn}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={24} color={T.accent} />
                <Text style={styles.addReceiptText}>
                  צרף צילום קבלה (מונית וכו׳)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>

        {showPicker.visible && showPicker.field === "date" && (
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={localDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
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

        {showPicker.visible && showPicker.field === "type" && (
          <View style={styles.pickerSheet}>
            <Picker
              selectedValue={shift.type}
              onValueChange={(v) => {
                if (Platform.OS === "ios") Haptics.selectionAsync();
                if (v === TYPE_SICK || v === TYPE_VACATION) {
                  setShift((prev) => ({
                    ...prev,
                    type: v,
                    startTime: "08:00",
                    endTime: "16:00",
                    totalHours: "8.00",
                  }));
                } else {
                  setShift((prev) => ({ ...prev, type: v }));
                }
                if (Platform.OS === "android")
                  setShowPicker({ field: null, visible: false });
              }}
              style={styles.pickerSheetPicker}
            >
              {SHIFT_TYPES.map((t) => (
                <Picker.Item key={t.value} label={t.value} value={t.value} />
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

        {dupPickerVisible && (
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={dupDateDraft || parseDateLocal(date)}
              mode="date"
              display="spinner"
              textColor={T.text}
              onChange={(e, d) => {
                if (Platform.OS === "android") {
                  setDupPickerVisible(false);
                  if (e.type === "set" && d) handleDuplicateDate(d);
                  return;
                }
                if (d) setDupDateDraft(d);
              }}
            />
            {isIOS && (
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={() => {
                  if (dupDateDraft) handleDuplicateDate(dupDateDraft);
                  else setDupPickerVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerDoneText}>סיום</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </BottomSheetModal>
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
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  saveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  dateCard: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    color: T.text,
    fontSize: 15,
    fontWeight: "600",
  },
  sectionLabel: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 16,
    textAlign: "right",
  },
  typeSelect: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.inputBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeSelectContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  typeSelectText: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  inputFull: {
    color: T.text,
    padding: 12,
    fontSize: 15,
    textAlign: "right",
  },
  totalHoursText: {
    color: T.text,
    padding: 12,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  notesInput: {
    color: T.text,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlign: "right",
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
  dupRow: {
    marginTop: 12,
    alignItems: "center",
  },
  dupBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
  },
  dupText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  addReceiptBtn: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addReceiptText: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  receiptContainer: {
    padding: 12,
    alignItems: "center",
  },
  receiptImage: {
    width: "100%",
    height: 200,
    borderRadius: T.radiusMd,
    backgroundColor: T.bg,
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "transparent",
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
