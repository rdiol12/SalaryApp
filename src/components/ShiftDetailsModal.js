import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

export default function AddShiftModal({ visible, date, existingData, onSave, onClose }) {
  const [shift, setShift] = useState({
    startTime: '08:00', endTime: '17:00', totalHours: '9',
    type: 'עבודה', bonus: '0', notes: '', hourlyPercent: '100'
  });

  useEffect(() => {
    if (existingData) setShift(existingData);
    else setShift({ startTime: '08:00', endTime: '17:00', totalHours: '9', type: 'עבודה', bonus: '0', notes: '', hourlyPercent: '100' });
  }, [visible, existingData]);

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={{color:'#ff3b30'}}>ביטול</Text></TouchableOpacity>
          <Text style={{color:'#fff', fontWeight:'bold'}}>{date}</Text>
          <TouchableOpacity onPress={() => onSave(date, shift)}><Text style={{color:'#00adf5'}}>שמור</Text></TouchableOpacity>
        </View>
        <ScrollView style={{padding: 20}}>
          <Text style={styles.label}>שעות (כניסה - יציאה)</Text>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <TextInput style={styles.inputHalf} value={shift.endTime} onChangeText={(v)=>setShift({...shift, endTime:v})} />
            <TextInput style={styles.inputHalf} value={shift.startTime} onChangeText={(v)=>setShift({...shift, startTime:v})} />
          </View>
          <Text style={styles.label}>סה"כ שעות עבודה</Text>
          <TextInput style={styles.inputFull} value={shift.totalHours} onChangeText={(v)=>setShift({...shift, totalHours:v})} keyboardType="numeric" />
          <Text style={styles.label}>אחוז שכר (100, 150...)</Text>
          <TextInput style={styles.inputFull} value={shift.hourlyPercent} onChangeText={(v)=>setShift({...shift, hourlyPercent:v})} keyboardType="numeric" />
          <Text style={styles.label}>הערות</Text>
          <TextInput style={styles.notes} value={shift.notes} onChangeText={(v)=>setShift({...shift, notes:v})} multiline placeholder="הערות למשמרת..." placeholderTextColor="#444" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  label: { color: '#8e8e93', marginTop: 15, marginBottom: 5, textAlign: 'right' },
  inputHalf: { backgroundColor: '#1c1c1e', color: '#fff', padding: 12, borderRadius: 8, width: '48%', textAlign: 'center' },
  inputFull: { backgroundColor: '#1c1c1e', color: '#fff', padding: 12, borderRadius: 8, textAlign: 'right' },
  notes: { backgroundColor: '#1c1c1e', color: '#fff', padding: 12, borderRadius: 8, height: 100, textAlign: 'right' }
});
