import pandas as pd
import json
import math
import re

PROJECT_ID = 6
START_PK = 2706
LATEST_SERIAL = 4629

csv_file = "Genral Expnsess Sheet LALANDER 6 Real.csv"
output_file = "lalander6_expenses.json"

# ---------------- READ CSV ----------------
df = pd.read_csv(csv_file, skiprows=2, header=None, dtype=str)

print("Detected columns count:", df.shape[1])
print("First row sample:", df.iloc[0].tolist())

df = df.iloc[1:].reset_index(drop=True)

# ---------------- COLUMN MAPPING ----------------
COL_RUNNING_TOTAL = 1
COL_TOTAL_USD     = 2
COL_USD           = 3
COL_RATE          = 4
COL_AFN           = 6
COL_DESC          = 7
COL_DATE          = 10
COL_SERIAL        = 11

# ---------------- HELPERS ----------------

def safe_decimal(value):
    if value is None:
        return 0.0

    value = str(value)

    if value.lower() in ["", "nan", "none", "nat", "-"]:
        return 0.0

    value = value.replace(",", "").replace("AFN", "").replace("USD", "").replace("$", "").strip()

    match = re.search(r"-?\d+(\.\d+)?", value)
    if not match:
        return 0.0

    try:
        num = float(match.group())
        if math.isnan(num) or math.isinf(num):
            return 0.0
        return num
    except:
        return 0.0


def safe_date(value):
    try:
        dt = pd.to_datetime(value, errors="coerce", dayfirst=True)
        if pd.isna(dt):
            return "1970-01-01"
        return dt.strftime("%Y-%m-%d")
    except:
        return "1970-01-01"


# ---------------- SERIAL GENERATOR (FIXED) ----------------
def build_serial_generator(start):
    current = start

    def next_serial(value):
        nonlocal current

        value = str(value).strip() if value is not None else ""

        # if missing → auto increment
        if value in ["", "nan", "None"]:
            current += 1
            return current

        try:
            serial = int(float(value))
        except:
            current += 1
            return current

        # enforce monotonic increase
        if serial <= current:
            current += 1
            return current

        current = serial
        return serial

    return next_serial


get_serial = build_serial_generator(LATEST_SERIAL)

# ---------------- VALIDATION PASS (NO STATE CHANGE) ----------------
excel_sum = 0
calculated_sum = 0

for _, row in df.iterrows():

    afn = safe_decimal(row.iloc[COL_AFN])
    usd = safe_decimal(row.iloc[COL_USD])
    rate = safe_decimal(row.iloc[COL_RATE])

    excel_total = safe_decimal(row.iloc[COL_TOTAL_USD])

    calculated_total = round(usd + (afn / rate if rate else 0), 2)

    excel_sum += excel_total
    calculated_sum += calculated_total

    diff = round(calculated_total - excel_total, 2)

    if abs(diff) > 1:
        print(
            f"Mismatch -> "
            f"Excel={excel_total}, Calc={calculated_total}, Diff={diff}, "
            f"AFN={afn}, USD={usd}, Rate={rate}"
        )

print("Excel Sum:", excel_sum)
print("Calculated Sum:", calculated_sum)

# ---------------- BUILD JSON ----------------
records = []
pk = START_PK

for _, row in df.iterrows():

    description = str(row.iloc[COL_DESC]).strip() if COL_DESC < len(row) else ""
    if description in ["", "nan", "None"]:
        description = "No description provided"

    afn = safe_decimal(row.iloc[COL_AFN])
    usd = safe_decimal(row.iloc[COL_USD])
    rate = safe_decimal(row.iloc[COL_RATE])

    expense_date = safe_date(row.iloc[COL_DATE])

    serial_number = get_serial(row.iloc[COL_SERIAL])

    # skip empty rows
    if afn == 0 and usd == 0 and description == "No description provided":
        continue

    record = {
        "model": "expenses.expense",
        "pk": pk,
        "fields": {
            "project": PROJECT_ID,
            "serial_number": serial_number,
            "expense_date": expense_date,
            "description": description,
            "remarks": "",
            "paid_to": "",
            "amount_afn": round(afn, 2),
            "amount_usd": round(usd, 2),
            "exchange_rate": round(rate, 4),
            "expense_type": "general",
            "created_at": expense_date,
            "updated_at": expense_date,
        },
    }

    records.append(record)
    pk += 1

# ---------------- SAVE ----------------
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"Created {len(records)} records.")
print(f"Saved to {output_file}")