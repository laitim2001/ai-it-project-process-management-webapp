# -*- coding: utf-8 -*-
import openpyxl
import json
import sys

# Read Excel file
wb = openpyxl.load_workbook('docs/For Data Import/OM Expense and Detail import data - v2.xlsx', data_only=True)
ws = wb.active

# Read all data
data = []
headers = []

for row_idx, row in enumerate(ws.iter_rows(min_row=1, values_only=True), 1):
    if row_idx == 1:
        headers = list(row)
    else:
        if all(cell is None or cell == '' for cell in row):
            continue
        data.append(list(row))

# Analyze unique values
om_headers = {}  # name -> description
om_items = {}    # (header, item) -> details
categories = set()
opcos = set()
header_category_map = {}  # header -> category

for row in data:
    header_name = str(row[1]).strip() if row[1] else None
    header_desc = str(row[2]).strip() if row[2] else None
    item_name = str(row[3]).strip() if row[3] else None
    item_desc = str(row[4]).strip() if row[4] else None
    category = str(row[5]).strip() if row[5] else None
    budget_usd = row[6]
    opco = str(row[9]).strip() if row[9] else None
    end_date = row[12]

    if header_name:
        if header_name not in om_headers:
            om_headers[header_name] = header_desc
        if category:
            header_category_map[header_name] = category
            categories.add(category)

    if item_name and header_name:
        key = (header_name, item_name)
        if key not in om_items:
            om_items[key] = {
                'header': header_name,
                'item': item_name,
                'item_desc': item_desc,
                'category': category,
                'opcos': [],
                'budgets': [],
                'end_dates': []
            }
        if opco:
            opcos.add(opco)
            om_items[key]['opcos'].append(opco)
        if budget_usd is not None:
            om_items[key]['budgets'].append(budget_usd)
        if end_date:
            om_items[key]['end_dates'].append(str(end_date))

# Output results
result = {
    'summary': {
        'total_rows': len(data),
        'unique_headers': len(om_headers),
        'unique_items': len(om_items),
        'unique_categories': len(categories),
        'unique_opcos': len(opcos)
    },
    'headers': headers,
    'categories': sorted(list(categories)),
    'opcos': sorted(list(opcos)),
    'om_expense_headers': [
        {
            'name': name,
            'description': desc,
            'category': header_category_map.get(name, '')
        }
        for name, desc in sorted(om_headers.items())
    ],
    'sample_items': [
        {
            'header': details['header'],
            'item': details['item'],
            'item_desc': details['item_desc'],
            'category': details['category'],
            'opcos_count': len(set(details['opcos'])),
            'unique_opcos': list(set(details['opcos']))[:5]
        }
        for key, details in list(om_items.items())[:20]
    ]
}

# Write to JSON file
with open('docs/import-data-analysis.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print('Analysis complete. Results saved to docs/import-data-analysis.json')
print(f"Total rows: {result['summary']['total_rows']}")
print(f"Unique headers: {result['summary']['unique_headers']}")
print(f"Unique items: {result['summary']['unique_items']}")
print(f"Unique categories: {result['summary']['unique_categories']}")
print(f"Unique OpCos: {result['summary']['unique_opcos']}")
