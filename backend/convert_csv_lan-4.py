import pandas as pd
import json
import math

PROJECT_ID = 4
START_PK = 1
LATEST_SERIAL = 0

csv_file = "Lalander 4 general reports.csv"
output_file = "lalander4_expenses.json"

df = pd.read_csv(csv_file)

df.columns = [
    "running_total",
    "total_usd",
    "exchange_rate",
    "amount_usd",
    "amount_afn",
    "description",
    "expense_date",
    "serial_number",
    "extra",
]

df = df.iloc[1:].copy().reset_index(drop=True)

records = []
pk = START_PK


# ---------------- SAFE HELPERS ----------------

def safe_decimal(value):
    # 1. handle pandas real NaN
    if value is None:
        return 0.0

    if isinstance(value, float) and math.isnan(value):
        return 0.0

    # 2. convert safely to string
    value = str(value).replace(",", "").replace("AFN", "").replace("$", "").strip()

    # 3. handle string cases
    if value.lower() in ["", "nan", "none", "nat"]:
        return 0.0

    try:
        num = float(value)
        if math.isnan(num) or math.isinf(num):
            return 0.0
        return num
    except:
        return 0.0


def safe_date(value):
    """
    Returns YYYY-MM-DD string (never fails)
    """
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


# ---------------- MAIN LOOP ----------------

for _, row in df.iterrows():

    description = str(row.get("description", "")).strip()
    if description in ["", "nan", "None"]:
        description = "No description provided"

    afn = safe_decimal(row.get("amount_afn"))
    usd = safe_decimal(row.get("amount_usd"))

    try:
        exchange_rate = float(row.get("exchange_rate") or 0)
    except:
        exchange_rate = 0.0

    expense_date = safe_date(row.get("expense_date"))

    serial_number = safe_serial(row.get("serial_number"))

    excel_total = safe_decimal(row.get("total_usd"))

    calculated_total = round(
        usd + (afn / exchange_rate if exchange_rate else 0),
        2
    )

    diff = round(calculated_total - excel_total, 2)

    if abs(diff) > 1:
        print(
            f"Serial {serial_number}: "
            f"Excel={excel_total}, "
            f"Calc={calculated_total}, "
            f"Diff={diff}, "
            f"AFN={afn}, "
            f"USD={usd}, "
            f"Rate={exchange_rate}"
        )

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

            # IMPORTANT: keep numeric (NOT string)
            "amount_afn": round(afn, 2),
            "amount_usd": round(usd, 2),
            "exchange_rate": round(exchange_rate, 4),

            "expense_type": "general",

            # SAFE FOR OLD DATA (NO timezone.now)
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