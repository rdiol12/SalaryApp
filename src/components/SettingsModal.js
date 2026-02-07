import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Switch } from 'react-native';

export default function SettingsModal({ visible, config, onSave, onClose }) {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => { if (visible) setLocalConfig(config); }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancelText}>ביטול</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>הגדרות</Text>
          <TouchableOpacity onPress={() => onSave(localConfig)}><Text style={styles.saveTextTop}>שמור</Text></TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionLabel}>מחזור שכר</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rangeBox}>
                <TextInput style={styles.rangeInput} value={localConfig.salaryEndDay} onChangeText={(v) => setLocalConfig({...localConfig, salaryEndDay: v})} keyboardType="numeric" />
                <Text style={styles.rangeText}> עד </Text>
                <TextInput style={styles.rangeInput} value={localConfig.salaryStartDay} onChangeText={(v) => setLocalConfig({...localConfig, salaryStartDay: v})} keyboardType="numeric" />
                <Text style={styles.rangeText}>מה-</Text>
              </View>
              <Text style={styles.label}>ימי מחזור</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>הפסקות</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Switch 
                value={localConfig.isBreakDeducted} 
                onValueChange={(v) => setLocalConfig({...localConfig, isBreakDeducted: v})}
                trackColor={{ false: "#3a3a3c", true: "#4cd964" }}
              />
              <Text style={styles.label}>לקזז הפסקה אוטומטית?</Text>
            </View>
            {localConfig.isBreakDeducted && (
              <View style={styles.inputRow}>
                <TextInput style={styles.input} value={localConfig.breakDeduction} onChangeText={(v) => setLocalConfig({...localConfig, breakDeduction: v})} keyboardType="numeric" />
                <Text style={styles.label}>דקות להורדה</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>שכר ובסיס</Text>
          <View style={styles.card}>
            <SettingInput label="שכר שעתי" value={localConfig.hourlyRate} onChange={(v) => setLocalConfig({...localConfig, hourlyRate: v})} />
            <SettingInput label="נסיעות יומי" value={localConfig.travelDaily} onChange={(v) => setLocalConfig({...localConfig, travelDaily: v})} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const SettingInput = ({ label, value, onChange }) => (
  <View style={styles.inputRow}>
    <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType="numeric" />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  cancelText: { color: '#ff3b30' },
  saveTextTop: { color: '#00adf5' },
  content: { padding: 16 },
  sectionLabel: { color: '#8e8e93', fontSize: 12, marginBottom: 8, marginTop: 20, textAlign: 'right' },
  card: { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  label: { color: '#fff' },
  input: { color: '#00adf5', fontSize: 16, textAlign: 'left', flex: 1 },
  rangeBox: { flexDirection: 'row', alignItems: 'center' },
  rangeInput: { color: '#00adf5', backgroundColor: '#2c2c2e', padding: 5, borderRadius: 5, width: 35, textAlign: 'center' },
  rangeText: { color: '#8e8e93', marginHorizontal: 5 }
});
