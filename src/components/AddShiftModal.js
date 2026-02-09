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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { darkTheme as T } from "../constants/theme.js";
import { parseDateLocal, formatDateLocal } from "../utils/shiftFilters.js";
import TimePickerSection from "./shift/TimePickerSection.js";

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

export default function AddShiftModal({
  visible,
  date,
  onSave,
  onClose,
  templates = [],
  presets = PRESETS,
}) {
  const [shift, setShift] = useState({
    startTime: "08:00",
    endTime: "17:00",
    type: TYPE_WORK,
    bonus: "0",
    hourlyPercent: "100",
    totalHours: "9.00",
  });

  const [internalDate, setInternalDate] = useState(new Date());
  const [receiptImage, setReceiptImage] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });
  const isIOS = Platform.OS === "ios";
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["88%"], []);

  useEffect(() => {
    if (!visible) return;
    setShift({
      startTime: "08:00",
      endTime: "17:00",
      type: TYPE_WORK,
      bonus: "0",
      hourlyPercent: "100",
      totalHours: "9.00",
    });
    setReceiptImage(null);
    setAttachedFile(null);
    setInternalDate(date ? parseDateLocal(date) : new Date());
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
      if (showPicker.field === "date") {
        setInternalDate(selectedDate);
      } else {
        const timeStr = selectedDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const field = showPicker.field;
        const next = { ...shift, [field]: timeStr };
        if (field === "startTime" || field === "endTime") {
          next.totalHours = computeTotalHours(next.startTime, next.endTime);
        }
        setShift(next);
      }
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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachedFile({ uri: file.uri, name: file.name || "document.pdf" });
      }
    } catch (e) {
      alert("שגיאה בבחירת הקובץ");
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
  };

  const handleApplyPreset = (preset) => {
    setShift(applyPreset(preset, shift));
  };

  const handleApplyTemplate = (tpl) => {
    setShift(applyTemplate(tpl, shift));
  };

  const calculateAndSave = () => {
    const totalHours = isTimedShift(shift.type)
      ? computeTotalHours(shift.startTime, shift.endTime)
      : "8.00";

    const dateStr = formatDateLocal(internalDate);

    onSave(dateStr, {
      ...shift,
      totalHours: Number(totalHours).toFixed(2),
      notes: "",
      receiptImage,
      attachedFile,
    });
  };

  // Adapter for TimePickerSection which expects 'shift' object
  const shiftData = shift;

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
          <Text style={styles.sectionLabel}>פרטי יום העבודה</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.datePickerRow}
              onPress={() => setShowPicker({ field: "date", visible: true })}
              activeOpacity={0.7}
            >
              <Text style={styles.label}>תאריך המשמרת</Text>
              <View style={styles.dateDisplay}>
                <Text style={styles.dateValue}>
                  {formatDateLocal(internalDate)}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.pickerRow}>
              <Text style={styles.label}>סוג משמרת</Text>
              <TouchableOpacity
                style={styles.typeSelect}
                onPress={() => setShowPicker({ field: "type", visible: true })}
                activeOpacity={0.7}
              >
                <Text style={styles.typeValue}>{shift.type}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>בונוס / טיפים (₪)</Text>
              <View style={styles.inputBoxFull}>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  value={shift.bonus}
                  onChangeText={(v) => setShift({ ...shift, bonus: v })}
                  placeholder="0"
                  placeholderTextColor={T.textPlaceholder}
                />
              </View>
            </View>
          </View>

          {showPicker.visible && showPicker.field === "date" && (
            <DateTimePicker
              value={internalDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
          )}

          {showPicker.visible && showPicker.field === "type" && (
            <View style={styles.pickerSheet}>
              <Picker
                selectedValue={shift.type}
                onValueChange={(v) => {
                  if (Platform.OS === "ios") Haptics.selectionAsync();
                  setShift((prev) => ({ ...prev, type: v }));
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

          <Text style={styles.sectionLabel}>זמנים</Text>
          {isTimedShift(shift.type) ? (
            <TimePickerSection
              shift={shiftData}
              date={date}
              isIOS={isIOS}
              showPicker={showPicker}
              setShowPicker={setShowPicker}
              onTimeChange={handleTimeChange}
              presets={presets}
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

          <Text style={styles.sectionLabel}>קבלה / צרופות</Text>
          <View style={styles.card}>
            {receiptImage ? (
              <View style={styles.receiptContainer}>
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={24} color={T.red} />
                </TouchableOpacity>
                <View style={styles.receiptPreview}>
                  <Ionicons name="image-outline" size={16} color={T.accent} />
                  <Text style={styles.receiptText}>תמונה צורפה בהצלחה</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addReceiptBtn}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={20} color={T.accent} />
                <Text style={styles.addReceiptText}>צרף צילום קבלה</Text>
              </TouchableOpacity>
            )}

            <View style={styles.attachDivider} />

            {attachedFile ? (
              <View style={styles.receiptContainer}>
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={removeFile}
                >
                  <Ionicons name="close-circle" size={24} color={T.red} />
                </TouchableOpacity>
                <View style={styles.receiptPreview}>
                  <Ionicons name="document-outline" size={16} color={T.red} />
                  <Text style={styles.receiptText} numberOfLines={1}>
                    {attachedFile.name}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addReceiptBtn}
                onPress={pickDocument}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="document-attach-outline"
                  size={20}
                  color={T.accent}
                />
                <Text style={styles.addReceiptText}>צרף קובץ PDF</Text>
              </TouchableOpacity>
            )}
          </View>

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
  datePickerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 46,
  },
  dateDisplay: {
    backgroundColor: T.inputBg,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: T.border,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  dateValue: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
  },
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
  addReceiptBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
  },
  addReceiptText: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  receiptContainer: {
    padding: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  receiptPreview: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  receiptText: {
    color: T.green,
    fontSize: 13,
    fontWeight: "600",
  },
  attachDivider: {
    height: 1,
    backgroundColor: T.divider,
    marginHorizontal: 12,
  },
  removeImageBtn: {
    padding: 4,
  },
});
