"""Build the compact client-side NAICS catalogue from the supplied Census workbook."""
import json
from pathlib import Path

import openpyxl


SOURCE = Path(r"C:\Users\Anurag\Downloads\2022-NAICS-Codes-listed-numerically-2-Digit-through-6-Digit.xlsx")
OUTPUT = Path(__file__).with_name("naics-data.js")


def clean(value):
    return " ".join(str(value or "").replace("T", "").split())


workbook = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)
sheet = workbook["Two-Six Digit NAICS"]
records = []
for _, code, title, _ in sheet.iter_rows(min_row=2, values_only=True):
    if code is None or not title:
        continue
    code = str(code).strip()
    records.append([code, clean(title)])

OUTPUT.write_text(
    "/* Source: 2022 NAICS United States, U.S. Census Bureau workbook. */\n"
    "window.TAXBRO_NAICS = " + json.dumps(records, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(records)} NAICS records to {OUTPUT}")
