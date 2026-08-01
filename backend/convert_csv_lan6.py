import json
import math
import re
import sys
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

import pandas as pd


PROJECT_ID = 3
START_PK = 5257
START_SERIAL = 5256

BASE_DIR = Path(__file__).resolve().parent
CSV_FILE = BASE_DIR / "Genral Expnsess Sheet LALANDER 6.csv"
OUTPUT_FILE = BASE_DIR / "lalander6_expenses.json"

COL_REMARKS = 0
COL_RUNNING_TOTAL = 1
COL_TOTAL_USD = 2
COL_USD = 3
COL_RATE = 4
COL_AFN = 6
COL_DESC = 7
COL_DATE = 8
COL_SERIAL = 9

CENT = Decimal("0.01")
FOUR_PLACES = Decimal("0.0001")
ZERO = Decimal("0")


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def row_value(row, index):
    if index >= len(row):
        return None
    return row.iloc[index]


def safe_decimal(value):
    if value is None:
        return ZERO

    if isinstance(value, float) and math.isnan(value):
        return ZERO

    value = (
        str(value)
        .replace(",", "")
        .replace("AFN", "")
        .replace("USD", "")
        .replace("$", "")
        .strip()
    )

    if value.lower() in ["", "nan", "none", "nat", "-", "#div/0!"]:
        return ZERO

    match = re.search(r"-?\d+(\.\d+)?", value)
    if not match:
        return ZERO

    try:
        return Decimal(match.group())
    except InvalidOperation:
        return ZERO


def money(value):
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def json_decimal(value, places=CENT):
    return float(Decimal(value).quantize(places, rounding=ROUND_HALF_UP))


def clean_text(value, fallback=""):
    if value is None:
        return fallback

    value = str(value).strip()
    if value.lower() in ["", "nan", "none", "nat", "#div/0!"]:
        return fallback

    return value


def safe_date(value):
    try:
        parsed = pd.to_datetime(value, errors="coerce", dayfirst=True)
        if pd.isna(parsed):
            return "1970-01-01"
        return parsed.strftime("%Y-%m-%d")
    except Exception:
        return "1970-01-01"


def build_serial_generator(start):
    current = start

    def next_serial(value):
        nonlocal current

        value = clean_text(value)
        if not value:
            current += 1
            return current

        try:
            serial = int(Decimal(re.search(r"-?\d+(\.\d+)?", value).group()))
        except Exception:
            current += 1
            return current

        if serial <= current:
            current += 1
            return current

        current = serial
        return serial

    return next_serial


def usd_equivalent(usd, afn, rate):
    total = usd
    if afn and rate:
        total += afn / rate
    return money(total)


def afn_equivalent(usd, afn, rate):
    total = afn
    if usd and rate:
        total += usd * rate
    return money(total)


df = pd.read_csv(
    CSV_FILE,
    skiprows=4,
    header=None,
    dtype=str,
    encoding="utf-8-sig",
)

records = []
get_serial = build_serial_generator(START_SERIAL)
pk = START_PK

raw_usd_sum = ZERO
raw_afn_sum = ZERO
usd_equivalent_sum = ZERO
afn_equivalent_sum = ZERO
excel_row_total_sum = ZERO
mismatches = []
running_total_mismatches = []
missing_rate_rows = []
last_excel_running = ZERO
previous_excel_running = None
last_valid_date = None

