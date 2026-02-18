import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import ReAnimated from "react-native-reanimated";
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
  const [attachedFile, setAttachedFile] = useState(null);
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });
  const [dupPickerVisible, setDupPickerVisible] = useState(false);
  const [dupDateDraft, setDupDateDraft] = useState(null);
  const [imageViewerUri, setImageViewerUri] = useState(null);

  const isIOS = Platform.OS === "ios";
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["92%"], []);

  // Drag-to-close for dup modal
  const dupTranslateY = useRef(new Animated.Value(0)).current;
  const dupPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy, dx }) =>
        dy > 8 && Math.abs(dy) > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) dupTranslateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 100 || vy > 1.2) {
          Animated.timing(dupTranslateY, {
            toValue: 900,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            dupTranslateY.setValue(0);
            setDupPickerVisible(false);
          });
        } else {
          Animated.spring(dupTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 300,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (existingData) {
      const baseType = existingData.type || TYPE_WORK;
      if (baseType === TYPE_SICK || baseType === TYPE_VACATION) {
        setShift({
          notes: "",
          bonus: "0",
          hourlyPercent: "100",
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
        setShift({ notes: "", bonus: "0", hourlyPercent: "100", ...existingData, startTime, endTime, totalHours });
      }
      setReceiptImage(existingData.receiptImage || null);
      setAttachedFile(existingData.attachedFile || null);
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
    onSave(finalDate, { ...shift, totalHours, receiptImage, attachedFile });
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

  const openFile = async () => {
    if (!attachedFile?.uri) return;
    try {
      if (Platform.OS === "android") {
        // On Android: copy to cache if needed, then open with system viewer
        let fileUri = attachedFile.uri;
        if (!fileUri.startsWith("file://")) {
          // content:// URI — copy to cache first
          const dest = FileSystem.cacheDirectory + (attachedFile.name || "document.pdf");
          await FileSystem.copyAsync({ from: fileUri, to: dest });
          fileUri = dest;
        }
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: "application/pdf",
        });
      } else {
        // iOS: use sharing
        await Sharing.shareAsync(attachedFile.uri, { mimeType: "application/pdf", dialogTitle: attachedFile.name });
      }
    } catch (e) {
      alert("שגיאה בפתיחת הקובץ");
    }
  };

  const shareFile = async () => {
    if (!attachedFile?.uri) return;
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(attachedFile.uri, {
          mimeType: "application/pdf",
          dialogTitle: attachedFile.name,
        });
      } else {
        alert("לא ניתן לשתף קבצים במכשיר זה");
      }
    } catch (e) {
      alert("שגיאה בשיתוף הקובץ");
    }
  };

  return (
    <>
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetHandle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
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
                presets={config.presets || PRESETS}
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

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>הערות מהשטח</Text>
            <View style={styles.notesCard}>
              <BottomSheetTextInput
                style={styles.notesInput}
                value={shift.notes ?? ""}
                onChangeText={(v) => setShift((prev) => ({ ...prev, notes: v }))}
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
              onPress={() => {
                dupTranslateY.setValue(0);
                setDupPickerVisible(true);
              }}
            >
              <Ionicons name="copy-outline" size={16} color={T.accent} />
              <Text style={styles.dupText}>שכפל משמרת לתאריך אחר</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>קבלה / צרופות</Text>
            {receiptImage ? (
              <View style={styles.receiptFrame}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setImageViewerUri(receiptImage)}
                >
                  <ReAnimated.Image
                    source={{ uri: receiptImage }}
                    style={styles.receipt}
                  />
                </TouchableOpacity>
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

            <View style={{ height: 10 }} />

            {attachedFile ? (
              <View style={styles.fileCard}>
                <View style={styles.fileInfo}>
                  <View style={styles.fileIconBox}>
                    <Ionicons name="document-text" size={22} color={T.red} />
                  </View>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {attachedFile.name}
                    </Text>
                    <View style={styles.fileActions}>
                      <TouchableOpacity
                        style={styles.fileActionBtn}
                        onPress={openFile}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="open-outline" size={14} color={T.accent} />
                        <Text style={styles.fileActionText}>פתח</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.fileActionBtn, styles.fileActionShare]}
                        onPress={shareFile}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="share-outline" size={14} color={T.textSecondary} />
                        <Text style={[styles.fileActionText, { color: T.textSecondary }]}>שתף</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.fileRemove}
                  onPress={removeFile}
                >
                  <Ionicons name="close-circle" size={24} color={T.red} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addReceipt}
                onPress={pickDocument}
              >
                <Ionicons name="document-attach" size={24} color={T.accent} />
                <Text style={styles.addReceiptText}>צרף קובץ PDF</Text>
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

      </SafeAreaView>
    </BottomSheetModal>

    {/* Duplicate date picker — separate Modal so it renders above BottomSheet */}
    <Modal
      visible={dupPickerVisible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        dupTranslateY.setValue(0);
        setDupPickerVisible(false);
      }}
    >
      <View style={styles.modalBackdrop}>
        <Animated.View
          style={[styles.pickerContent, { transform: [{ translateY: dupTranslateY }] }]}
        >
          <View style={styles.dupHandleArea} {...dupPanResponder.panHandlers}>
            <View style={styles.dupHandle} />
          </View>
          <Text style={styles.dupModalTitle}>בחר תאריך לשכפול</Text>
          <View style={styles.datePickerWrapper}>
            <DateTimePicker
              value={dupDateDraft || localDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "spinner"}
              onChange={(e, d) => d && setDupDateDraft(d)}
              style={styles.datePicker}
              minimumDate={new Date(2020, 0, 1)}
              maximumDate={new Date(2030, 11, 31)}
              themeVariant="light"
              accentColor="#3E8ED0"
            />
          </View>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => handleDuplicateDate(dupDateDraft || localDate)}
          >
            <Text style={styles.doneBtnText}>שכפל כעת</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelDupBtn}
            onPress={() => setDupPickerVisible(false)}
          >
            <Text style={styles.cancelDupText}>ביטול</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>

    {/* Full-screen image viewer */}
    <Modal
      visible={!!imageViewerUri}
      transparent
      animationType="fade"
      onRequestClose={() => setImageViewerUri(null)}
    >
      <View style={styles.imageViewerBg}>
        <TouchableOpacity
          style={styles.imageViewerClose}
          onPress={() => setImageViewerUri(null)}
        >
          <Ionicons name="close-circle" size={36} color="#fff" />
        </TouchableOpacity>
        {imageViewerUri && (
          <Image
            source={{ uri: imageViewerUri }}
            style={styles.imageViewerImg}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
    </>
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
  fileCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: T.radiusLg,
    padding: 12,
    ...T.shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  fileInfo: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  fileDetails: {
    flex: 1,
    alignItems: "flex-end",
  },
  fileName: {
    color: T.text,
    fontSize: 13,
    fontWeight: "700",
  },
  fileActions: {
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 6,
  },
  fileActionBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    backgroundColor: T.accentLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fileActionShare: {
    backgroundColor: T.inputBg,
  },
  fileActionText: {
    color: T.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  fileRemove: {
    padding: 4,
    marginLeft: 4,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dupModalTitle: {
    color: T.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  cancelDupBtn: {
    padding: 14,
    alignItems: "center",
    marginTop: 6,
  },
  cancelDupText: {
    color: T.textSecondary,
    fontSize: 15,
  },
  // Full-screen image viewer
  imageViewerBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 10,
  },
  imageViewerImg: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  pickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    minHeight: Platform.OS === "ios" ? 520 : 380,
    ...T.shadows.lg,
  },
  dupHandleArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  dupHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
  },
  datePickerWrapper: {
    height: Platform.OS === "ios" ? 320 : 200,
    justifyContent: "center",
  },
  datePicker: {
    height: Platform.OS === "ios" ? 320 : 200,
    width: "100%",
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
