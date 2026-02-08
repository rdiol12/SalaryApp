import React from "react";
import SettingsModal from "./SettingsModal";
import ShiftDetailsModal from "./ShiftDetailsModal";
import AddShiftModal from "./AddShiftModal";

export default function ModalManager({
  modals,
  setModals,
  config,
  shifts,
  displayDate,
  selectedDate,
  editingData,
  setEditingData,
  onSaveShift,
  onDuplicateShift,
  onRestore,
  onSaveConfig,
}) {
  const closeSettings = () =>
    setModals((prev) => ({ ...prev, settings: false }));
  const closeAdd = () => {
    setModals((prev) => ({ ...prev, add: false }));
    setEditingData(null);
  };
  const closeQuickAdd = () =>
    setModals((prev) => ({ ...prev, quickAdd: false }));

  return (
    <>
      <ShiftDetailsModal
        visible={modals.add}
        date={selectedDate}
        existingData={editingData}
        onSave={onSaveShift}
        onDuplicate={onDuplicateShift}
        templates={config.shiftTemplates || []}
        config={config}
        onClose={closeAdd}
      />

      <AddShiftModal
        visible={modals.quickAdd}
        date={selectedDate}
        onSave={onSaveShift}
        templates={config.shiftTemplates || []}
        onClose={closeQuickAdd}
      />

      <SettingsModal
        visible={modals.settings}
        config={config}
        shifts={shifts}
        displayDate={displayDate}
        onRestore={onRestore}
        onSave={onSaveConfig}
        onClose={closeSettings}
      />
    </>
  );
}
