import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from './src/components/Header';
import MonthNavigator from './src/components/MonthNavigator';
import CalendarView from './src/components/CalendarView';
import ListView from './src/components/ListView';
import AdvancedStats from './src/components/AdvancedStats';
import YearlyStats from './src/components/YearlyStats';
import SettingsModal from './src/components/SettingsModal';
import ShiftDetailsModal from './src/components/ShiftDetailsModal';
import AddShiftModal from './src/components/AddShiftModal';
import { getFilteredShiftsForMonth, parseDateLocal, formatDateLocal } from './src/utils/shiftFilters';
import FloatingButton from './src/components/FloatingButton';
import { darkTheme as T } from './src/constants/theme';

export default function App() {
  const TYPE_MAP = {
    '׳³ֲ¢׳³ג€˜׳³ג€¢׳³ג€׳³ג€': 'עבודה',
    '׳³ֲ©׳³ג€˜׳³ֳ—': 'שבת',
    '׳³ֲ׳³ג€”׳³ֲ׳³ג€': 'מחלה',
    '׳³ג€”׳³ג€¢׳³ג‚×׳³ֲ©': 'חופש',
  };

  const [shifts, setShifts] = useState({});
  const [viewMode, setViewMode] = useState('calendar');
  const [displayDate, setDisplayDate] = useState(new Date());
  const [modals, setModals] = useState({ settings: false, add: false, quickAdd: false });
  const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date()));
  const [editingData, setEditingData] = useState(null);
  const [lastTappedDate, setLastTappedDate] = useState(null);

  const [config, setConfig] = useState({
    userName: 'משתמש',
    hourlyRate: '40',
    salaryStartDay: '25',
    salaryEndDay: '24',
    isBreakDeducted: true,
    breakDeduction: '30',
    travelDaily: '22.60',
    monthlyGoal: '10000',
    creditPoints: '2.25',
    pensionRate: '0.06',
    overtimeStartThreshold: '9',
    overtimeMultiplier: '1.25',
    overtimeTiers: [
      { from: 0, to: 8, multiplier: 1 },
      { from: 8, to: 10, multiplier: 1.25 },
      { from: 10, to: 12, multiplier: 1.4 },
      { from: 12, to: null, multiplier: 1.4 },
    ],
    shiftTemplates: [],
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const s = await AsyncStorage.getItem('shifts');
      const c = await AsyncStorage.getItem('config');
      if (s) {
        const parsed = JSON.parse(s);
        const normalized = Object.keys(parsed).reduce((acc, key) => {
          const shift = parsed[key];
          const type = TYPE_MAP[shift.type] || shift.type;
          acc[key] = { ...shift, type };
          return acc;
        }, {});
        setShifts(normalized);
      }
      if (c) {
        const parsed = JSON.parse(c);
        const templates = Array.isArray(parsed.shiftTemplates)
          ? parsed.shiftTemplates.map(t => ({ ...t, type: TYPE_MAP[t.type] || t.type }))
          : [];
        setConfig(prev => ({ ...prev, ...parsed, shiftTemplates: templates }));
      }
    } catch (e) {
      console.error('Error loading data', e);
    }
  };

  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving data', e);
    }
  };

  const getOvertimeTiers = () => {
    const tiers = Array.isArray(config.overtimeTiers) ? config.overtimeTiers : [];
    if (tiers.length > 0) return tiers;
    const threshold = Number(config.overtimeStartThreshold || 0);
    const mult = Number(config.overtimeMultiplier || 1.25);
    if (!threshold) return [{ from: 0, to: null, multiplier: 1 }];
    return [
      { from: 0, to: threshold, multiplier: 1 },
      { from: threshold, to: null, multiplier: mult },
    ];
  };

  const computeTieredPay = (hours, rate, percent) => {
    const tiers = getOvertimeTiers()
      .map(t => ({
        from: Number(t.from || 0),
        to: t.to === null || t.to === '' ? null : Number(t.to),
        multiplier: Number(t.multiplier || 1),
      }))
      .filter(t => Number.isFinite(t.from) && Number.isFinite(t.multiplier))
      .sort((a, b) => a.from - b.from);

    const breakdown = [];
    let total = 0;

    tiers.forEach((tier) => {
      const end = tier.to === null ? Infinity : tier.to;
      const tierHours = Math.max(0, Math.min(hours, end) - tier.from);
      if (tierHours <= 0) return;
      const tierPay = tierHours * rate * percent * tier.multiplier;
      breakdown.push({
        hours: tierHours,
        multiplier: tier.multiplier,
        amount: tierPay,
        from: tier.from,
        to: tier.to,
      });
      total += tierPay;
    });

    return { total, breakdown };
  };

  const calculateEarned = (dateStr, data) => {
    let hours = Number(data.totalHours || 0);
    const rate = Number(config.hourlyRate || 0);
    const percent = Number(data.hourlyPercent || 100) / 100;

    if (config.isBreakDeducted && hours > 6) {
      hours -= Number(config.breakDeduction || 0) / 60;
    }

    if (data.type === 'מחלה') {
      const daySeq = getSickDaySequence(dateStr);
      if (daySeq === 1) return 0;
      if (daySeq === 2 || daySeq === 3) return hours * rate * 0.5;
      return hours * rate;
    }

    const tiered = computeTieredPay(hours, rate, percent);
    const isWork = data.type === 'עבודה';
    const travel = isWork ? Number(config.travelDaily || 0) : 0;
    return tiered.total + Number(data.bonus || 0) + travel;
  };

  const getSickDaySequence = (dateStr) => {
    let count = 1;
    let curr = parseDateLocal(dateStr);
    while (true) {
      curr.setDate(curr.getDate() - 1);
      const prev = formatDateLocal(curr);
      if (shifts[prev] && shifts[prev].type === 'מחלה') count++;
      else break;
    }
    return count;
  };

  const getFilteredShifts = () => {
    return getFilteredShiftsForMonth(
      shifts, config,
      displayDate.getMonth(), displayDate.getFullYear(),
      calculateEarned,
    );
  };

  const handleSaveShift = (date, data) => {
    const newShifts = { ...shifts, [date]: data };
    setShifts(newShifts);
    saveData('shifts', newShifts);
    setModals(prev => ({ ...prev, add: false, quickAdd: false }));
    setEditingData(null);
  };

  const handleDeleteShift = (date) => {
    const newShifts = { ...shifts };
    delete newShifts[date];
    setShifts(newShifts);
    saveData('shifts', newShifts);
  };

  const handleDuplicateShift = (targetDate, data) => {
    if (!targetDate) return;
    const doSave = () => {
      const newShifts = { ...shifts, [targetDate]: { ...data } };
      setShifts(newShifts);
      saveData('shifts', newShifts);
      setSelectedDate(targetDate);
      setEditingData(null);
      setModals(prev => ({ ...prev, add: false }));
    };

    if (shifts[targetDate]) {
      Alert.alert('דריסה', 'קיימת משמרת בתאריך זה. להחליף?', [
        { text: 'ביטול', style: 'cancel' },
        { text: 'להחליף', style: 'destructive', onPress: doSave },
      ]);
    } else {
      doSave();
    }
  };

  const openEditModal = (date, data) => {
    setSelectedDate(date);
    setEditingData(data);
    setModals(prev => ({ ...prev, add: true }));
  };

  const openAddModal = (date) => {
    setSelectedDate(date);
    setEditingData(null);
    setModals(prev => ({ ...prev, quickAdd: true }));
  };

  const showMonthNav = viewMode === 'list' || viewMode === 'stats';
  const showListFab = viewMode === 'list';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={T.accent} />

      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenSettings={() => setModals(prev => ({ ...prev, settings: true }))}
      />

      {showMonthNav && (
        <MonthNavigator
          displayDate={displayDate}
          onChangeMonth={setDisplayDate}
        />
      )}

      {viewMode === 'calendar' && (
        <CalendarView
          shifts={shifts}
          config={config}
          selectedDate={selectedDate}
          calculateEarned={calculateEarned}
          onDeleteShift={handleDeleteShift}
          onDayPress={(dateString) => {
            setSelectedDate(dateString);
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

      {viewMode === 'list' && (
        <ListView
          monthlyShifts={getFilteredShifts()}
          onDelete={handleDeleteShift}
          onShiftPress={openEditModal}
        />
      )}

      {viewMode === 'stats' && (
        <AdvancedStats
          monthlyShifts={getFilteredShifts()}
          config={config}
          displayDate={displayDate}
        />
      )}

      {viewMode === 'yearly' && (
        <YearlyStats
          shifts={shifts}
          config={config}
          calculateEarned={calculateEarned}
        />
      )}

      <ShiftDetailsModal
        visible={modals.add}
        date={selectedDate}
        existingData={editingData}
        onSave={handleSaveShift}
        onDuplicate={handleDuplicateShift}
        templates={config.shiftTemplates || []}
        config={config}
        onClose={() => { setModals(prev => ({ ...prev, add: false })); setEditingData(null); }}
      />

      <AddShiftModal
        visible={modals.quickAdd}
        date={selectedDate}
        onSave={handleSaveShift}
        templates={config.shiftTemplates || []}
        onClose={() => setModals(prev => ({ ...prev, quickAdd: false }))}
      />

      <SettingsModal
        visible={modals.settings}
        config={config}
        shifts={shifts}
        displayDate={displayDate}
        onSave={(newC) => { setConfig(newC); saveData('config', newC); setModals(prev => ({ ...prev, settings: false })); }}
        onClose={() => setModals(prev => ({ ...prev, settings: false }))}
      />

      <FloatingButton
        isVisible={showListFab}
        onPress={() => {
          const today = formatDateLocal(new Date());
          openAddModal(today);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
});
