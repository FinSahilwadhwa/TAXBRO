"""Refresh the compact NAICS lookup catalogue from the supplied Census workbook."""
import json
from pathlib import Path

import openpyxl

source = Path(r"C:\Users\Anurag\Downloads\2022-NAICS-Codes-listed-numerically-2-Digit-through-6-Digit.xlsx")
output = Path(__file__).with_name("naics-data.js")
sheet = openpyxl.load_workbook(source, read_only=True, data_only=True)["Two-Six Digit NAICS"]
records = []
for _, code, title, _ in sheet.iter_rows(min_row=2, values_only=True):
    if code is None or not title:
        continue
    title = " ".join(str(title).split())
    if title.endswith("T"):
        title = title[:-1]
    records.append([str(code).strip(), title])

output.write_text(
    "/* Source: 2022 NAICS United States, U.S. Census Bureau workbook. */\n"
    "window.TAXBRO_NAICS = " + json.dumps(records, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(records)} NAICS records")
