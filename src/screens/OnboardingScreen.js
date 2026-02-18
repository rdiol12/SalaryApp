import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { darkTheme as T } from "../constants/theme.js";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_STEPS = 4; // steps 1–4 (step 5 is "done")

export default function OnboardingScreen({ onComplete, onRestore }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=profile, 2=cycle, 3=restore, 4=done
  const [userName, setUserName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [travelDaily, setTravelDaily] = useState("0");
  const [salaryStartDay, setSalaryStartDay] = useState("25");
  const [salaryEndDay, setSalaryEndDay] = useState("24");
  const [restoredData, setRestoredData] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [checkAnim] = useState(new Animated.Value(0));

  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToStep = (nextStep, direction = 1) => {
    const fromValue = direction > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
    slideAnim.setValue(fromValue);
    setStep(nextStep);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start(() => {
      if (nextStep === 4) {
        Animated.spring(checkAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 8,
          stiffness: 120,
        }).start();
      }
    });
  };

  const goNext = () => {
    if (step < 4) goToStep(step + 1, 1);
  };

  const goBack = () => {
    if (step > 1) goToStep(step - 1, -1);
  };

  // Reset checkmark when leaving done step
  useEffect(() => {
    if (step !== 4) {
      checkAnim.setValue(0);
    }
  }, [step]);

  const handlePickBackup = async () => {
    setRestoring(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const response = await fetch(file.uri);
        const text = await response.text();
        const data = JSON.parse(text);
        if (data.config && data.shifts) {
          setRestoredData(data);
          if (onRestore) onRestore(data);
          goNext();
        } else {
          alert("הקובץ אינו תקין — חסרים config או shifts");
        }
      }
    } catch (e) {
      alert("שגיאה בקריאת הקובץ: " + e.message);
    } finally {
      setRestoring(false);
    }
  };

  const handleFinish = () => {
    const config = {
      userName: userName.trim() || "משתמש",
      hourlyRate: hourlyRate || "40",
      travelDaily: travelDaily || "0",
      salaryStartDay: parseInt(salaryStartDay) || 25,
      salaryEndDay: parseInt(salaryEndDay) || 24,
    };
    onComplete(config, restoredData);
  };

  const renderDots = () => {
    if (step === 0 || step === 4) return null;
    return (
      <View style={styles.dots}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="time" size={64} color="#fff" />
            </View>
            <Text style={styles.bigTitle}>ברוכים הבאים ל-SalaryApp</Text>
            <Text style={styles.subtitle}>נגדיר כמה פרטים לפני שנתחיל</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => goToStep(1, 1)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>בואו נתחיל</Text>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconWrap}>
              <Ionicons name="person-circle-outline" size={48} color={T.accent} />
            </View>
            <Text style={styles.stepTitle}>הגדרת פרופיל</Text>
            <Text style={styles.stepSubtitle}>כמה פרטים על העסקה שלך</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>מה שמך?</Text>
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholder="שם מלא"
                placeholderTextColor={T.textMuted}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>שכר שעתי (₪)</Text>
              <TextInput
                style={styles.input}
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="לדוגמה: 40"
                placeholderTextColor={T.textMuted}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>נסיעות יומי (₪) — אופציונלי</Text>
              <TextInput
                style={styles.input}
                value={travelDaily}
                onChangeText={setTravelDaily}
                placeholder="0"
                placeholderTextColor={T.textMuted}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconWrap}>
              <Ionicons name="calendar-outline" size={48} color={T.accent} />
            </View>
            <Text style={styles.stepTitle}>מחזור שכר</Text>
            <Text style={styles.stepSubtitle}>
              מתי מתחיל ומסתיים מחזור השכר שלך?
            </Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>יום התחלה</Text>
                <TextInput
                  style={styles.input}
                  value={salaryStartDay}
                  onChangeText={setSalaryStartDay}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
              <View style={styles.rowSep}>
                <Text style={styles.rowSepText}>—</Text>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>יום סיום</Text>
                <TextInput
                  style={styles.input}
                  value={salaryEndDay}
                  onChangeText={setSalaryEndDay}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
            </View>

            <View style={styles.helperBox}>
              <Ionicons name="information-circle-outline" size={16} color={T.accent} />
              <Text style={styles.helperText}>
                לרוב בין ה-25 לחודש הקודם לה-24 בחודש הנוכחי
              </Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconWrap}>
              <Ionicons name="cloud-download-outline" size={48} color={T.accent} />
            </View>
            <Text style={styles.stepTitle}>שחזור מגיבוי</Text>
            <Text style={styles.stepSubtitle}>
              האם יש לך קובץ גיבוי מהאפליקציה?
            </Text>

            {restoring ? (
              <ActivityIndicator size="large" color={T.accent} style={{ marginTop: 32 }} />
            ) : (
              <View style={styles.restoreOptions}>
                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={handlePickBackup}
                  activeOpacity={0.85}
                >
                  <Ionicons name="folder-open-outline" size={22} color={T.accent} />
                  <Text style={styles.restoreBtnText}>כן, שחזר</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={goNext}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh-outline" size={22} color={T.textSecondary} />
                  <Text style={styles.skipBtnText}>לא, התחל מחדש</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Animated.View
              style={[
                styles.checkCircle,
                {
                  transform: [
                    {
                      scale: checkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ],
                  opacity: checkAnim,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={96} color={T.green} />
            </Animated.View>
            <Text style={styles.bigTitle}>הכל מוכן! בואו נתחיל</Text>
            {restoredData && (
              <Text style={styles.restoreNote}>
                ✓ הנתונים שוחזרו בהצלחה
              </Text>
            )}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>כניסה לאפליקציה</Text>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderDots()}

        <Animated.View
          style={[
            styles.animContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {renderStep()}
        </Animated.View>

        {/* Navigation — only steps 1–3 */}
        {step >= 1 && step <= 3 && (
          <View style={styles.navArea}>
            {step > 1 && (
              <TouchableOpacity style={styles.backLink} onPress={goBack}>
                <Ionicons name="chevron-forward" size={16} color={T.textSecondary} />
                <Text style={styles.backLinkText}>חזור</Text>
              </TouchableOpacity>
            )}

            {step !== 3 && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={goNext}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>הבא</Text>
                <Ionicons name="arrow-back" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dots: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: T.accent,
    width: 24,
  },
  dotInactive: {
    backgroundColor: T.border,
  },

  animContainer: {
    flex: 1,
  },

  stepContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 32,
  },

  // Logo circle (step 0)
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: T.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    ...T.shadows.lg,
  },

  // Step icon (steps 1–3)
  stepIconWrap: {
    marginBottom: 16,
  },

  bigTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: T.text,
    textAlign: "center",
    marginBottom: 12,
    writingDirection: "rtl",
  },
  subtitle: {
    fontSize: 16,
    color: T.textSecondary,
    textAlign: "center",
    marginBottom: 48,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: T.text,
    textAlign: "center",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: T.textSecondary,
    textAlign: "center",
    marginBottom: 28,
  },

  inputGroup: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: T.textSecondary,
    textAlign: "right",
    marginBottom: 6,
  },
  input: {
    backgroundColor: T.inputBg,
    borderRadius: T.radiusSm,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: T.text,
    writingDirection: "rtl",
  },

  row: {
    flexDirection: "row-reverse",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  rowSep: {
    justifyContent: "flex-end",
    paddingBottom: 14,
  },
  rowSepText: {
    fontSize: 18,
    color: T.textMuted,
  },

  helperBox: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: T.accentLight,
    borderRadius: T.radiusSm,
    padding: 12,
    width: "100%",
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: T.accent,
    textAlign: "right",
    lineHeight: 20,
  },

  // Restore step
  restoreOptions: {
    width: "100%",
    gap: 14,
    marginTop: 24,
  },
  restoreBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: T.accentLight,
    borderWidth: 1.5,
    borderColor: T.accent,
    borderRadius: T.radiusMd,
    paddingVertical: 16,
  },
  restoreBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: T.accent,
  },
  skipBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: T.inputBg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radiusMd,
    paddingVertical: 16,
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: T.textSecondary,
  },

  // Done step
  checkCircle: {
    marginBottom: 24,
    marginTop: 8,
  },
  restoreNote: {
    fontSize: 14,
    color: T.green,
    fontWeight: "600",
    marginBottom: 24,
  },

  // Nav area
  navArea: {
    marginTop: 32,
    alignItems: "center",
    gap: 12,
  },
  backLink: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  backLinkText: {
    fontSize: 15,
    color: T.textSecondary,
  },

  // Primary button
  primaryBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: T.accent,
    borderRadius: T.radiusMd,
    paddingVertical: 16,
    paddingHorizontal: 40,
    ...T.shadows.md,
    width: "100%",
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
});
