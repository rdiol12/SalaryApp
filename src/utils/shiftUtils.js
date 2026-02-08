import { parseDateLocal } from "./shiftFilters";

export const TYPE_WORK = "עבודה";
export const TYPE_SABBATH = "שבת";
export const TYPE_SICK = "מחלה";
export const TYPE_VACATION = "חופש";

export const SHIFT_TYPES = [
  { label: TYPE_WORK, value: TYPE_WORK },
  { label: TYPE_SABBATH, value: TYPE_SABBATH },
  { label: TYPE_SICK, value: TYPE_SICK },
  { label: TYPE_VACATION, value: TYPE_VACATION },
];

export const PRESETS = [
  { label: "בוקר", start: "08:00", end: "16:00" },
  { label: "רגיל", start: "08:00", end: "17:00" },
  { label: "ערב", start: "16:00", end: "00:00" },
];

export const isTimedShift = (type) =>
  type === TYPE_WORK || type === TYPE_SABBATH;

export const computeTotalHours = (startStr, endStr) => {
  const [sh, sm] = (startStr || "").split(":").map(Number);
  const [eh, em] = (endStr || "").split(":").map(Number);
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
