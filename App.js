import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from './src/components/Header';
import CalendarView from './src/components/CalendarView';
import ListView from './src/components/ListView';
import AdvancedStats from './src/components/AdvancedStats';
import SettingsModal from './src/components/SettingsModal';
import ShiftDetailsModal from './src/components/ShiftDetailsModal';

export default function App() {
  const [shifts, setShifts] = useState({});
  const [viewMode, setViewMode] = useState('calendar');
  const [displayDate, setDisplayDate] = useState(new Date());
  const [modals, setModals] = useState({ settings: false, add: false });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingData, setEditingData] = useState(null);

  const [config, setConfig] = useState({
    userName: 'משתמש',
    hourlyRate: '40',
    salaryStartDay: '25',
    salaryEndDay: '24',
    isBreakDeducted: true,
    breakDeduction: '30',
    travelDaily: '22.60',
    monthlyGoal: '10000',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const s = await AsyncStorage.getItem('shifts');
      const c = await AsyncStorage.getItem('config');
      if (s) setShifts(JSON.parse(s));
      if (c) setConfig(prev => ({ ...prev, ...JSON.parse(c) }));
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

  const calculateEarned = (dateStr, data) => {
    let hours = Number(data.totalHours);
    const rate = Number(config.hourlyRate);
    const percent = Number(data.hourlyPercent || 100) / 100;

    if (config.isBreakDeducted && hours > 6) {
      hours -= Number(config.breakDeduction) / 60;
    }

    if (data.type === 'מחלה') {
      const daySeq = getSickDaySequence(dateStr);
      if (daySeq === 1) return 0;
      if (daySeq === 2 || daySeq === 3) return hours * rate * 0.5;
      return hours * rate;
    }

    const base = hours * rate * percent;
    return base + Number(data.bonus || 0) + Number(config.travelDaily || 0);
  };

  const getSickDaySequence = (dateStr) => {
    let count = 1;
    let curr = new Date(dateStr);
    while (true) {
      curr.setDate(curr.getDate() - 1);
      const prev = curr.toISOString().split('T')[0];
      if (shifts[prev] && shifts[prev].type === 'מחלה') count++;
      else break;
    }
    return count;
  };

  const getFilteredShifts = () => {
    const start = parseInt(config.salaryStartDay);
    const end = parseInt(config.salaryEndDay);
    const targetMonth = displayDate.getMonth();
    const targetYear = displayDate.getFullYear();

    return Object.keys(shifts).filter(dStr => {
      const d = new Date(dStr);
      const day = d.getDate();
      const m = d.getMonth();
      const y = d.getFullYear();

      if (start === 1) return m === targetMonth && y === targetYear;

      // Cross-month cycle with correct year handling (e.g. Jan looks back to Dec of prev year)
      const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
      const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;

      const isPrevMonthMatch = (m === prevMonth && y === prevYear && day >= start);
      const isCurrMonthMatch = (m === targetMonth && y === targetYear && day <= end);

      return isPrevMonthMatch || isCurrMonthMatch;
    }).map(date => ({
      date,
      ...shifts[date],
      earned: calculateEarned(date, shifts[date]),
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleSaveShift = (date, data) => {
    const newShifts = { ...shifts, [date]: data };
    setShifts(newShifts);
    saveData('shifts', newShifts);
    setModals({ ...modals, add: false });
    setEditingData(null);
  };

  const handleDeleteShift = (date) => {
    const newShifts = { ...shifts };
    delete newShifts[date];
    setShifts(newShifts);
    saveData('shifts', newShifts);
  };

  const openEditModal = (date, data) => {
    setSelectedDate(date);
    setEditingData(data);
    setModals({ ...modals, add: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Header
        config={config}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenSettings={() => setModals({ ...modals, settings: true })}
      />

      {viewMode === 'calendar' && (
        <CalendarView
          shifts={shifts}
          config={config}
          selectedDate={selectedDate}
          onDayPress={(dateString) => {
            setSelectedDate(dateString);
            setEditingData(shifts[dateString] || null);
            setModals({ ...modals, add: true });
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
        />
      )}

      <ShiftDetailsModal
        visible={modals.add}
        date={selectedDate}
        existingData={editingData}
        onSave={handleSaveShift}
        onClose={() => { setModals({ ...modals, add: false }); setEditingData(null); }}
      />

      <SettingsModal
        visible={modals.settings}
        config={config}
        onSave={(newC) => { setConfig(newC); saveData('config', newC); setModals({ ...modals, settings: false }); }}
        onClose={() => setModals({ ...modals, settings: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
