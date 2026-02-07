import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [config, setConfig] = useState({
    userName: 'אורח', hourlyRate: '40', nightMultiplier: '1.5', nightStart: '22', nightEnd: '06',
    creditPoints: '2.25', pensionRate: '0.06', monthlyGoal: '10000', travelAllowance: '0',
    overtimeStartThreshold: '9', overtimeRate1: '1.25', overtimeRate2: '1.5', shabbatRate: '1.5'
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const saved = await AsyncStorage.multiGet(['shifts', 'config']);
    if (saved[0][1]) setShifts(JSON.parse(saved[0][1]));
    if (saved[1][1]) setConfig(JSON.parse(saved[1][1]));
  };

  const updateData = async (key, value) => {
    if (key === 'config') setConfig(value);
    else setShifts(value);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header shifts={shifts} config={config} onOpenMenu={() => setModals({...modals, menu: true})} />
      <CalendarView shifts={shifts} config={config} selectedDate={selectedDate} onDayPress={setSelectedDate} />
      <FloatingButton isVisible={selectedDate !== ''} onPress={() => setModals({...modals, shift: true})} />
      
      <SideMenu visible={modals.menu} config={config} shifts={shifts} onOpenSettings={() => setModals({menu: false, settings: true})} onClose={() => setModals({...modals, menu: false})} onReset={() => updateData('shifts', {})} />
      <SettingsModal visible={modals.settings} config={config} onSave={(c) => { updateData('config', c); setModals({...modals, settings: false}); }} onClose={() => setModals({...modals, settings: false})} />
      <AddShiftModal visible={modals.shift} date={selectedDate} config={config} onSave={(date, data) => { updateData('shifts', {...shifts, [date]: data}); setModals({...modals, shift: false}); }} onClose={() => setModals({...modals, shift: false})} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#121212' } });
