import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
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
  formatTime,
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
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

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
        <LinearGradient
          colors={T.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>פרטי משמרת</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
            <Text style={styles.saveText}>שמור</Text>
          </TouchableOpacity>
        </LinearGradient>

        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>פרטי יום העבודה</Text>
            <TouchableOpacity
              style={styles.card}
              onPress={() => setShowPicker({ field: "date", visible: true })}
              activeOpacity={0.7}
            >
              <View style={styles.cardItem}>
                <Ionicons name="calendar-outline" size={18} color={T.accent} />
                <Text style={styles.cardValue}>
                  {formatDateLocal(localDate)}
                </Text>
                <Text style={styles.cardLabel}>תאריך</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => setShowPicker({ field: "type", visible: true })}
              activeOpacity={0.7}
            >
              <View style={styles.cardItem}>
                <Ionicons name="bookmark-outline" size={18} color={T.accent} />
                <Text style={styles.cardValue}>{shift.type}</Text>
                <Text style={styles.cardLabel}>סוג</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
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
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>פירוט שכר</Text>
            <EarningsBreakdown shift={shift} config={config} />

            <View style={styles.inputRow}>
              <View style={styles.inputBox}>
                <Text style={styles.miniLabel}>תעריף %</Text>
                <TextInput
                  style={styles.textInput}
                  value={shift.hourlyPercent}
                  onChangeText={(v) => setShift({ ...shift, hourlyPercent: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.miniLabel}>בונוס</Text>
                <TextInput
                  style={styles.textInput}
                  value={shift.bonus}
                  onChangeText={(v) => setShift({ ...shift, bonus: v })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>הערות מהשטח</Text>
            <View style={styles.notesCard}>
              <TextInput
                style={styles.notesInput}
                value={shift.notes}
                onChangeText={(v) => setShift({ ...shift, notes: v })}
                multiline
                placeholder="כתוב הערות למשמרת..."
                placeholderTextColor={T.textMuted}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dupBtn}
              onPress={() => setDupPickerVisible(true)}
            >
              <Ionicons name="copy-outline" size={16} color={T.accent} />
              <Text style={styles.dupText}>שכפל משמרת לתאריך אחר</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>קבלה / הוצאה</Text>
            {receiptImage ? (
              <View style={styles.receiptFrame}>
                <Animated.Image
                  source={{ uri: receiptImage }}
                  style={styles.receipt}
                />
                <TouchableOpacity
                  style={styles.removeImg}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={26} color={T.red} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addReceipt} onPress={pickImage}>
                <Ionicons name="camera" size={24} color={T.accent} />
                <Text style={styles.addReceiptText}>צרף צילום קבלה</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 60 }} />
        </BottomSheetScrollView>

        {showPicker.visible &&
          (showPicker.field === "date" || showPicker.field === "type") && (
            <View style={styles.pickerOverlay}>
              <BlurView
                intensity={90}
                tint="light"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.pickerContent}>
                {showPicker.field === "date" ? (
                  <DateTimePicker
                    value={localDate}
                    mode="date"
                    display="spinner"
                    onChange={onTimeChange}
                  />
                ) : (
                  <Picker
                    selectedValue={shift.type}
                    onValueChange={(v) => {
                      Haptics.selectionAsync();
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
                    }}
                  >
                    {SHIFT_TYPES.map((t) => (
                      <Picker.Item
                        key={t.value}
                        label={t.label}
                        value={t.value}
                      />
                    ))}
                  </Picker>
                )}
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => setShowPicker({ field: null, visible: false })}
                >
                  <Text style={styles.doneBtnText}>סיום</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {dupPickerVisible && (
          <View style={styles.pickerOverlay}>
            <BlurView
              intensity={90}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.pickerContent}>
              <DateTimePicker
                value={dupDateDraft || localDate}
                mode="date"
                display="spinner"
                onChange={(e, d) => d && setDupDateDraft(d)}
              />
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  if (dupDateDraft) handleDuplicateDate(dupDateDraft);
                  else setDupPickerVisible(false);
                }}
              >
                <Text style={styles.doneBtnText}>שכפל כעת</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  sheetBackground: { backgroundColor: T.bg },
  sheetHandle: { backgroundColor: "rgba(0,0,0,0.1)", width: 50 },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  headerBtn: { padding: 4, minWidth: 60 },
  cancelText: { color: "#fff", fontSize: 15, fontWeight: "500", opacity: 0.9 },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "left",
  },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionLabel: {
    color: T.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: T.radiusLg,
    padding: 14,
    marginBottom: 10,
    ...T.shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  cardItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  cardValue: {
    flex: 1,
    color: T.accent,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
  },
  cardLabel: {
    color: T.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "rgba(62, 142, 208, 0.05)",
    padding: 16,
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: "rgba(62, 142, 208, 0.1)",
  },
  infoText: {
    color: T.accent,
    fontSize: 13,
    textAlign: "right",
    lineHeight: 20,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: 12,
  },
  inputBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: T.radiusMd,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  miniLabel: {
    color: T.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  textInput: {
    color: T.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    width: "100%",
  },
  notesCard: {
    backgroundColor: "#fff",
    borderRadius: T.radiusLg,
    padding: 12,
    height: 100,
    ...T.shadows.sm,
  },
  notesInput: {
    flex: 1,
    color: T.text,
    fontSize: 14,
    textAlign: "right",
  },
  dupBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 12,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  dupText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  receiptFrame: {
    borderRadius: T.radiusLg,
    overflow: "hidden",
    height: 200,
    backgroundColor: "#eee",
  },
  receipt: { width: "100%", height: "100%" },
  removeImg: { position: "absolute", top: 8, right: 8 },
  addReceipt: {
    height: 60,
    backgroundColor: "#fff",
    borderRadius: T.radiusLg,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: T.accent,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  addReceiptText: { color: T.accent, fontSize: 14, fontWeight: "700" },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  pickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    ...T.shadows.lg,
  },
  doneBtn: {
    backgroundColor: T.accent,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
