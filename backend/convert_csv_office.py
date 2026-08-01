import pandas as pd
import json
import math
import re
from pathlib import Path

START_PK = 5662          # First ID after your latest expense
LATEST_SERIAL = 5661       # Last office expense serial number

BASE_DIR = Path(__file__).resolve().parent
csv_file = BASE_DIR / "office_expenses.csv"
output_file = BASE_DIR / "office_expenses.json"

# Read CSV
df = pd.read_csv(csv_file, skiprows=2, header=None, dtype=str, encoding="utf-8-sig")

print("Detected columns:", df.shape[1])
print(df.iloc[0].tolist())

# Column mapping
COL_TOTAL_USD = 0
COL_USD = 1
COL_RATE = 2
COL_USD_AMOUNT = 3
COL_AFN = 4
COL_DESC = 5
COL_DATE = 6
COL_SERIAL = 7

def safe_decimal(value):
    if value is None:
        return 0.0

    if isinstance(value, float) and math.isnan(value):
        return 0.0

    value = str(value)
    value = (
        value.replace(",", "")
        .replace("AFN", "")
        .replace("USD", "")
        .replace("$", "")
        .strip()
    )

    if value.lower() in ["", "nan", "none", "-", "nat"]:
        return 0.0

    match = re.search(r"-?\d+(\.\d+)?", value)
    if not match:
        return 0.0

    return float(match.group())


def safe_date(value):
    dt = pd.to_datetime(value, errors="coerce", dayfirst=True)

    if pd.isna(dt):
        return "1970-01-01"

    return dt.strftime("%Y-%m-%d")


def safe_serial(value):
    global LATEST_SERIAL

    value = str(value).strip()

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


records = []
pk = START_PK

for _, row in df.iterrows():

    description = str(row.iloc[COL_DESC]).strip()

    if description in ["", "nan", "None"]:
        description = "No description provided"

    afn = safe_decimal(row.iloc[COL_AFN])
    usd = safe_decimal(row.iloc[COL_USD_AMOUNT])
    rate = safe_decimal(row.iloc[COL_RATE])

    expense_date = safe_date(row.iloc[COL_DATE])
    serial = safe_serial(row.iloc[COL_SERIAL])

    # Skip blank rows
    if afn == 0 and usd == 0:
        continue

    fixture = {
        "model": "expenses.expense",
        "pk": pk,
        "fields": {
            "expense_scope": "office",
            "project": None,
            "serial_number": serial,
            "expense_date": expense_date,
            "description": description,
            "remarks": "",
            "paid_to": "",
            "amount_afn": round(afn, 2),
            "amount_usd": round(usd, 2),
            "exchange_rate": round(rate, 4),
            "expense_type": "miscellaneous",
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
