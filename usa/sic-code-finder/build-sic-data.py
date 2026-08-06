"""Build the compact client-side SIC catalogue from the supplied workbook."""
import json
from pathlib import Path

import openpyxl

source = Path(r"C:\Users\Anurag\Downloads\Two-and-Four-Digit-SIC-with-Descriptions.xlsx")
output = Path(__file__).with_name("sic-data.js")
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
records = []
for sheet_name in ("SIC 2 DIGIT", "SIC 4 DIGIT"):
    for code, description in workbook[sheet_name].iter_rows(min_row=2, values_only=True):
        if code is None or not description:
            continue
        records.append([str(code).strip().zfill(2 if sheet_name.endswith("2 DIGIT") else 4), " ".join(str(description).split())])

output.write_text(
    "/* Source: supplied Two- and Four-Digit SIC descriptions workbook. */\n"
    "window.TAXBRO_SIC = " + json.dumps(records, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(records)} SIC records")
