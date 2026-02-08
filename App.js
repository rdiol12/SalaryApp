import React, { useState } from "react";
import { StyleSheet, SafeAreaView, StatusBar, Animated } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";

import Header from "./src/components/Header";
import MonthNavigator from "./src/components/MonthNavigator";
import CalendarView from "./src/components/CalendarView";
import ListView from "./src/components/ListView";
import AdvancedStats from "./src/components/AdvancedStats";
import YearlyStats from "./src/components/YearlyStats";
import ModalManager from "./src/components/ModalManager";
import FloatingButton from "./src/components/FloatingButton";

import useShifts from "./src/hooks/useShifts";
import useSettings from "./src/hooks/useSettings";
import useSwipeNavigation from "./src/hooks/useSwipeNavigation";
import { parseDateLocal, formatDateLocal } from "./src/utils/shiftFilters";
import { darkTheme as T } from "./src/constants/theme";

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

  const [viewMode, setViewMode] = useState("calendar");
  const [displayDate, setDisplayDate] = useState(new Date());
  const [modals, setModals] = useState({
    settings: false,
    add: false,
    quickAdd: false,
  });
  const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date()));
  const [editingData, setEditingData] = useState(null);
  const [lastTappedDate, setLastTappedDate] = useState(null);

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

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={T.accent} />

          <Header
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenSettings={() =>
              setModals((prev) => ({ ...prev, settings: true }))
            }
          />

          <PanGestureHandler
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleGestureStateChange}
            activeOffsetX={[-15, 15]}
            failOffsetY={[-25, 25]}
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
                  config={config}
                  displayDate={displayDate}
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
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
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
