import CalendarDatePicker from "./CalendarDatePicker";

export default function CalendarDateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  module = "reports",
  startLabel = "Start Date",
  endLabel = "End Date",
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <CalendarDatePicker label={startLabel} value={startValue} onChange={onStartChange} module={module} />
      <CalendarDatePicker label={endLabel} value={endValue} onChange={onEndChange} module={module} />
    </div>
  );
}
