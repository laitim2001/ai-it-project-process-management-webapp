# -*- coding: utf-8 -*-
"""
FEAT-008: Excel to JSON Converter for OM Expense Data Import

This script converts Excel data to the JSON format required by the importData API.

Usage:
    python scripts/convert-excel-to-import-json.py <excel_file> [output_file]

Arguments:
    excel_file   - Path to the Excel file (.xlsx)
    output_file  - (Optional) Path to output JSON file (default: import-data.json)

Expected Excel format (columns):
    A (0): Row number
    B (1): Header Name
    C (2): Header Description
    D (3): Item Name
    E (4): Item Description
    F (5): Category
    G (6): Budget (USD)
    H (7): Budget (HKD)
    I (8): Budget (MOP)
    J (9): OpCo
    K (10): Start Date
    L (11): Contact
    M (12): End Date
    N (13): Last FY Actual Expense (if available)

Output JSON format:
[
  {
    "headerName": "...",
    "headerDescription": "...",
    "category": "...",
    "itemName": "...",
    "itemDescription": "...",
    "budgetAmount": 0,
    "opCoName": "...",
    "endDate": "YYYY-MM-DD",
    "lastFYActualExpense": null
  }
]

Author: IT Department
Since: FEAT-008 - OM Expense Data Import
"""

import openpyxl
import json
import sys
import os
from datetime import datetime

def format_date(value):
    """Convert date value to YYYY-MM-DD format string."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.strftime('%Y-%m-%d')
    if isinstance(value, str):
        # Try to parse common date formats
        for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y']:
            try:
                return datetime.strptime(value.strip(), fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        return value.strip() if value.strip() else None
    return str(value)

def safe_float(value, default=0):
    """Convert value to float safely."""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_string(value):
    """Convert value to string safely, handling None."""
    if value is None or str(value).strip() == '':
        return None
    return str(value).strip()

def convert_excel_to_import_json(excel_path, output_path='import-data.json'):
    """
    Convert Excel file to importData JSON format.

    Args:
        excel_path: Path to the Excel file
        output_path: Path to output JSON file

    Returns:
        dict with conversion statistics
    """
    print(f"[INFO] Loading Excel file: {excel_path}")

    # Load workbook
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb.active

    # Read all data
    items = []
    skipped = 0
    errors = []

    # Track unique values for validation
    headers_set = set()
    opcos_set = set()
    categories_set = set()

    print("[INFO] Processing rows...")

    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), 2):
        # Skip completely empty rows
        if all(cell is None or cell == '' for cell in row):
            skipped += 1
            continue

        # Extract values (adjust column indices based on actual Excel structure)
        header_name = safe_string(row[1])    # Column B
        header_desc = safe_string(row[2])    # Column C
        item_name = safe_string(row[3])      # Column D
        item_desc = safe_string(row[4])      # Column E
        category = safe_string(row[5])       # Column F
        budget_usd = safe_float(row[6], 0)   # Column G
        opco_name = safe_string(row[9])      # Column J
        end_date = format_date(row[12])      # Column M

        # Get lastFYActualExpense if column N exists
        last_fy_actual = None
        if len(row) > 13:
            last_fy_actual = safe_float(row[13], None) if row[13] is not None else None

        # Validate required fields
        if not header_name:
            errors.append(f"Row {row_idx}: Missing header name")
            skipped += 1
            continue
        if not item_name:
            errors.append(f"Row {row_idx}: Missing item name")
            skipped += 1
            continue
        if not category:
            errors.append(f"Row {row_idx}: Missing category")
            skipped += 1
            continue
        if not opco_name:
            errors.append(f"Row {row_idx}: Missing OpCo name")
            skipped += 1
            continue

        # Track unique values
        headers_set.add(header_name)
        opcos_set.add(opco_name)
        categories_set.add(category)

        # Create item object
        item = {
            "headerName": header_name,
            "headerDescription": header_desc,
            "category": category,
            "itemName": item_name,
            "itemDescription": item_desc,
            "budgetAmount": budget_usd,
            "opCoName": opco_name,
            "endDate": end_date,
            "lastFYActualExpense": last_fy_actual
        }

        items.append(item)

    # Check for duplicates (header + item + opco)
    seen = set()
    duplicates = []
    unique_items = []

    for item in items:
        key = (item['headerName'], item['itemName'], item['opCoName'])
        if key in seen:
            duplicates.append(key)
        else:
            seen.add(key)
            unique_items.append(item)

    # Write output
    print(f"[INFO] Writing to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(unique_items, f, ensure_ascii=False, indent=2)

    # Print statistics
    stats = {
        'total_processed': len(items) + skipped,
        'valid_items': len(items),
        'unique_items': len(unique_items),
        'duplicates_removed': len(duplicates),
        'skipped_rows': skipped,
        'unique_headers': len(headers_set),
        'unique_opcos': len(opcos_set),
        'unique_categories': len(categories_set),
        'errors': len(errors)
    }

    print("\n" + "="*50)
    print("[STATS] Conversion Statistics")
    print("="*50)
    print(f"  Total rows processed: {stats['total_processed']}")
    print(f"  Valid items: {stats['valid_items']}")
    print(f"  Unique items (output): {stats['unique_items']}")
    print(f"  Duplicates removed: {stats['duplicates_removed']}")
    print(f"  Skipped rows: {stats['skipped_rows']}")
    print(f"  Unique headers: {stats['unique_headers']}")
    print(f"  Unique OpCos: {stats['unique_opcos']}")
    print(f"  Unique categories: {stats['unique_categories']}")

    if errors:
        print(f"\n[WARN] {len(errors)} errors found:")
        for err in errors[:10]:  # Show first 10 errors
            print(f"    - {err}")
        if len(errors) > 10:
            print(f"    ... and {len(errors) - 10} more")

    if duplicates:
        print(f"\n[WARN] {len(duplicates)} duplicate items removed:")
        for dup in duplicates[:5]:  # Show first 5 duplicates
            print(f"    - Header: {dup[0]}, Item: {dup[1]}, OpCo: {dup[2]}")
        if len(duplicates) > 5:
            print(f"    ... and {len(duplicates) - 5} more")

    print("\n[OK] Conversion complete!")
    print(f"   Output file: {output_path}")

    return stats

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python convert-excel-to-import-json.py <excel_file> [output_file]")
        print("\nExample:")
        print("  python scripts/convert-excel-to-import-json.py 'docs/OM Expense.xlsx'")
        print("  python scripts/convert-excel-to-import-json.py 'docs/OM Expense.xlsx' 'import-data.json'")
        sys.exit(1)

    excel_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'import-data.json'

    if not os.path.exists(excel_path):
        print(f"[ERROR] File not found: {excel_path}")
        sys.exit(1)

    try:
        convert_excel_to_import_json(excel_path, output_path)
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
