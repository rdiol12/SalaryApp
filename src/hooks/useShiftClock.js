import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "active_shift_clock";

export default function useShiftClock() {
  const [clockedIn, setClockedIn] = useState(false);
  const [startTime, setStartTime] = useState(null); // Date object
  const [elapsed, setElapsed] = useState(0); // seconds
  const intervalRef = useRef(null);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        const data = JSON.parse(val);
        const start = new Date(data.startTime);
        setStartTime(start);
        setClockedIn(true);
        setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
      }
    });
  }, []);

  // Tick timer while clocked in
  useEffect(() => {
    if (clockedIn && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [clockedIn, startTime]);

  const clockIn = useCallback(async () => {
    const now = new Date();
    const data = { startTime: now.toISOString() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setStartTime(now);
    setClockedIn(true);
    setElapsed(0);
  }, []);

  const clockOut = useCallback(async () => {
    if (!startTime) return null;

    const endTime = new Date();
    const totalMs = endTime.getTime() - startTime.getTime();
    const totalHours = totalMs / (1000 * 60 * 60);

    const pad = (n) => String(n).padStart(2, "0");
    const startStr = `${pad(startTime.getHours())}:${pad(startTime.getMinutes())}`;
    const endStr = `${pad(endTime.getHours())}:${pad(endTime.getMinutes())}`;

    // Format date as YYYY-MM-DD
    const y = startTime.getFullYear();
    const m = pad(startTime.getMonth() + 1);
    const d = pad(startTime.getDate());
    const dateStr = `${y}-${m}-${d}`;

    await AsyncStorage.removeItem(STORAGE_KEY);
    setClockedIn(false);
    setStartTime(null);
    setElapsed(0);

    return {
      date: dateStr,
      startTime: startStr,
      endTime: endStr,
      totalHours: totalHours.toFixed(2),
    };
  }, [startTime]);

  const cancel = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setClockedIn(false);
    setStartTime(null);
    setElapsed(0);
  }, []);

  // Format elapsed seconds to HH:MM:SS
  const formatElapsed = () => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return { clockedIn, startTime, elapsed, formatElapsed, clockIn, clockOut, cancel };
}
