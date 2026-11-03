import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { getFilteredShiftsForMonth } from "../utils/shiftFilters.js";
import { getJobs, shiftsStorageKey, calculateShiftEarned } from "../utils/jobs.js";

const triggerHaptic = (fn) => {
  try {
    fn?.();
  } catch (e) {
    // ignore if haptics unavailable
  }
};

/**
 * Shifts of every job, kept per job. `shifts` and all handlers work on the
 * active job (config.jobId); `shiftsByJob` holds every job for the combined
 * summary and backup.
 */
export default function useShifts(config, fullConfig = config) {
  const [shiftsByJob, setShiftsByJob] = useState({});
  const activeJobId = config.jobId;
  const activeRef = useRef(activeJobId);
  activeRef.current = activeJobId;

  const jobIds = getJobs(fullConfig).map((j) => j.id);
  const jobIdsKey = jobIds.join("|");

  const loadedRef = useRef(new Set());

  useEffect(() => {
    // Load only jobs not loaded yet, so a new job never overwrites shifts
    // that are still being saved.
    const missing = jobIds.filter((id) => !loadedRef.current.has(id));
    if (missing.length) loadShifts(missing);
  }, [jobIdsKey]);

  const loadShifts = async (ids) => {
    ids.forEach((id) => loadedRef.current.add(id));
    try {
      const entries = await Promise.all(
        ids.map(async (id) => {
          const raw = await AsyncStorage.getItem(shiftsStorageKey(id));
          return [id, raw ? JSON.parse(raw) : {}];
        }),
      );
      setShiftsByJob((prev) => ({ ...Object.fromEntries(entries), ...prev }));
    } catch (e) {
      console.error("Error loading shifts", e);
      Alert.alert(
        "שגיאה בטעינת נתונים",
        "לא הצלחנו לטעון את המשמרות השמורות.",
        [{ text: "אישור", style: "default" }],
      );
    }
  };

  const saveShifts = async (jobId, data) => {
    try {
      await AsyncStorage.setItem(shiftsStorageKey(jobId), JSON.stringify(data));
    } catch (e) {
      console.error("Error saving shifts", e);
    }
  };

  // Updates the active job's shifts and saves them.
  const updateActive = useCallback((fn) => {
    const jobId = activeRef.current;
    setShiftsByJob((prev) => {
      const next = fn(prev[jobId] || {});
      saveShifts(jobId, next);
      return { ...prev, [jobId]: next };
    });
  }, []);

  const shifts = shiftsByJob[activeJobId] || {};

  const calculateEarned = useCallback(
    (dateStr, data) => calculateShiftEarned(dateStr, data, config, shifts),
    [config, shifts],
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
    updateActive((prev) => ({ ...prev, [date]: data }));
    triggerHaptic(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    );
  }, [updateActive]);

  const handleDeleteShift = useCallback((date) => {
    updateActive((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
    triggerHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  }, [updateActive]);

  const handleDuplicateShift = useCallback(
    (targetDate, data, onSuccess) => {
      if (!targetDate) return;
      const doSave = () => {
        updateActive((prev) => ({ ...prev, [targetDate]: { ...data } }));
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
    [shifts, updateActive],
  );

  /** Replaces the active job's shifts. */
  const restoreShifts = useCallback(
    (data) => updateActive(() => data || {}),
    [updateActive],
  );

  /** Replaces the shifts of every job given ({ [jobId]: shifts }). */
  const restoreAllShifts = useCallback((byJob) => {
    setShiftsByJob((prev) => {
      const next = { ...prev };
      Object.entries(byJob || {}).forEach(([jobId, data]) => {
        next[jobId] = data || {};
        saveShifts(jobId, next[jobId]);
      });
      return next;
    });
  }, []);

  /** Deletes the stored shifts of jobs that were removed. */
  const removeJobShifts = useCallback((ids) => {
    setShiftsByJob((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        delete next[id];
        loadedRef.current.delete(id);
        AsyncStorage.removeItem(shiftsStorageKey(id)).catch(() => {});
      });
      return next;
    });
  }, []);

  return {
    shifts,
    shiftsByJob,
    calculateEarned,
    getFilteredShifts,
    handleSaveShift,
    handleDeleteShift,
    handleDuplicateShift,
    restoreShifts,
    restoreAllShifts,
    removeJobShifts,
  };
}
