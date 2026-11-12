import argparse
import csv
import re
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile


SPREADSHEET = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SOURCE_TO_CRM = {
    "Restaurant / outlet": "Restaurant",
    "Overture place ID": "Source ID",
    "Market": "Market",
    "State": "State",
    "Category": "Category",
    "Public business phone": "Business phone",
    "Public business email": "Business email",
    "Listed website": "Website",
    "Listed address": "Address",
}


def read_prospects(path):
    with ZipFile(path) as workbook:
        strings = ElementTree.fromstring(workbook.read("xl/sharedStrings.xml"))
        shared_strings = [
            "".join(part.text or "" for part in item.findall(".//s:t", SPREADSHEET))
            for item in strings
        ]
        manifest = ElementTree.fromstring(workbook.read("xl/workbook.xml"))
        prospect_sheet = next(
            sheet for sheet in manifest.findall("s:sheets/s:sheet", SPREADSHEET)
            if sheet.get("name") == "Prospects"
        )
        rel_id = prospect_sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        relationships = ElementTree.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
        target = next(relation.get("Target") for relation in relationships if relation.get("Id") == rel_id)
        worksheet = ElementTree.fromstring(workbook.read(
            target.lstrip("/") if target.startswith("/") else "xl/" + target
        ))

    headers = None
    for row in worksheet.findall("s:sheetData/s:row", SPREADSHEET):
        values = {}
        for cell in row.findall("s:c", SPREADSHEET):
            column = re.sub(r"\d+", "", cell.get("r"))
            value = cell.findtext("s:v", default="", namespaces=SPREADSHEET)
            if cell.get("t") == "s":
                value = shared_strings[int(value)]
            values[column] = value.strip()
        if headers is None and all(field in values.values() for field in SOURCE_TO_CRM):
            headers = values
        elif headers:
            yield {
                SOURCE_TO_CRM[field]: values.get(column, "")
                for column, field in headers.items()
                if field in SOURCE_TO_CRM
            }
    if headers is None:
        raise ValueError("Prospects sheet is missing expected columns")


def main():
    parser = argparse.ArgumentParser(description="Prepare a Twenty import from the WingerX prospect workbook")
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    records = [row for row in read_prospects(args.workbook) if row.get("Restaurant")]
    source_ids = {record["Source ID"] for record in records}
    if not records or "" in source_ids or len(source_ids) != len(records):
        raise ValueError("Each restaurant must have a distinct source ID")
    if any(not re.fullmatch(r"\+91 \d{10}", row["Business phone"]) for row in records):
        raise ValueError("Expected a published Indian business phone for each outlet")

    with args.output.open("x", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=SOURCE_TO_CRM.values())
        writer.writeheader()
        writer.writerows(records)
    print(f"Prepared {len(records)} records, including {sum(bool(r['Business email']) for r in records)} with a listed email.")


if __name__ == "__main__":
    main()
