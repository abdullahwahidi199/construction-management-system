import pandas as pd

encodings = [
    "utf-8",
    "utf-8-sig",
    "cp1256",
    "windows-1256",
    "cp1252",
    "latin1"
]

for enc in encodings:
    try:
        df = pd.read_csv(
            "office_expenses.csv",
            skiprows=2,
            header=None,
            dtype=str,
            encoding=enc,
        )
        print(enc)
        print(df.iloc[0, 5])
        print("-" * 50)
    except Exception as e:
        print(enc, e)