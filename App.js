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
import StatsModal from './src/components/StatsModal'; // ייבוא רכיב הגרפים החדש

export default function App() {
  const [shifts, setShifts] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  
  // ניהול המודלים - הוספנו את stats
  const [modals, setModals] = useState({ 
    menu: false, 
    settings: false, 
    shift: false, 
    payslip: false,
    stats: false 
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
      Alert.alert("שגיאה", "לא הצלחנו לשמור את השינוי");
    }
  };

  const handleReset = () => {
    Alert.alert(
      "איפוס נתונים",
      "האם אתה בטוח שברצונך למחוק את כל המשמרות?",
      [
        { text: "ביטול", style: "cancel" },
        { 
          text: "מחק הכל", 
          style: "destructive", 
          onPress: () => {
            setShifts({});
            saveData('shifts', {});
            setModals({ ...modals, menu: false });
          } 
        }
      ]
    );
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
        onDayPress={setSelectedDate} 
      />

      <FloatingButton 
        isVisible={selectedDate !== ''} 
        onPress={() => setModals({ ...modals, shift: true })} 
      />

      {/* תפריט צד מעודכן */}
      <SideMenu 
        visible={modals.menu} 
        config={config} 
        shifts={shifts}
        onOpenSettings={() => setModals({ ...modals, menu: false, settings: true })} 
        onOpenStats={() => setModals({ ...modals, menu: false, stats: true })} // פתיחת גרפים
        onOpenPayslip={() => setModals({ ...modals, menu: false, payslip: true })} // פתיחת תלוש
        onClose={() => setModals({ ...modals, menu: false })} 
        onReset={handleReset}
      />

      {/* מודל גרפים וסטטיסטיקה */}
      <StatsModal 
        visible={modals.stats}
        shifts={shifts}
        config={config}
        onClose={() => setModals({ ...modals, stats: false })}
      />

      {/* מודל תלוש שכר */}
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
