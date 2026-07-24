import CalendarDatePicker from "./CalendarDatePicker";

export default function ShamsiDatePicker({ value, onChange, required = false, style = {} }) {
  return (
    <div style={style}>
      <CalendarDatePicker value={value} onChange={onChange} required={required} module="dashboard" />
    </div>
  );
}
