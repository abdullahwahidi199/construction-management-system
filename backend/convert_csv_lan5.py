import pandas as pd
import json
import math
import re

PROJECT_ID = 2
START_PK = 1015
LATEST_SERIAL = 1014

csv_file = "Genral Expnsess Sheet LALANDER 5.csv"
output_file = "lalander5_expenses.json"

# Read without assuming columns - read all
df = pd.read_csv(csv_file, skiprows=2, header=None, dtype=str)

print("Detected columns count:", df.shape[1])
print("First row sample:", df.iloc[1].tolist())

# Based on your screenshot, columns B..L map to indexes 0..10 (if A is index 0)
# But pandas read_csv will start at column A = 0
# From screenshot: A=empty/logo, B=running_total, C=total_usd, D=usd,
# E=exchange_rate, F=empty, G=amount_afn, H=description,
# I=empty?, J=empty?, K=date, L=serial

# Adjust these indexes based on the printed "first row sample" above:
COL_RUNNING_TOTAL = 1   # B
COL_TOTAL_USD     = 2   # C
COL_USD           = 3   # D
COL_RATE          = 4   # E
COL_AFN           = 6   # G
COL_DESC          = 7   # H
COL_DATE          = 10  # K
COL_SERIAL        = 11  # L

# Skip the header row that says "Total Expenses by USD" etc.
df = df.iloc[1:].copy().reset_index(drop=True)


# ---------------- SAFE HELPERS ----------------


def safe_decimal(value):
    if value is None:
        return 0.0
    if isinstance(value, float) and math.isnan(value):
        return 0.0

    value = str(value)
    # Remove currency labels and commas
    value = value.replace(",", "").replace("AFN", "").replace("USD", "").replace("$", "").strip()

    if value.lower() in ["", "nan", "none", "nat", "-"]:
        return 0.0

    # Extract first number found
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


def safe_serial(value):
    global LATEST_SERIAL
    value = str(value).strip() if value is not None else ""

    if value in ["", "nan", "None"]:
        LATEST_SERIAL += 1
        return LATEST_SERIAL

    try:
        serial = int(float(value))
    except:
        LATEST_SERIAL += 1
        return LATEST_SERIAL

    if serial <= LATEST_SERIAL:
        LATEST_SERIAL += 1
        return LATEST_SERIAL

    LATEST_SERIAL = serial
    return serial

excel_sum = 0
calculated_sum = 0

for _, row in df.iterrows():

    afn = safe_decimal(row.iloc[COL_AFN])
    usd = safe_decimal(row.iloc[COL_USD])
    rate = safe_decimal(row.iloc[COL_RATE])

    serial = safe_serial(row.iloc[COL_SERIAL])

    excel_total = safe_decimal(row.iloc[COL_TOTAL_USD])
    calculated_total = round(
        usd + (afn / rate if rate else 0),
        2
    )

    excel_sum += excel_total
    calculated_sum += calculated_total

    diff = round(calculated_total - excel_total, 2)

    if abs(diff) > 1:
        print(
            f"Serial {serial}: "
            f"Excel={excel_total}, "
            f"Calc={calculated_total}, "
            f"Diff={diff}, "
            f"AFN={afn}, USD={usd}, Rate={rate}"
        )

print(excel_sum)
print(calculated_sum)
# ---------------- MAIN LOOP ----------------

records = []
pk = START_PK

for _, row in df.iterrows():

    description = str(row.iloc[COL_DESC]).strip() if COL_DESC < len(row) else ""
    if description in ["", "nan", "None"]:
        description = "No description provided"

    afn  = safe_decimal(row.iloc[COL_AFN])
    usd  = safe_decimal(row.iloc[COL_USD])
    rate = safe_decimal(row.iloc[COL_RATE])

    expense_date  = safe_date(row.iloc[COL_DATE])
    serial_number = safe_serial(row.iloc[COL_SERIAL])

    # Skip totally empty rows
    if afn == 0 and usd == 0 and description == "No description provided":
        continue

    fixture = {
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

    records.append(fixture)
    pk += 1


with open(output_file, "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"Created {len(records)} records.")
print(f"Saved to {output_file}")