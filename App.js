import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ייבוא הרכיבים המפוצלים
import Header from './src/components/Header';
import CalendarView from './src/components/CalendarView';
import FloatingButton from './src/components/FloatingButton';
import SideMenu from './src/components/SideMenu';
import SettingsModal from './src/components/SettingsModal';
import AddShiftModal from './src/components/AddShiftModal';

export default function App() {
  const [shifts, setShifts] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [modals, setModals] = useState({ menu: false, settings: false, shift: false });
  
  // הגדרות ראשוניות עם כל השדות החדשים
  const [config, setConfig] = useState({
    userName: 'אורח',
    hourlyRate: '40',
    nightMultiplier: '1.5',
    nightStart: '22',
    nightEnd: '06',
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
      const saved = await AsyncStorage.multiGet(['shifts', 'config']);
      if (saved[0][1]) setShifts(JSON.parse(saved[0][1]));
      if (saved[1][1]) setConfig(JSON.parse(saved[1][1]));
    } catch (e) {
      console.error("טעינת נתונים נכשלה", e);
    }
  };

  // פונקציה מרכזית לעדכון ושמירת נתונים
  const updateData = async (key, value) => {
    try {
      if (key === 'config') {
        setConfig(value);
      } else {
        setShifts(value);
      }
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      Alert.alert("שגיאה", "השמירה נכשלה");
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
          onPress: () => updateData('shifts', {}) 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* כותרת - מציגה נטו, ברוטו ודמי מחלה */}
      <Header 
        shifts={shifts} 
        config={config} 
        onOpenMenu={() => setModals({...modals, menu: true})} 
      />
      
      {/* לוח שנה - מציג נקודות צבעוניות לפי סוג יום */}
      <CalendarView 
        shifts={shifts} 
        config={config} 
        selectedDate={selectedDate} 
        onDayPress={setSelectedDate} 
      />

      {/* כפתור הוספה צף - מופיע רק כשנבחר תאריך */}
      <FloatingButton 
        isVisible={selectedDate !== ''} 
        onPress={() => setModals({...modals, shift: true})} 
      />

      {/* תפריט צד - כולל פס התקדמות ליעד ושיתוף ל-WhatsApp */}
      <SideMenu 
        visible={modals.menu} 
        config={config} 
        shifts={shifts}
        onOpenSettings={() => setModals({menu: false, settings: true})} 
        onClose={() => setModals({...modals, menu: false})} 
        onReset={handleReset}
      />

      {/* מודל הגדרות - שכר, פנסיה, נקודות זיכוי וכו' */}
      <SettingsModal 
        visible={modals.settings} 
        config={config} 
        onSave={(newConfig) => {
          updateData('config', newConfig);
          setModals({...modals, settings: false});
        }} 
        onClose={() => setModals({...modals, settings: false})} 
      />

      {/* מודל הוספת משמרת - בחירת סוג (עבודה/שבת/חופש/מחלה) */}
      <AddShiftModal 
        visible={modals.shift} 
        date={selectedDate} 
        config={config} 
        onSave={(date, data) => {
          updateData('shifts', {...shifts, [date]: data});
          setModals({...modals, shift: false});
        }} 
        onClose={() => setModals({...modals, shift: false})} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // צבע רקע כהה לכל האפליקציה
  },
});
