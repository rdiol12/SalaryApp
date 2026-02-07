import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // ייבוא הגלגל

export default function SettingsModal({ visible, config, onSave, onClose }) {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => { if (visible) setLocalConfig(config); }, [visible, config]);

  const handleChange = (f, v) => setLocalConfig(prev => ({ ...prev, [f]: v }));

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>הגדרות</Text></View>
        <ScrollView style={styles.content}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>שם משתמש</Text>
            <TextInput style={styles.input} value={localConfig.userName} onChangeText={(v) => handleChange('userName', v)} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>שכר שעתי (₪)</Text>
            <TextInput style={styles.input} value={localConfig.hourlyRate} keyboardType="numeric" onChangeText={(v) => handleChange('hourlyRate', v)} />
          </View>

          {/* גלגל בחירה ליום תחילת חודש */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>יום תחילת חודש שכר</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localConfig.salaryStartDay}
                onValueChange={(v) => handleChange('salaryStartDay', v)}
                dropdownIconColor="#00adf5"
                style={styles.picker}
              >
                {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                  <Picker.Item key={day} label={`ה-${day} לחודש`} value={day.toString()} color="#fff" />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(localConfig)}>
            <Text style={styles.saveText}>שמור</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeText}>ביטול</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#aaa', marginBottom: 8, textAlign: 'right' },
  input: { backgroundColor: '#1c1c1e', color: '#fff', padding: 15, borderRadius: 10, textAlign: 'right' },
  pickerContainer: { backgroundColor: '#1c1c1e', borderRadius: 10, overflow: 'hidden' },
  picker: { color: '#fff' },
  saveBtn: { backgroundColor: '#00adf5', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { padding: 15, alignItems: 'center' },
  closeText: { color: '#aaa' }
});
