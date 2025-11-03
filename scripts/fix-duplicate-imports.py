#!/usr/bin/env python3
"""
自動修復重複 import 語句

掃描並修復所有文件中重複的 import { useTranslations } from 'next-intl'

使用方法:
python scripts/fix-duplicate-imports.py
"""

import os
import sys

# 受影響的文件清單 (從 check-duplicate-imports.js 的輸出)
AFFECTED_FILES = [
    "apps/web/src/app/[locale]/budget-pools/new/page.tsx",
    "apps/web/src/app/[locale]/budget-pools/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/budget-pools/[id]/page.tsx",
    "apps/web/src/app/[locale]/charge-outs/new/page.tsx",
    "apps/web/src/app/[locale]/charge-outs/page.tsx",
    "apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/charge-outs/[id]/page.tsx",
    "apps/web/src/app/[locale]/expenses/new/page.tsx",
    "apps/web/src/app/[locale]/expenses/page.tsx",
    "apps/web/src/app/[locale]/expenses/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/expenses/[id]/page.tsx",
    "apps/web/src/app/[locale]/notifications/page.tsx",
    "apps/web/src/app/[locale]/om-expenses/new/page.tsx",
    "apps/web/src/app/[locale]/om-expenses/page.tsx",
    "apps/web/src/app/[locale]/om-expenses/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/om-expenses/[id]/page.tsx",
    "apps/web/src/app/[locale]/projects/[id]/quotes/page.tsx",
    "apps/web/src/app/[locale]/proposals/new/page.tsx",
    "apps/web/src/app/[locale]/proposals/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/proposals/[id]/page.tsx",
    "apps/web/src/app/[locale]/purchase-orders/new/page.tsx",
    "apps/web/src/app/[locale]/purchase-orders/page.tsx",
    "apps/web/src/app/[locale]/purchase-orders/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx",
    "apps/web/src/app/[locale]/quotes/new/page.tsx",
    "apps/web/src/app/[locale]/quotes/page.tsx",
    "apps/web/src/app/[locale]/quotes/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/settings/page.tsx",
    "apps/web/src/app/[locale]/users/new/page.tsx",
    "apps/web/src/app/[locale]/users/page.tsx",
    "apps/web/src/app/[locale]/users/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/users/[id]/page.tsx",
    "apps/web/src/app/[locale]/vendors/new/page.tsx",
    "apps/web/src/app/[locale]/vendors/page.tsx",
    "apps/web/src/app/[locale]/vendors/[id]/edit/page.tsx",
    "apps/web/src/app/[locale]/vendors/[id]/page.tsx",
    "apps/web/src/components/budget-pool/BudgetPoolForm.tsx",
    "apps/web/src/components/proposal/BudgetProposalForm.tsx",
    "apps/web/src/components/proposal/ProposalActions.tsx",
]

def fix_duplicate_imports(file_path):
    """
    移除文件中重複的 import { useTranslations } from 'next-intl'
    保留第一個,刪除其他所有重複的

    Returns:
        int: 移除的重複 import 數量
    """
    if not os.path.exists(file_path):
        print(f"[WARNING] 文件不存在: {file_path}")
        return 0

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 找到所有 useTranslations import 的行號
    import_line_indices = []
    for i, line in enumerate(lines):
        if "import { useTranslations } from 'next-intl'" in line:
            import_line_indices.append(i)

    if len(import_line_indices) <= 1:
        return 0  # 沒有重複

    # 保留第一個,標記其他為刪除
    lines_to_remove = import_line_indices[1:]

    # 從後往前刪除,避免索引變化
    for i in sorted(lines_to_remove, reverse=True):
        del lines[i]

    # 寫回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    return len(lines_to_remove)

def main():
    print("[START] 開始批量修復重複 import...\n")

    total_files = len(AFFECTED_FILES)
    total_removed = 0
    success_count = 0

    for i, file_path in enumerate(AFFECTED_FILES, 1):
        # 轉換為 Windows 路徑
        file_path = file_path.replace('/', '\\')

        try:
            removed = fix_duplicate_imports(file_path)
            if removed > 0:
                print(f"[{i}/{total_files}] [SUCCESS] {file_path}")
                print(f"         移除 {removed} 個重複 import")
                total_removed += removed
                success_count += 1
            else:
                print(f"[{i}/{total_files}] [SKIP] {file_path}")
                print(f"         無重複 import")
        except Exception as e:
            print(f"[{i}/{total_files}] [ERROR] {file_path}")
            print(f"         錯誤: {str(e)}")

    print(f"\n" + "="*60)
    print(f"[SUMMARY] 修復完成統計:")
    print(f"   總文件數: {total_files}")
    print(f"   成功修復: {success_count}")
    print(f"   移除重複 import 總數: {total_removed}")
    print("="*60)

    if success_count > 0:
        print("\n[COMPLETE] 批量修復完成!")
        print("\n下一步:")
        print("   1. 運行檢查腳本驗證: node scripts/check-duplicate-imports.js")
        print("   2. TypeScript 類型檢查: pnpm typecheck")
        print("   3. 啟動開發服務器: pnpm dev")
        print("   4. 提交修復: git add . && git commit -m 'fix: remove duplicate imports'")
    else:
        print("\n[WARNING] 沒有文件被修復")

    return 0 if success_count == total_files else 1

if __name__ == "__main__":
    sys.exit(main())
