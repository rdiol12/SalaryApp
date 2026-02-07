import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from './src/components/Header';
import CalendarView from './src/components/CalendarView';
import SideMenu from './src/components/SideMenu';
import SettingsModal from './src/components/SettingsModal';
import AddShiftModal from './src/components/AddShiftModal';
import ShiftDetailsModal from './src/components/ShiftDetailsModal';
import PayslipModal from './src/components/PayslipModal';

export default function App() {
  const [shifts, setShifts] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [modals, setModals] = useState({ menu: false, settings: false, shift: false, details: false, payslip: false });

  const [config, setConfig] = useState({
    userName: 'משתמש',
    hourlyRate: '40',
    salaryStartDay: '1',
    travelDaily: '22.60',
    breakDeduction: '30',
    monthlyGoal: '10000',
    overtimeStartThreshold: '9'
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const s = await AsyncStorage.getItem('shifts');
    const c = await AsyncStorage.getItem('config');
    if (s) setShifts(JSON.parse(s));
    if (c) setConfig(prev => ({...prev, ...JSON.parse(c)}));
  };

  const saveData = async (key, data) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    if (shifts[day.dateString]) setModals({...modals, details: true});
    else setModals({...modals, shift: true});
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header shifts={shifts} config={config} onOpenMenu={() => setModals({...modals, menu: true})} />
      <CalendarView shifts={shifts} config={config} selectedDate={selectedDate} onDayPress={handleDayPress} />
      
      <ShiftDetailsModal 
        visible={modals.details} date={selectedDate} shift={shifts[selectedDate]} config={config}
        onClose={() => setModals({...modals, details: false})}
        onDelete={() => {
          const n = {...shifts}; delete n[selectedDate];
          setShifts(n); saveData('shifts', n); setModals({...modals, details: false});
        }}
      />

      <AddShiftModal 
        visible={modals.shift} date={selectedDate} config={config}
        onSave={(date, data) => {
          const n = {...shifts, [date]: data};
          setShifts(n); saveData('shifts', n); setModals({...modals, shift: false});
        }}
        onClose={() => setModals({...modals, shift: false})}
      />

      <SettingsModal 
        visible={modals.settings} config={config}
        onSave={(c) => { setConfig(c); saveData('config', c); setModals({...modals, settings: false}); }}
        onClose={() => setModals({...modals, settings: false})}
      />

      <SideMenu 
        visible={modals.menu} config={config} shifts={shifts}
        onOpenSettings={() => setModals({...modals, menu: false, settings: true})}
        onOpenPayslip={() => setModals({...modals, menu: false, payslip: true})}
        onClose={() => setModals({...modals, menu: false})}
      />

      <PayslipModal visible={modals.payslip} shifts={shifts} config={config} onClose={() => setModals({...modals, payslip: false})} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#121212' } });
