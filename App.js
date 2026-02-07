import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, TouchableOpacity, Text, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ייבוא הרכיבים (וודא שכולם קיימים בתיקיית components)
import Header from './src/components/Header';
import CalendarView from './src/components/CalendarView';
import ListView from './src/components/ListView'; // הרכיב החדש שיצרנו
import SideMenu from './src/components/SideMenu';
import SettingsModal from './src/components/SettingsModal';
import AddShiftModal from './src/components/AddShiftModal';
import ShiftDetailsModal from './src/components/ShiftDetailsModal';
import PayslipModal from './src/components/PayslipModal';

export default function App() {
  // --- מצבי תצוגה ונתונים ---
  const [shifts, setShifts] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' או 'list'
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // --- ניהול מודלים ---
  const [modals, setModals] = useState({ 
    menu: false, settings: false, shift: false, details: false, payslip: false 
  });

  // --- הגדרות משתמש ---
  const [config, setConfig] = useState({
    userName: 'משתמש',
    hourlyRate: '40',
    salaryStartDay: '1',
    travelDaily: '22.60',
    breakDeduction: '30',
    monthlyGoal: '10000',
    overtimeStartThreshold: '9'
  });

  // --- טעינה ושמירה ---
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const s = await AsyncStorage.getItem('shifts');
      const c = await AsyncStorage.getItem('config');
      if (s) setShifts(JSON.parse(s));
      if (c) setConfig(prev => ({ ...prev, ...JSON.parse(c) }));
    } catch (e) { console.error("שגיאה בטעינה", e); }
  };

  const saveData = async (key, data) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch (e) { Alert.alert("שגיאה בשמירה"); }
  };

  // --- לוגיקת לחיצה על יום/משמרת ---
  const handleDayPress = (day) => {
    const dateStr = typeof day === 'string' ? day : day.dateString;
    setSelectedDate(dateStr);
    if (shifts[dateStr]) {
      setModals({ ...modals, details: true });
    } else {
      setModals({ ...modals, shift: true });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* כפתור החלפת תצוגה צף */}
      <TouchableOpacity 
        style={styles.viewToggle} 
        onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
      >
        <Text style={styles.toggleText}>
          {viewMode === 'calendar' ? '☰ רשימה' : '📅 לוח שנה'}
        </Text>
      </TouchableOpacity>

      {/* כותרת ראשית */}
      <Header 
        shifts={shifts} 
        config={config} 
        onOpenMenu={() => setModals({ ...modals, menu: true })} 
      />
      
      {/* תצוגה מותנית: לוח שנה או רשימה */}
      {viewMode === 'calendar' ? (
        <CalendarView 
          shifts={shifts} 
          config={config} 
          selectedDate={selectedDate} 
          onDayPress={handleDayPress} 
        />
      ) : (
        <ListView 
          shifts={shifts} 
          config={config} 
          selectedMonth={currentMonth}
          selectedYear={currentYear}
          onShiftPress={handleDayPress}
        />
      )}

      {/* --- כל המודלים --- */}
      <ShiftDetailsModal 
        visible={modals.details} date={selectedDate} shift={shifts[selectedDate]} config={config}
        onClose={() => setModals({ ...modals, details: false })}
        onDelete={() => {
          const n = { ...shifts }; delete n[selectedDate];
          setShifts(n); saveData('shifts', n); setModals({ ...modals, details: false });
        }}
      />

      <AddShiftModal 
        visible={modals.shift} date={selectedDate} config={config}
        onSave={(date, data) => {
          const n = { ...shifts, [date]: data };
          setShifts(n); saveData('shifts', n); setModals({ ...modals, shift: false });
        }}
        onClose={() => setModals({ ...modals, shift: false })}
      />

      <SettingsModal 
        visible={modals.settings} config={config}
        onSave={(c) => { setConfig(c); saveData('config', c); setModals({ ...modals, settings: false }); }}
        onClose={() => setModals({ ...modals, settings: false })}
      />

      <SideMenu 
        visible={modals.menu} config={config} shifts={shifts}
        onOpenSettings={() => setModals({ ...modals, menu: false, settings: true })}
        onOpenPayslip={() => setModals({ ...modals, menu: false, payslip: true })}
        onClose={() => setModals({ ...modals, menu: false })}
      />

      <PayslipModal 
        visible={modals.payslip} shifts={shifts} config={config} 
        onClose={() => setModals({ ...modals, payslip: false })} 
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  viewToggle: {
    position: 'absolute',
    top: 50, 
    left: 20,
    backgroundColor: '#1c1c1e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 999, // מוודא שהכפתור תמיד מעל הכל
  },
  toggleText: { color: '#00adf5', fontSize: 13, fontWeight: 'bold' }
});
