import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { PRESETS } from "../utils/shiftUtils.js";
import {
  migrateConfig,
  getJobConfig,
  applyJobConfig,
  DEFAULT_JOB_SETTINGS,
} from "../utils/jobs.js";

// Person-level defaults; pay settings live on each job (see utils/jobs.js).
const DEFAULT_CONFIG = migrateConfig({
  userName: "משתמש",
  monthlyGoal: "10000",
  creditPoints: "2.25",
  ...DEFAULT_JOB_SETTINGS,
  presets: PRESETS,
});

/**
 * fullConfig: the stored config with all jobs.
 * config:     the active job's config (person settings + that job's pay
 *             settings), which the rest of the app works with.
 */
export default function useSettings() {
  const [fullConfig, setFullConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const c = await AsyncStorage.getItem("config");
      if (c) {
        const parsed = JSON.parse(c);
        // Old configs keep their pay settings at the top level; those win
        // over the defaults before they are moved into the first job.
        const base = parsed.jobs ? DEFAULT_CONFIG : { ...DEFAULT_JOB_SETTINGS, presets: PRESETS };
        setFullConfig(migrateConfig({ ...base, ...parsed }));
      }
    } catch (e) {
      console.error("Error loading config", e);
      Alert.alert(
        "שגיאה בטעינת הגדרות",
        "לא הצלחנו לטעון את ההגדרות השמורות.",
        [{ text: "אישור", style: "default" }],
      );
    }
  };

  const saveFullConfig = useCallback(async (newFull) => {
    const migrated = migrateConfig(newFull);
    setFullConfig(migrated);
    try {
      await AsyncStorage.setItem("config", JSON.stringify(migrated));
    } catch (e) {
      console.error("Error saving config", e);
    }
  }, []);

  const config = useMemo(() => getJobConfig(fullConfig), [fullConfig]);

  /** Saves a config edited as the active job's config. */
  const saveConfig = useCallback(
    (jobConfig) => saveFullConfig(applyJobConfig(fullConfig, jobConfig)),
    [fullConfig, saveFullConfig],
  );

  const setActiveJob = useCallback(
    (jobId) => saveFullConfig({ ...fullConfig, activeJobId: jobId }),
    [fullConfig, saveFullConfig],
  );

  return {
    config,
    fullConfig,
    saveConfig,
    saveFullConfig,
    setActiveJob,
    restoreConfig: (data) => {
      const base = data?.jobs ? DEFAULT_CONFIG : { ...DEFAULT_JOB_SETTINGS, presets: PRESETS };
      saveFullConfig({ ...base, ...data });
    },
  };
}
