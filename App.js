import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Alert, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ייבוא הרכיבים מהתיקייה src/components
import Header from './src/components/Header';
import CalendarView from './src/components/CalendarView';
import FloatingButton from './src/components/FloatingButton';
import SideMenu from './src/components/SideMenu';
import SettingsModal from './src/components/SettingsModal';
import AddShiftModal from './src/components/AddShiftModal';
import PayslipModal from './src/components/PayslipModal';

export default function App() {
  const [shifts, setShifts] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  
  // ניהול כל חלונות המודל במקום אחד
  const [modals, setModals] = useState({ 
    menu: false, 
    settings: false, 
    shift: false, 
    payslip: false 
  });

  // הגדרות ברירת מחדל
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

  // טעינת נתונים ראשונית מהזיכרון של הטלפון
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

  // פונקציית עזר לשמירת נתונים
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
      "האם אתה בטוח שברצונך למחוק את כל המשמרות של החודש?",
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
      {/* כותרת עליונה - מציגה נטו וברוטו בזמן אמת */}
      <Header 
        shifts={shifts} 
        config={config} 
        onOpenMenu={() => setModals({ ...modals, menu: true })} 
      />
      
      {/* לוח השנה */}
      <CalendarView 
        shifts={shifts} 
        config={config} 
        selectedDate={selectedDate} 
        onDayPress={setSelectedDate} 
      />

      {/* כפתור הוספת משמרת (מופיע רק כשנבחר תאריך) */}
      <FloatingButton 
        isVisible={selectedDate !== ''} 
        onPress={() => setModals({ ...modals, shift: true })} 
      />

      {/* תפריט צד (המבורגר) */}
      <SideMenu 
        visible={modals.menu} 
        config={config} 
        shifts={shifts}
        onOpenSettings={() => setModals({ ...modals, menu: false, settings: true })} 
        onOpenPayslip={() => setModals({ ...modals, menu: false, payslip: true })} 
        onClose={() => setModals({ ...modals, menu: false })} 
        onReset={handleReset}
      />

      {/* מודל סימולציית תלוש שכר */}
      <PayslipModal 
        visible={modals.payslip}
        shifts={shifts}
        config={config}
        onClose={() => setModals({ ...modals, payslip: false })}
      />

      {/* מודל הגדרות פרופיל ושכר */}
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

      {/* מודל הוספת משמרת חדשה */}
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
    backgroundColor: '#121212', // רקע כהה תואם ל-Dark Mode
  },
});
