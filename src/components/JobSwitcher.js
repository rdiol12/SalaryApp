import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../constants/theme.js";

/**
 * Row of job chips under the header. Shown only when the worker has more
 * than one job; the selected job is the one the calendar, list and stats show.
 */
export default function JobSwitcher({ jobs, activeJobId, onSelect }) {
  if (!jobs || jobs.length < 2) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {jobs.map((job) => {
          const active = job.id === activeJobId;
          return (
            <TouchableOpacity
              key={job.id}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.7}
              onPress={() => {
                if (active) return;
                try {
                  Haptics.selectionAsync();
                } catch (e) {
                  // ignore
                }
                onSelect(job.id);
              }}
            >
              <Ionicons
                name={job.isPrimary ? "briefcase" : "briefcase-outline"}
                size={14}
                color={active ? "#fff" : T.accent}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {job.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: T.bg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  row: {
    flexDirection: "row-reverse",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexGrow: 1,
  },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.accent,
    backgroundColor: T.cardBg,
  },
  chipActive: {
    backgroundColor: T.accent,
  },
  chipText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#fff",
  },
});
