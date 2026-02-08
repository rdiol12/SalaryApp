import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import {
  getFilteredShiftsForMonth,
  parseDateLocal,
  formatDateLocal,
} from "../utils/shiftFilters.js";

const triggerHaptic = (fn) => {
  try {
    fn?.();
  } catch (e) {
    // ignore if haptics unavailable
  }
};

export default function useShifts(config) {
  const [shifts, setShifts] = useState({});

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const s = await AsyncStorage.getItem("shifts");
      if (s) {
        const parsed = JSON.parse(s);
        setShifts(parsed);
      }
    } catch (e) {
      console.error("Error loading shifts", e);
      Alert.alert(
        "שגיאה בטעינת נתונים",
        "לא הצלחנו לטעון את המשמרות השמורות.",
        [{ text: "אישור", style: "default" }],
      );
    }
  };

  const saveShifts = async (data) => {
    try {
      await AsyncStorage.setItem("shifts", JSON.stringify(data));
    } catch (e) {
      console.error("Error saving shifts", e);
    }
  };

  const getSickDaySequence = useCallback(
    (dateStr) => {
      let count = 1;
      let curr = parseDateLocal(dateStr);
      while (true) {
        curr.setDate(curr.getDate() - 1);
        const prev = formatDateLocal(curr);
        if (shifts[prev] && shifts[prev].type === "מחלה") count++;
        else break;
      }
      return count;
    },
    [shifts],
  );

  const getOvertimeTiers = useCallback(() => {
    const tiers = Array.isArray(config.overtimeTiers)
      ? config.overtimeTiers
      : [];
    if (tiers.length > 0) return tiers;
    const threshold = Number(config.overtimeStartThreshold || 0);
    const mult = Number(config.overtimeMultiplier || 1.25);
    if (!threshold) return [{ from: 0, to: null, multiplier: 1 }];
    return [
      { from: 0, to: threshold, multiplier: 1 },
      { from: threshold, to: null, multiplier: mult },
    ];
  }, [config]);

  const computeTieredPay = useCallback(
    (hours, rate, percent) => {
      const tiers = getOvertimeTiers()
        .map((t) => ({
          from: Number(t.from || 0),
          to: t.to === null || t.to === "" ? null : Number(t.to),
          multiplier: Number(t.multiplier || 1),
        }))
        .filter((t) => Number.isFinite(t.from) && Number.isFinite(t.multiplier))
        .sort((a, b) => a.from - b.from);

      let total = 0;
      tiers.forEach((tier) => {
        const end = tier.to === null ? Infinity : tier.to;
        const tierHours = Math.max(0, Math.min(hours, end) - tier.from);
        if (tierHours <= 0) return;
        total += tierHours * rate * percent * tier.multiplier;
      });

      return total;
    },
    [getOvertimeTiers],
  );

  const calculateEarned = useCallback(
    (dateStr, data) => {
      let hours = Number(data.totalHours || 0);
      const rate = Number(config.hourlyRate || 0);
      const percent = Number(data.hourlyPercent || 100) / 100;

      if (config.isBreakDeducted && hours > 6) {
        hours -= Number(config.breakDeduction || 0) / 60;
      }

      if (data.type === "מחלה") {
        const daySeq = getSickDaySequence(dateStr);
        if (daySeq === 1) return 0;
        if (daySeq === 2) return hours * rate * 0.5;
        return hours * rate;
      }

      const tieredTotal = computeTieredPay(hours, rate, percent);
      const isWork = data.type === "עבודה";
      const travel = isWork ? Number(config.travelDaily || 0) : 0;
      return tieredTotal + Number(data.bonus || 0) + travel;
    },
    [config, getSickDaySequence, computeTieredPay],
  );

  const getFilteredShifts = useCallback(
    (displayDate) => {
      return getFilteredShiftsForMonth(
        shifts,
        config,
        displayDate.getMonth(),
        displayDate.getFullYear(),
        calculateEarned,
      );
    },
    [shifts, config, calculateEarned],
  );

  const handleSaveShift = useCallback((date, data) => {
    setShifts((prev) => {
      const newShifts = { ...prev, [date]: data };
      saveShifts(newShifts);
      return newShifts;
    });
    triggerHaptic(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    );
  }, []);

  const handleDeleteShift = useCallback((date) => {
    setShifts((prev) => {
      const newShifts = { ...prev };
      delete newShifts[date];
      saveShifts(newShifts);
      return newShifts;
    });
    triggerHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  }, []);

  const handleDuplicateShift = useCallback(
    (targetDate, data, onSuccess) => {
      if (!targetDate) return;
      const doSave = () => {
        setShifts((prev) => {
          const newShifts = { ...prev, [targetDate]: { ...data } };
          saveShifts(newShifts);
          return newShifts;
        });
        triggerHaptic(() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        );
        onSuccess?.();
      };

      if (shifts[targetDate]) {
        Alert.alert("דריסה", "קיימת משמרת בתאריך זה. להחליף?", [
          { text: "ביטול", style: "cancel" },
          { text: "להחליף", style: "destructive", onPress: doSave },
        ]);
      } else {
        doSave();
      }
    },
    [shifts],
  );

  return {
    shifts,
    calculateEarned,
    getFilteredShifts,
    handleSaveShift,
    handleDeleteShift,
    handleDuplicateShift,
    restoreShifts: (data) => {
      setShifts(data);
      saveShifts(data);
    },
  };
}
