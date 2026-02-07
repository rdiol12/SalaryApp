import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ייבוא הרכיבים
import Header from './src/components/Header';
import CalendarView from './src/components/CalendarView';
import FloatingButton from './src/components/FloatingButton';
import SideMenu from './src/components/SideMenu';
import SettingsModal from './src/components/SettingsModal';
import AddShiftModal from './src/components/AddShiftModal';
import PayslipModal from './src/components/PayslipModal';
import StatsModal from './src/components/StatsModal';
import ShiftDetailsModal from './src/components/ShiftDetailsModal'; // הרכיב החדש

export default function App() {
  const [shifts, setShifts] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  
  // ניהול המודלים - הוספנו את details
  const [modals, setModals] = useState({ 
    menu: false, 
    settings: false, 
    shift: false, 
    payslip: false,
    stats: false,
    details: false 
  });

  const [config, setConfig] = useState({
    userName: 'משתמש',
    hourlyRate: '40',
    creditPoints: '2.25',
    pensionRate: '0.06',
    monthlyGoal: '10000',
    travelAllowance: '0',
    overtimeStartThreshold: '9',
    overtimeRate1: '1.25',
    overtimeRate2: '1.5',
    shabbatRate: '1.5'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedShifts = await AsyncStorage.getItem('shifts');
      const savedConfig = await AsyncStorage.getItem('config');
      if (savedShifts) setShifts(JSON.parse(savedShifts));
      if (savedConfig) setConfig(JSON.parse(savedConfig));
    } catch (e) {
      console.error("שגיאה בטעינת נתונים", e);
    }
  };

  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      Alert.alert("שגיאה", "לא הצלחנו לשמור");
    }
  };

  // פונקציית לחיצה על יום בלוח השנה
  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    
    // אם כבר קיימת משמרת בתאריך הזה - פתח את מסך הפירוט
    if (shifts[dateStr]) {
      setModals({ ...modals, details: true });
    } else {
      // אם אין משמרת - הכפתור הצף יפתח את מודל ההוספה
    }
  };

  const handleReset = () => {
    Alert.alert("איפוס", "למחוק הכל?", [
      { text: "ביטול" },
      { text: "מחק", onPress: () => { setShifts({}); saveData('shifts', {}); setModals({...modals, menu: false}); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        shifts={shifts} 
        config={config} 
        onOpenMenu={() => setModals({ ...modals, menu: true })} 
      />
      
      <CalendarView 
        shifts={shifts} 
        config={config} 
        selectedDate={selectedDate} 
        onDayPress={handleDayPress} // משתמש בפונקציה החדשה שלנו
      />

      <FloatingButton 
        isVisible={selectedDate !== '' && !shifts[selectedDate]} 
        onPress={() => setModals({ ...modals, shift: true })} 
      />

      {/* מודל פירוט משמרת (המסך שביקשת) */}
      <ShiftDetailsModal 
        visible={modals.details}
        date={selectedDate}
        shift={shifts[selectedDate]}
        config={config}
        onClose={() => setModals({ ...modals, details: false })}
        onDelete={() => {
          const newShifts = { ...shifts };
          delete newShifts[selectedDate];
          setShifts(newShifts);
          saveData('shifts', newShifts);
          setModals({ ...modals, details: false });
        }}
      />

      {/* שאר המודלים (נשארים אותו דבר) */}
      <SideMenu 
        visible={modals.menu} 
        config={config} 
        shifts={shifts}
        onOpenSettings={() => setModals({ ...modals, menu: false, settings: true })} 
        onOpenStats={() => setModals({ ...modals, menu: false, stats: true })}
        onOpenPayslip={() => setModals({ ...modals, menu: false, payslip: true })}
        onClose={() => setModals({ ...modals, menu: false })} 
        onReset={handleReset}
      />

      <StatsModal 
        visible={modals.stats}
        shifts={shifts}
        config={config}
        onClose={() => setModals({ ...modals, stats: false })}
      />

      <PayslipModal 
        visible={modals.payslip}
        shifts={shifts}
        config={config}
        onClose={() => setModals({ ...modals, payslip: false })}
      />

      <SettingsModal 
        visible={modals.settings} 
        config={config} 
        onSave={(newConfig) => {
          setConfig(newConfig);
          saveData('config', newConfig);
          setModals({ ...modals, settings: false });
        }} 
        onClose={() => setModals({ ...modals, settings: false })} 
      />

      <AddShiftModal 
        visible={modals.shift} 
        date={selectedDate} 
        config={config} 
        onSave={(date, shiftData) => {
          const newShifts = { ...shifts, [date]: shiftData };
          setShifts(newShifts);
          saveData('shifts', newShifts);
          setModals({ ...modals, shift: false });
        }} 
        onClose={() => setModals({ ...modals, shift: false })} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
});
