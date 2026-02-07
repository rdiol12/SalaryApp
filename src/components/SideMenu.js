import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Linking } from 'react-native';
import { calculateNetSalary } from '../utils/calculations';

// הוספנו onOpenStats לרשימת ה-Props
export default function SideMenu({ visible, onClose, onOpenSettings, onOpenPayslip, onOpenStats, onReset, shifts, config }) {
  const stats = calculateNetSalary(shifts, config);
  const goal = Number(config.monthlyGoal) || 1;
  const progress = Math.min(stats.net / goal, 1);

  const shareToWhatsApp = () => {
    let msg = `📋 *דו"ח שכר ל-${config.userName}*\n\n`;
    Object.keys(shifts).sort().forEach(date => {
      const s = shifts[date];
      msg += `• ${date}: ${s.type} (${s.totalHours} ש')\n`;
    });
    msg += `\n💰 *סיכום:*\nברוטו: ₪${stats.gross}\nנטו משוער: *₪${stats.net}*`;
    
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`)
      .catch(() => alert('וודא ש-WhatsApp מותקנת'));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.outside} onPress={onClose} />
        <SafeAreaView style={styles.menu}>
          <Text style={styles.userName}>{config.userName}</Text>
          
          <View style={styles.progressArea}>
            <Text style={styles.goalText}>יעד נטו: ₪${goal}</Text>
            <View style={styles.track}><View style={[styles.bar, {width: `${progress*100}%`}]} /></View>
          </View>

          <TouchableOpacity style={styles.item} onPress={onOpenSettings}>
            <Text style={styles.itemText}>⚙️ הגדרות פרופיל</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onOpenStats}>
            <Text style={styles.itemText}>📊 סטטיסטיקה וגרפים</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onOpenPayslip}>
            <Text style={styles.itemText}>📄 השוואת תלוש שכר</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={shareToWhatsApp}>
            <Text style={styles.itemText}>🟢 שלח דו"ח ב-WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.item, {marginTop: 'auto'}]} onPress={onReset}>
            <Text style={[styles.itemText, {color: '#ff4444'}]}>🗑️ איפוס נתוני חודש</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row-reverse' },
  outside: { flex: 1 },
  menu: { width: 280, backgroundColor: '#1c1c1e', padding: 20 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'right' },
  progressArea: { marginBottom: 40 },
  goalText: { color: '#aaa', marginBottom: 10, textAlign: 'right' },
  track: { height: 6, backgroundColor: '#333', borderRadius: 3 },
  bar: { height: 6, backgroundColor: '#00adf5', borderRadius: 3 },
  item: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  itemText: { color: '#fff', fontSize: 16, textAlign: 'right' }
});
