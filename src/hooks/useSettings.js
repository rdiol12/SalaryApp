import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { PRESETS } from "../utils/shiftUtils.js";

const DEFAULT_CONFIG = {
  userName: "משתמש",
  hourlyRate: "40",
  salaryStartDay: "25",
  salaryEndDay: "24",
  isBreakDeducted: true,
  breakDeduction: "30",
  travelDaily: "22.60",
  monthlyGoal: "10000",
  creditPoints: "2.25",
  pensionRate: "0.06",
  overtimeStartThreshold: "9",
  overtimeMultiplier: "1.25",
  overtimeTiers: [
    { from: 0, to: 8, multiplier: 1 },
    { from: 8, to: 10, multiplier: 1.25 },
    { from: 10, to: 12, multiplier: 1.4 },
    { from: 12, to: null, multiplier: 1.4 },
  ],
  shiftTemplates: [],
  presets: PRESETS,
};

export default function useSettings() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const c = await AsyncStorage.getItem("config");
      if (c) {
        const parsed = JSON.parse(c);
        setConfig((prev) => ({
          ...prev,
          ...parsed,
        }));
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

  const saveConfig = async (newConfig) => {
    try {
      await AsyncStorage.setItem("config", JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (e) {
      console.error("Error saving config", e);
    }
  };

  return {
    config,
    saveConfig,
    restoreConfig: (data) => {
      setConfig(data);
      saveConfig(data);
    },
  };
}
