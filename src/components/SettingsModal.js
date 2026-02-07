import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

export default function SettingsModal({ visible, config, onSave, onClose }) {
  const [form, setForm] = useState(config);

  // עדכון הטופס כשההגדרות משתנות מבחוץ
  useEffect(() => { setForm(config); }, [config]);

  const SettingField = ({ label, value, keyName, placeholder = "0" }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={styles.input} 
        keyboardType="numeric" 
        value={String(value)} 
        placeholder={placeholder}
        placeholderTextColor="#666"
        onChangeText={(v) => setForm({...form, [keyName]: v})} 
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancelText}>ביטול</Text></TouchableOpacity>
          <Text style={styles.title}>הגדרות מערכת</Text>
          <TouchableOpacity onPress={() => onSave(form)}><Text style={styles.saveActionText}>שמור</Text></TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 פרופיל</Text>
            <View style={styles.row}>
              <Text style={styles.label}>שם המשתמש</Text>
              <TextInput 
                style={[styles.input, {width: 150}]} 
                value={form.userName} 
                onChangeText={(v) => setForm({...form, userName: v})} 
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 שכר ומיסוי</Text>
            <SettingField label="שכר שעתי (בסיס)" value={form.hourlyRate} keyName="hourlyRate" />
            <SettingField label="נקודות זיכוי" value={form.creditPoints} keyName="creditPoints" />
            <SettingField label="אחוז פנסיה (למשל 0.06)" value={form.pensionRate} keyName="pensionRate" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕒 שעות נוספות ושבת</Text>
            <SettingField label="התחלה לאחר (שעות)" value={form.overtimeStartThreshold} keyName="overtimeStartThreshold" />
            <SettingField label="שעתיים ראשונות (%)" value={form.overtimeRate1} keyName="overtimeRate1" />
            <SettingField label="מהשעה השלישית (%)" value={form.overtimeRate2} keyName="overtimeRate2" />
            <SettingField label="תעריף שבת/חג (%)" value={form.shabbatRate} keyName="shabbatRate" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚗 תוספות ויעדים</Text>
            <SettingField label="החזר נסיעות חודשי" value={form.travelAllowance} keyName="travelAllowance" />
            <SettingField label="יעד נטו חודשי (₪)" value={form.monthlyGoal} keyName="monthlyGoal" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#333' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelText: { color: '#ff4444', fontSize: 16 },
  saveActionText: { color: '#00adf5', fontSize: 16, fontWeight: 'bold' },
  content: { padding: 15 },
  section: { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 15, marginBottom: 20 },
  sectionTitle: { color: '#00adf5', fontSize: 14, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { color: '#fff', fontSize: 15 },
  input: { backgroundColor: '#2c2c2e', color: '#fff', padding: 10, borderRadius: 8, width: 80, textAlign: 'center' }
});
