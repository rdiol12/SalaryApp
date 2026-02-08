import { parseDateLocal } from "./shiftFilters.js";

// Hebrew Type Constants
export const TYPE_WORK = "עבודה";
export const TYPE_SABBATH = "שבת";
export const TYPE_SICK = "מחלה";
export const TYPE_VACATION = "חופש";

export const SHIFT_TYPES = [
  {
    label: "עבודה",
    value: TYPE_WORK,
    icon: "briefcase-outline",
    color: "#3E8ED0",
  },
  {
    label: "שבת",
    value: TYPE_SABBATH,
    icon: "sunny-outline",
    color: "#F1C40F",
  },
  {
    label: "מחלה",
    value: TYPE_SICK,
    icon: "medical-outline",
    color: "#D9534F",
  },
  {
    label: "חופש",
    value: TYPE_VACATION,
    icon: "airplane-outline",
    color: "#2FA84F",
  },
];

export const PRESETS = [
  { label: "בוקר", start: "08:00", end: "16:00" },
  { label: "צהריים", start: "15:00", end: "23:00" },
  { label: "לילה", start: "23:00", end: "07:00" },
  { label: "רגיל", start: "08:00", end: "17:00" },
];

export const isTimedShift = (type) =>
  type === TYPE_WORK || type === TYPE_SABBATH;

export const computeTotalHours = (startStr, endStr) => {
  if (!startStr || !endStr) return "0.00";
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return "0.00";
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return (diff / 60).toFixed(2);
};

export const applyPreset = (preset, shift) => {
  const next = { ...shift, startTime: preset.start, endTime: preset.end };
  next.totalHours = computeTotalHours(next.startTime, next.endTime);
  return next;
};

export const applyTemplate = (tpl, shift) => {
  const nextType = tpl.type || shift.type;

  if (nextType === TYPE_SICK || nextType === TYPE_VACATION) {
    return {
      ...shift,
      type: nextType,
      startTime: "08:00",
      endTime: "16:00",
      totalHours: "8.00",
      hourlyPercent: tpl.hourlyPercent || shift.hourlyPercent,
      bonus: tpl.bonus || shift.bonus,
    };
  }

  const next = {
    ...shift,
    startTime: tpl.startTime || shift.startTime,
    endTime: tpl.endTime || shift.endTime,
    type: nextType,
    hourlyPercent: tpl.hourlyPercent || shift.hourlyPercent,
    bonus: tpl.bonus || shift.bonus,
  };
  next.totalHours = computeTotalHours(next.startTime, next.endTime);
  return next;
};

export const formatTime = (d) => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};