for _, row in df.iterrows():
    description = clean_text(row_value(row, COL_DESC), "No description provided")
    afn = safe_decimal(row_value(row, COL_AFN))
    usd = safe_decimal(row_value(row, COL_USD))
    rate = safe_decimal(row_value(row, COL_RATE))
    excel_row_total = money(safe_decimal(row_value(row, COL_TOTAL_USD)))
    excel_running = money(safe_decimal(row_value(row, COL_RUNNING_TOTAL)))

    if afn == ZERO and usd == ZERO and excel_row_total == ZERO:
        continue

    parsed_date = safe_date(row_value(row, COL_DATE))
    if parsed_date == "1970-01-01":
        expense_date = last_valid_date or parsed_date
    else:
        expense_date = parsed_date
        last_valid_date = parsed_date

    if (afn or usd) and rate == ZERO:
        missing_rate_rows.append(
            {
                "date": clean_text(row_value(row, COL_DATE)),
                "description": description,
                "afn": afn,
                "usd": usd,
                "excel_total": excel_row_total,
            }
        )

    row_usd_equivalent = usd_equivalent(usd, afn, rate)
    row_afn_equivalent = afn_equivalent(usd, afn, rate)

    raw_usd_sum += usd
    raw_afn_sum += afn
    usd_equivalent_sum += row_usd_equivalent
    afn_equivalent_sum += row_afn_equivalent
    excel_row_total_sum += excel_row_total
    if excel_running:
        if previous_excel_running is not None:
            running_delta = money(excel_running - previous_excel_running)
            running_diff = money(running_delta - excel_row_total)
            if abs(running_diff) > Decimal("1.00"):
                running_total_mismatches.append(
                    {
                        "date": clean_text(row_value(row, COL_DATE)),
                        "serial": clean_text(row_value(row, COL_SERIAL)),
                        "excel_delta": running_delta,
                        "row_total": excel_row_total,
                        "difference": running_diff,
                        "description": description,
                    }
                )
        previous_excel_running = excel_running
        last_excel_running = excel_running

    diff = money(row_usd_equivalent - excel_row_total)
    if abs(diff) > Decimal("1.00"):
        mismatches.append(
            {
                "date": clean_text(row_value(row, COL_DATE)),
                "description": description,
                "excel": excel_row_total,
                "calculated": row_usd_equivalent,
                "difference": diff,
                "afn": afn,
                "usd": usd,
                "rate": rate,
            }
        )

    record = {
        "model": "expenses.expense",
        "pk": pk,
        "fields": {
            "project": PROJECT_ID,
            "serial_number": get_serial(row_value(row, COL_SERIAL)),
            "expense_date": expense_date,
            "description": description,
            "remarks": clean_text(row_value(row, COL_REMARKS)),
            "paid_to": "",
            "amount_afn": json_decimal(afn),
            "amount_usd": json_decimal(usd),
            "exchange_rate": json_decimal(rate, FOUR_PLACES),
            "expense_type": "general",
            "created_at": expense_date,
            "updated_at": expense_date,
        },
    }

    records.append(record)
    pk += 1

with OUTPUT_FILE.open("w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"Detected columns: {df.shape[1]}")
print(f"Created records: {len(records)}")
print(f"Saved to: {OUTPUT_FILE.name}")
print(f"Raw direct USD total: ${raw_usd_sum:,.2f}")
print(f"Raw AFN total: AFN {raw_afn_sum:,.2f}")
print(f"Excel row USD total sum: ${excel_row_total_sum:,.2f}")
print(f"Generated USD equivalent total: ${usd_equivalent_sum:,.2f}")
print(f"Generated AFN equivalent total: AFN {afn_equivalent_sum:,.2f}")
if usd_equivalent_sum:
    print(f"Implied average rate: {money(afn_equivalent_sum / usd_equivalent_sum)}")
print(f"Excel final running total: ${last_excel_running:,.2f}")
print(f"Difference from Excel running: ${money(usd_equivalent_sum - last_excel_running):,.2f}")

if missing_rate_rows:
    print()
    print(f"Found {len(missing_rate_rows)} amount row(s) with no exchange rate.")
    for row in missing_rate_rows[:10]:
        print(
            "Missing rate -> "
            f"Date={row['date']}, "
            f"USD={row['usd']}, AFN={row['afn']}, "
            f"Excel={row['excel_total']}, "
            f"Description={row['description']}"
        )
else:
    print("No amount rows have missing exchange rates.")

if mismatches:
    print()
    print(f"Found {len(mismatches)} row total mismatch(es) over $1.00:")
    for mismatch in mismatches[:10]:
        print(
            "Mismatch -> "
            f"Date={mismatch['date']}, "
            f"Excel={mismatch['excel']}, "
            f"Calculated={mismatch['calculated']}, "
            f"Diff={mismatch['difference']}, "
            f"AFN={mismatch['afn']}, USD={mismatch['usd']}, "
            f"Rate={mismatch['rate']}, "
            f"Description={mismatch['description']}"
        )
else:
    print("No row total mismatches over $1.00.")

if running_total_mismatches:
    print()
    print(f"Found {len(running_total_mismatches)} running total mismatch(es) over $1.00:")
    for mismatch in running_total_mismatches[:10]:
        print(
            "Running total mismatch -> "
            f"Date={mismatch['date']}, Serial={mismatch['serial']}, "
            f"RunningDelta={mismatch['excel_delta']}, "
            f"RowTotal={mismatch['row_total']}, "
            f"Diff={mismatch['difference']}, "
            f"Description={mismatch['description']}"
        )
else:
    print("No running total mismatches over $1.00.")
