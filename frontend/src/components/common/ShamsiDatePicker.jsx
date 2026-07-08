import { Calendar } from "react-multi-date-picker";
import DateObject from "react-date-object";

import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// 1. ADD THIS LINE: Handle Vite default import wrapping
const DatePickerComponent = Calendar;
// afghanistanLocale.js
const afghanistanLocale = {
  name: "afghanistan",
  months: [
    "حمل",
    "ثور",
    "جوزا",
    "سرطان",
    "اسد",
    "سنبله",
    "میزان",
    "عقرب",
    "قوس",
    "جدی",
    "دلو",
    "حوت",
  ],
  weekDays: [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
  ],
  digits: ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"],
};

export default function ShamsiDatePicker({
  value,
  onChange,
  required = false,
  style = {},
}) {
  return (
    <DatePickerComponent
      value={
        value
          ? new DateObject({
              date: value,
              calendar: persian,
              locale: persian_fa,
            })
          : ""
      }
      calendar={persian}
      locale={afghanistanLocale}
      format="YYYY MMMM DD"  // Changed this line to show full month name
      inputClass="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      containerClassName="w-full"
      required={required}
      onChange={(date) => {
        onChange(date ? date.toDate().toISOString().split("T")[0] : "");
      }}
      style={style}
    />
  );
}