import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from './src/components/Header';
import CalendarView from './src/components/CalendarView';
import ListView from './src/components/ListView';
import AdvancedStats from './src/components/AdvancedStats';
import SettingsModal from './src/components/SettingsModal';
import AddShiftModal from './src/components/AddShiftModal';

export default function App() {
  const [shifts, setShifts] = useState({});
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'list', 'stats'
  const [displayDate, setDisplayDate] = useState(new Date());
  const [modals, setModals] = useState({ settings: false, add: false });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [config, setConfig] = useState({
    userName: 'משתמש',
    hourlyRate: '40',
    salaryStartDay: '25', 
    salaryEndDay: '24',   
    isBreakDeducted: true,
    breakDeduction: '30',
    travelDaily: '22.60',
    monthlyGoal: '10000',
    overtimeStartThreshold: '9'
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const s = await AsyncStorage.getItem('shifts');
      const c = await AsyncStorage.getItem('config');
      if (s) setShifts(JSON.parse(s));
      if (c) setConfig(prev => ({ ...prev, ...JSON.parse(c) }));
    } catch (e) { console.error(e); }
  };

  const saveData = async (key, data) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  // --- לוגיקת חישוב שכר מפורטת ---
  const calculateShiftEarned = (dateStr, data) => {
    let hours = Number(data.totalHours);
    const rate = Number(config.hourlyRate);
    
    // ניכוי הפסקה (רק אם מופעל ורק מעל 6 שעות)
    if (config.isBreakDeducted && hours > 6) {
      hours -= (Number(config.breakDeduction) / 60);
    }

    if (data.type === 'מחלה') {
      const daySeq = getSickDaySequence(dateStr);
      if (daySeq === 1) return 0;
      if (daySeq === 2 || daySeq === 3) return (hours * rate * 0.5);
      return (hours * rate);
    }

    const threshold = Number(config.overtimeStartThreshold);
    const regHours = Math.min(hours, threshold);
    const ot125 = Math.max(0, Math.min(hours - threshold, 2));
    const ot150 = Math.max(0, hours - threshold - 2);

    const baseEarned = (regHours * rate) + (ot125 * rate * 1.25) + (ot150 * rate * 1.5);
    const bonus = Number(data.bonus || 0);
    const travel = Number(config.travelDaily || 0);

    return baseEarned + bonus + travel;
  };

  const getSickDaySequence = (dateStr) => {
    let count = 1;
    let current = new Date(dateStr);
    while (true) {
      current.setDate(current.getDate() - 1);
      const prev = current.toISOString().split('T')[0];
      if (shifts[prev] && shifts[prev].type === 'מחלה') count++;
      else break;
    }
    return count;
  };

  // --- סינון לפי מחזור שכר אישי ---
  const getFilteredShifts = () => {
    const start = parseInt(config.salaryStartDay);
    const end = parseInt(config.salaryEndDay);
    const targetM = displayDate.getMonth();
    const targetY = displayDate.getFullYear();

    return Object.keys(shifts).filter(dStr => {
      const d = new Date(dStr);
      const day = d.getDate();
      const m = d.getMonth();
      const y = d.getFullYear();

      if (start === 1) return m === targetM && y === targetY;

      const isPrev = (m === (targetM === 0 ? 11 : targetM - 1) && day >= start);
      const isCurr = (m === targetM && day <= end);
      return isPrev || isCurr;
    }).map(date => ({ 
      date, 
      ...shifts[date], 
      earned: calculateShiftEarned(date, shifts[date]) 
    })).sort((a,b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        config={config} 
        viewMode={viewMode} 
        setViewMode={setViewMode}
        onOpenSettings={() => setModals({...modals, settings: true})}
      />

      {viewMode === 'calendar' && (
        <CalendarView shifts={shifts} onDayPress={(d) => { setSelectedDate(d.dateString); setModals({...modals, add: true}); }} />
      )}

      {viewMode === 'list' && (
        <ListView 
          monthlyShifts={getFilteredShifts()} 
          onDelete={(d) => {
            const n = {...shifts}; delete n[d];
            setShifts(n); saveData('shifts', n);
          }}
        />
      )}

      {viewMode === 'stats' && (
        <AdvancedStats monthlyShifts={getFilteredShifts()} config={config} />
      )}

      <SettingsModal 
        visible={modals.settings} 
        config={config} 
        onSave={(c) => { setConfig(c); saveData('config', c); setModals({...modals, settings: false}); }}
        onClose={() => setModals({...modals, settings: false})}
      />

      <AddShiftModal 
        visible={modals.add} 
        date={selectedDate}
        onSave={(date, data) => {
          const n = {...shifts, [date]: data};
          setShifts(n); saveData('shifts', n); setModals({...modals, add: false});
        }}
        onClose={() => setModals({...modals, add: false})}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }
});
