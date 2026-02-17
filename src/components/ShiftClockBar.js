import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { darkTheme as T } from "../constants/theme.js";
import useShiftClock from "../hooks/useShiftClock.js";

export default function ShiftClockBar({ onShiftEnd }) {
  const { clockedIn, startTime, formatElapsed, clockIn, clockOut, cancel } =
    useShiftClock();

  // Pulse animation when clocked in
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (clockedIn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [clockedIn]);

  const handlePress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    if (!clockedIn) {
      await clockIn();
    } else {
      const result = await clockOut();
      if (result) {
        onShiftEnd(result);
      }
    }
  };

  const handleCancel = () => {
    Alert.alert("ביטול משמרת", "לבטל את המשמרת הנוכחית?", [
      { text: "לא", style: "cancel" },
      {
        text: "ביטול משמרת",
        style: "destructive",
        onPress: cancel,
      },
    ]);
  };

  const startLabel = startTime
    ? `${String(startTime.getHours()).padStart(2, "0")}:${String(
        startTime.getMinutes()
      ).padStart(2, "0")}`
    : "";

  if (!clockedIn) {
    return (
      <TouchableOpacity
        style={styles.idleBar}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <Ionicons name="play-circle" size={22} color={T.accent} />
        <Text style={styles.idleText}>התחל משמרת</Text>
        <Ionicons name="time-outline" size={16} color={T.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.activeBar, { transform: [{ scale: pulse }] }]}>
      {/* Live timer display */}
      <View style={styles.timerSection}>
        <Text style={styles.elapsed}>{formatElapsed()}</Text>
        <Text style={styles.since}>מ-{startLabel}</Text>
      </View>

      {/* Stop button */}
      <TouchableOpacity
        style={styles.stopBtn}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons name="stop-circle" size={20} color="#fff" />
        <Text style={styles.stopText}>סיום</Text>
      </TouchableOpacity>

      {/* Cancel (trash) */}
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Ionicons name="close-circle-outline" size={20} color={T.red} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  idleBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: T.accentLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.accent + "50",
  },
  idleText: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
  },

  activeBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: T.green,
    borderRadius: 20,
    ...T.shadows.sm,
  },
  timerSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  elapsed: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  since: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 1,
  },
  stopBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
  },
  stopText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  cancelBtn: {
    padding: 4,
  },
});
