import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
  Linking,
} from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Header from "./src/components/Header.js";
import MonthNavigator from "./src/components/MonthNavigator.js";
import CalendarView from "./src/components/CalendarView.js";
import ListView from "./src/components/ListView.js";
import AdvancedStats from "./src/components/AdvancedStats.js";
import YearlyStats from "./src/components/YearlyStats.js";
import ModalManager from "./src/components/ModalManager.js";
import FloatingButton from "./src/components/FloatingButton.js";
import SideDrawer from "./src/components/SideDrawer.js";
import BottomTabs from "./src/components/BottomTabs.js";
import ShiftClockBar from "./src/components/ShiftClockBar.js";

import useShifts from "./src/hooks/useShifts.js";
import useSettings from "./src/hooks/useSettings.js";
import useSwipeNavigation from "./src/hooks/useSwipeNavigation.js";
import { parseDateLocal, formatDateLocal } from "./src/utils/shiftFilters.js";
import { darkTheme as T } from "./src/constants/theme.js";
import { calculateNetSalary } from "./src/utils/calculations.js";
import { backupData } from "./src/utils/exportUtils.js";

const VIEW_ORDER = ["yearly", "stats", "list", "calendar"];

export default function App() {
  const { config, saveConfig, restoreConfig } = useSettings();
  const {
    shifts,
    calculateEarned,
    getFilteredShifts,
    handleSaveShift,
    handleDeleteShift,
    handleDuplicateShift,
    restoreShifts,
  } = useShifts(config);

  const [viewMode, setViewMode] = useState(config.defaultView || "calendar");
  const [displayDate, setDisplayDate] = useState(new Date());
  const [modals, setModals] = useState({
    settings: false,
    add: false,
    quickAdd: false,
    payslip: false,
  });
  const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date()));
  const [editingData, setEditingData] = useState(null);
  const [lastTappedDate, setLastTappedDate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Improved swipe navigation with velocity detection and animations
  const { translateX, handleGestureEvent, handleGestureStateChange } =
    useSwipeNavigation(VIEW_ORDER, viewMode, setViewMode);

  const openEditModal = (date, data) => {
    setSelectedDate(date);
    setEditingData(data);
    setModals((prev) => ({ ...prev, add: true }));
  };

  const openAddModal = (date) => {
    setSelectedDate(date);
    setEditingData(null);
    setModals((prev) => ({ ...prev, quickAdd: true }));
  };

  const onSaveShift = (date, data) => {
    handleSaveShift(date, data);
    setModals((prev) => ({ ...prev, add: false, quickAdd: false }));
    setEditingData(null);
  };

  const onDuplicateShift = (targetDate, data) => {
    handleDuplicateShift(targetDate, data, () => {
      setSelectedDate(targetDate);
      setEditingData(null);
      setModals((prev) => ({ ...prev, add: false }));
    });
  };

  const handleRestore = async (data) => {
    if (data.config) restoreConfig(data.config);
    if (data.shifts) restoreShifts(data.shifts);
  };

  const showMonthNav = viewMode === "list" || viewMode === "stats";
  const showListFab = viewMode === "list";

  const handleClockShiftEnd = (clockData) => {
    setSelectedDate(clockData.date);
    setEditingData({
      type: "עבודה",
      startTime: clockData.startTime,
      endTime: clockData.endTime,
      totalHours: clockData.totalHours,
      bonus: "0",
      hourlyPercent: "100",
      notes: "",
    });
    setModals((prev) => ({ ...prev, add: true }));
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <BottomSheetModalProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <Header
              viewMode={viewMode}
              setViewMode={setViewMode}
              onOpenMenu={() => setDrawerOpen(true)}
            />

            <ShiftClockBar onShiftEnd={handleClockShiftEnd} />

            <PanGestureHandler
              onGestureEvent={handleGestureEvent}
              onHandlerStateChange={handleGestureStateChange}
              activeOffsetX={[-10, 10]}
              failOffsetY={[-100, 100]}
            >
              <Animated.View
                style={[styles.mainArea, { transform: [{ translateX }] }]}
              >
                {showMonthNav && (
                  <MonthNavigator
                    displayDate={displayDate}
                    onChangeMonth={setDisplayDate}
                  />
                )}

                {viewMode === "calendar" && (
                  <CalendarView
                    shifts={shifts}
                    config={config}
                    selectedDate={selectedDate}
                    displayDate={displayDate}
                    calculateEarned={calculateEarned}
                    onDeleteShift={handleDeleteShift}
                    onMonthChange={(nextDate) => {
                      setDisplayDate(nextDate);
                      const first = new Date(
                        nextDate.getFullYear(),
                        nextDate.getMonth(),
                        1,
                      );
                      setSelectedDate(formatDateLocal(first));
                      setLastTappedDate(null);
                    }}
                    onDayPress={(dateString) => {
                      setSelectedDate(dateString);
                      setDisplayDate(parseDateLocal(dateString));
                      if (shifts[dateString]) {
                        if (lastTappedDate === dateString) {
                          openEditModal(dateString, shifts[dateString]);
                        } else {
                          setLastTappedDate(dateString);
                        }
                      } else {
                        openAddModal(dateString);
                      }
                    }}
                  />
                )}

                {viewMode === "list" && (
                  <ListView
                    monthlyShifts={getFilteredShifts(displayDate)}
                    onDelete={handleDeleteShift}
                    onShiftPress={openEditModal}
                  />
                )}

                {viewMode === "stats" && (
                  <AdvancedStats
                    monthlyShifts={getFilteredShifts(displayDate)}
                    shifts={shifts}
                    config={config}
                    displayDate={displayDate}
                    calculateEarned={calculateEarned}
                    onOpenPayslip={() =>
                      setModals((prev) => ({ ...prev, payslip: true }))
                    }
                  />
                )}

                {viewMode === "yearly" && (
                  <YearlyStats
                    shifts={shifts}
                    config={config}
                    calculateEarned={calculateEarned}
                  />
                )}
              </Animated.View>
            </PanGestureHandler>

            <ModalManager
              modals={modals}
              setModals={setModals}
              config={config}
              shifts={shifts}
              monthlyShifts={getFilteredShifts(displayDate)}
              displayDate={displayDate}
              selectedDate={selectedDate}
              editingData={editingData}
              setEditingData={setEditingData}
              onSaveShift={onSaveShift}
              onDuplicateShift={onDuplicateShift}
              onRestore={handleRestore}
              onSaveConfig={(newC) => {
                saveConfig(newC);
                setModals((prev) => ({ ...prev, settings: false }));
              }}
            />

            <FloatingButton
              isVisible={showListFab}
              onPress={() => {
                const today = formatDateLocal(new Date());
                openAddModal(today);
              }}
            />

            <BottomTabs
              viewMode={viewMode}
              setViewMode={setViewMode}
              enabledModules={config.enabledModules}
            />

            <SideDrawer
              isOpen={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              config={config}
              shifts={shifts}
              onAction={(type) => {
                setDrawerOpen(false);
                if (type === "settings") {
                  setModals((m) => ({ ...m, settings: true }));
                } else if (type === "stats") {
                  setViewMode("stats");
                } else if (type === "payslip") {
                  setModals((m) => ({ ...m, payslip: true }));
                } else if (type === "whatsapp") {
                  const shiftsArray = Object.entries(shifts).map(
                    ([date, data]) => ({ ...data, date }),
                  );
                  const stats = calculateNetSalary(shiftsArray, config);
                  let msg = `*דוח שכר ל-${config.userName}*\n\n`;
                  Object.keys(shifts)
                    .sort()
                    .forEach((date) => {
                      const s = shifts[date];
                      msg += `• ${date}: ${s.type} (${s.totalHours} שעות)\n`;
                    });
                  msg += `\n*סיכום:*\nברוטו: ₪${Math.round(stats.gross).toLocaleString()}\nנטו משוער: *₪${Math.round(stats.net).toLocaleString()}*`;
                  Linking.openURL(
                    `whatsapp://send?text=${encodeURIComponent(msg)}`,
                  ).catch(() => Alert.alert("שגיאה", "ודא ש-WhatsApp מותקן"));
                } else if (type === "backup") {
                  backupData({ shifts, config }).catch(() =>
                    Alert.alert("שגיאה", "הגיבוי נכשל"),
                  );
                } else if (type === "reset") {
                  Alert.alert(
                    "איפוס נתונים",
                    "האם אתה בטוח שברצונך לאפס את כל נתוני החודש?",
                    [
                      { text: "ביטול", style: "cancel" },
                      {
                        text: "איפוס",
                        style: "destructive",
                        onPress: () => restoreShifts({}),
                      },
                    ],
                  );
                } else if (type === "info") {
                  Alert.alert(
                    "מידע",
                    "SalaryApp v1.2.0\nניהול שכר פרימיום לעובדים חכמים.",
                  );
                }
              }}
            />
          </SafeAreaView>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  mainArea: {
    flex: 1,
  },
});
