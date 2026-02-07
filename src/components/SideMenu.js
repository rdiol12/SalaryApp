import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Dimensions } from 'react-native';
import { calculateNetSalary } from '../utils/calculations';

const { width } = Dimensions.get('window');

export default function SideMenu({ visible, onClose, onOpenSettings, onReset, shifts, config }) {
  // חישוב נתוני הנטו הנוכחיים לצורך פס ההתקדמות
  const totalGross = Object.values(shifts).reduce((sum, s) => sum + (s.earned || 0), 0);
  const stats = calculateNetSalary(
    totalGross, 
    Number(config.creditPoints), 
    Number(config.pensionRate),
    Number(config.travelAllowance)
  );

  const goal = Number(config.monthlyGoal) || 1; // מניעת חילוק ב-0
  const progress = Math.min(stats.net / goal, 1); // אחוז התקדמות (מקסימום 100%)

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* לחיצה מחוץ לתפריט תסגור אותו */}
        <TouchableOpacity style={styles.outsideClose} onPress={onClose} />
        
        <SafeAreaView style={styles.menuContainer}>
          {/* ראש התפריט עם השם */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>שלום,</Text>
            <Text style={styles.userNameText}>{config.userName}</Text>
          </View>

          {/* אזור יעד הנטו ופס התקדמות */}
          <View style={styles.goalSection}>
            <View style={styles.goalLabels}>
              <Text style={styles.goalTitle}>התקדמות ליעד נטו</Text>
              <Text style={styles.goalAmount}>₪{stats.net} / ₪{goal}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.percentageText}>{Math.round(progress * 100)}% מהיעד הושג</Text>
          </View>

          <View style={styles.divider} />

          {/* כפתורי ניווט */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionItem} onPress={onOpenSettings}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>הגדרות פרופיל</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={onReset}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionText}>איפוס נתוני חודש</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>סגור תפריט</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row' },
  outsideClose: { flex: 1 },
  menuContainer: { 
    width: width * 0.75, 
    backgroundColor: '#1c1c1e', 
    height: '100%', 
    padding: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20 
  },
  header: { marginBottom: 40, marginTop: 20 },
  welcomeText: { color: '#aaa', fontSize: 16 },
  userNameText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  goalSection: { marginBottom: 30 },
  goalLabels: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 },
  goalTitle: { color: '#fff', fontSize: 14 },
  goalAmount: { color: '#00adf5', fontSize: 14, fontWeight: 'bold' },
  progressTrack: { height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#00adf5' },
  percentageText: { color: '#666', fontSize: 12, marginTop: 8, textAlign: 'right' },
  divider: { height: 0.5, backgroundColor: '#333', marginBottom: 30 },
  actions: { flex: 1 },
  actionItem: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 25 },
  actionIcon: { fontSize: 22, marginLeft: 15 },
  actionText: { color: '#fff', fontSize: 18 },
  closeBtn: { padding: 15, alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#333' },
  closeBtnText: { color: '#ff4444', fontWeight: 'bold' }
});
