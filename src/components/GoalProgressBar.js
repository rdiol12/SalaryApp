import React from 'react';
import { View, Text } from 'react-native';

export default function GoalProgressBar({ current, goal, theme }) {
  const progress = Math.min(current / (parseFloat(goal) || 1), 1);
  const isGoalReached = progress >= 1;

  return (
    <View style={{ marginVertical: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ color: theme.text, fontWeight: 'bold' }}>התקדמות ליעד</Text>
        <Text style={{ color: isGoalReached ? '#34C759' : theme.accent }}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={{ height: 12, backgroundColor: '#2C2C2E', borderRadius: 6, overflow: 'hidden' }}>
        <View style={{ 
          height: '100%', 
          width: `${progress * 100}%`, 
          backgroundColor: isGoalReached ? '#34C759' : theme.accent,
          shadowColor: isGoalReached ? '#34C759' : theme.accent,
          shadowRadius: 5, shadowOpacity: 0.5 
        }} />
      </View>
    </View>
  );
}
