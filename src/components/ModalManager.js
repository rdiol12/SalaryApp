import SettingsModal from "./SettingsModal.js";
import ShiftDetailsModal from "./ShiftDetailsModal.js";
import AddShiftModal from "./AddShiftModal.js";
import PayslipModal from "./PayslipModal.js";

export default function ModalManager({
  modals,
  setModals,
  config,
  shifts,
  monthlyShifts,
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
  const closePayslip = () => setModals((prev) => ({ ...prev, payslip: false }));

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
        presets={config.presets || []}
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

      <PayslipModal
        visible={modals.payslip}
        onClose={closePayslip}
        shifts={monthlyShifts}
        config={config}
      />
    </>
  );
}
