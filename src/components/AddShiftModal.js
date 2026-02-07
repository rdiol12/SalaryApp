const handleTimeChange = (event, selectedDate) => {
  // ב-Android, אם המשתמש לא לחץ על 'אישור' (Set), אנחנו לא סוגרים
  if (Platform.OS === 'android') {
    if (event.type === 'set') {
      setShowPicker({ field: null, visible: false });
      if (showPicker.field === 'start') setStartTime(selectedDate);
      else setEndTime(selectedDate);
    } else {
      // המשתמש לחץ ביטול או סגר את החלון
      setShowPicker({ field: null, visible: false });
    }
  } else {
    // ב-iOS הגלגל נשאר פתוח והמשתמש גולל בחופשיות
    if (selectedDate) {
      if (showPicker.field === 'start') setStartTime(selectedDate);
      else setEndTime(selectedDate);
    }
  }
};
