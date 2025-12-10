import json

# Extracted data from screenshot analysis
extracted_data = {
    "metadata": {
        "source": "om-expense-excel-screenshot-1.png",
        "document_title": "IT Annual Maintenance Budget for FY26 - RHK & P&C (v1.1)",
        "updated_on": "3-Nov-25",
        "exchange_rate": "JPY1 = 0.060",
        "financial_year": 2026
    },
    "category": "A) Datalines",
    "headers": [
        {
            "number": 1,
            "name": "R-WAN (Budget @US$65,712, charged by RCL quarterly)",
            "notes": [
                "**Item #1.1-1.3's cost to be evenly shared by 13 OpCos (excl. RA):",
                "i.e. RAPO - 7.7%, RCN - 7.7%, Rest of OpCos** - 84.6%",
                "(**RAPO, RHK, RMS, RSP, RPH, RTW, RCN, RTH, RVN, RAP, RNZ, RKR, RBS)",
                "*Start chargeback RBS in Apr-25",
                "*Start chargeback RIMV wef 1-Sep-25"
            ],
            "items": [
                {
                    "item_number": "1.1",
                    "name": "TGT-DC (wef Sep-23) @US$2,724/mth",
                    "charged_by": "RCL quarterly",
                    "budget_us": 4694,
                    "budget_hk": 36611,
                    "increment_pct": -3.1,
                    "charge_to": "RHK (IT pay 1st)",
                    "actual_hk": 37784,
                    "actual_us": 4844,
                    "end_date": "on-going"
                },
                {
                    "item_number": "1.2",
                    "name": "RDC2 (8MB + 4MB@US$2,585/mth)",
                    "charged_by": "RCL quarterly",
                    "budget_us": None,
                    "budget_hk": None,
                    "increment_pct": None,
                    "charge_to": None,
                    "actual_hk": None,
                    "actual_us": None,
                    "end_date": None
                },
                {
                    "item_number": "1.3",
                    "name": "X-Connection x 2 (@HK$1,300/mth)",
                    "charged_by": "DYXNet monthly",
                    "budget_us": None,
                    "budget_hk": None,
                    "notes": [
                        "2x External X-connect by DYXNet for NTT R-WAN Dataline (Ref: IT230903)",
                        "Connect from DataCenter Rack to MMR Cable Room wef 28-Sep-23",
                        "(24-mth contract signed in Sep-23 to Sep-25)",
                        "(Apr-Aug/25: 13 OpCos)",
                        "(Sep/25 onwards: 14 OpCos)"
                    ]
                }
            ],
            "subtotal": {
                "budget_us": 4694,
                "budget_hk": 36611,
                "increment_pct": -3.1,
                "actual_hk": 37784,
                "actual_us": 4844
            }
        },
        {
            "number": 2,
            "name": "SD-WAN (HK & AP)",
            "items": [
                {
                    "item_number": "2.1",
                    "name": "HK SD-WAN (HKT) (Budget @HK$115,920)",
                    "budget_us": 6723,
                    "budget_hk": 52440,
                    "increment_pct": 0.0,
                    "charge_to": "RHK",
                    "actual_hk": 52440,
                    "actual_us": 6723,
                    "end_date": "Jul-26",
                    "notes": [
                        "Renewed 2-yr contract until Jul-2026",
                        "**Mthly cost: RDC1- HK$2,070, RDC2-HK$2,070, ASPC-HK$1,150",
                        "RHK - Pts Ctr ($1,150), Fotan ($1,150), MTL L.Ctr ($2,070)"
                    ]
                }
            ],
            "subtotal": {
                "budget_us": 6723,
                "budget_hk": 52440,
                "increment_pct": 0.0,
                "actual_hk": 52440,
                "actual_us": 6723
            }
        },
        {
            "number": 4,
            "name": "Internet Lines",
            "ref": "15-5",
            "sub_sections": [
                {
                    "name": "4.1 HGC",
                    "items": [
                        {
                            "item_number": "ii)",
                            "name": "1x 500M Broadband for RHK Demo (HK$480/mth)",
                            "budget_us": 738,
                            "budget_hk": 5760,
                            "increment_pct": 0.0,
                            "charge_to": "RHK",
                            "actual_hk": 5760,
                            "actual_us": 738,
                            "end_date": "4/13/2025",
                            "notes": [
                                "*renewed 2-yr in Apr-23",
                                "(cost to be borne by RHK wef Jun-2025 as it's 100% for demo purpose)"
                            ]
                        },
                        {
                            "item_number": "iii)",
                            "name": "1x 500M Broadband for Live Demo, Guest Wifi,...(HK$3,050/mth)",
                            "budget_us": 4692,
                            "budget_hk": 36600,
                            "increment_pct": 0.0,
                            "charge_to": "RHK",
                            "actual_hk": 36600,
                            "actual_us": 4692,
                            "end_date": "4/17/2025",
                            "notes": ["*Renewed 2-yr contract in Apr-23"]
                        }
                    ]
                }
            ],
            "subtotal": {
                "budget_us": 5431,
                "budget_hk": 42360,
                "increment_pct": 0.0,
                "actual_hk": 42360,
                "actual_us": 5431
            }
        },
        {
            "number": 5,
            "name": "Telephone Lines",
            "ref": "15-3",
            "items": [
                {
                    "item_number": "5.2",
                    "name": "9 lines (8 for Rightfax & 1 for CMI)",
                    "budget_us": 3084,
                    "budget_hk": 24053,
                    "increment_pct": 0.0,
                    "charge_to": "RHK",
                    "actual_hk": 24053,
                    "actual_us": 3084,
                    "end_date": "on-going",
                    "notes": [
                        "*Being follow-up by RHK",
                        "*reduced from 3 to 2 lines wef 7/5/25"
                    ]
                }
            ],
            "subtotal": {
                "budget_us": 3084,
                "budget_hk": 24053,
                "increment_pct": 0.0,
                "actual_hk": 24053,
                "actual_us": 3084
            }
        }
    ]
}

# Save to file
output_path = "C:/Users/rci.ChrisLai/Documents/GitHub/ai-it-project-process-management-webapp/docs/om-expense-screenshot-extracted.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(extracted_data, f, ensure_ascii=False, indent=2)

print("Data extracted and saved!")
print(f"Output: {output_path}")
print()
print("=" * 70)
print("EXTRACTION SUMMARY - Screenshot 1 (A) Datalines)")
print("=" * 70)
print(f"Category: {extracted_data['category']}")
print(f"Headers extracted: {len(extracted_data['headers'])}")
print()

total_items = 0
for header in extracted_data["headers"]:
    print(f"  #{header['number']} {header['name'][:55]}")

    # Count and show items
    items = header.get("items", [])
    for item in items:
        total_items += 1
        bud = f"US${item['budget_us']:,}" if item.get("budget_us") else "-"
        end = item.get("end_date", "-") or "-"
        print(f"      [{item['item_number']:4}] {item['name'][:42]} | {bud} | End: {end}")

    # Sub-sections
    for sub in header.get("sub_sections", []):
        print(f"      Sub: {sub['name']}")
        for item in sub.get("items", []):
            total_items += 1
            bud = f"US${item['budget_us']:,}" if item.get("budget_us") else "-"
            end = item.get("end_date", "-") or "-"
            print(f"        [{item['item_number']:4}] {item['name'][:38]} | {bud} | End: {end}")

    st = header.get("subtotal", {})
    if st:
        print(f"      --- Subtotal: US${st.get('budget_us',0):,} / HK${st.get('budget_hk',0):,}")
    print()

print(f"Total Items extracted: {total_items}")
