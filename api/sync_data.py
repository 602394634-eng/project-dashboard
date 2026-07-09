#!/usr/bin/env python3
"""
数据同步脚本 - 从WPS云表格拉取最新数据并保存为JSON
由 cron job / GitHub Action 定期执行
运行方式: python3 sync_data.py
"""

import json
import subprocess
import os
import sys
from pathlib import Path

FILE_ID = "RUPn6afnmxMEihs1Bb5N1xUmgNcNGTwmW"

SHEETS = {
    2: {"name": "项目节点完成情况", "rows": 20, "cols": 26},
    13: {"name": "试制计划及进展", "rows": 28, "cols": 27},
    1: {"name": "6月项目异常台账", "rows": 52, "cols": 21},
    11: {"name": "项目异常台账", "rows": 72, "cols": 24},
    5: {"name": "T4异常", "rows": 25, "cols": 11},
    15: {"name": "（测试）箱变", "rows": 52, "cols": 31},
}

OUTPUT_DIR = Path(__file__).parent / "public" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def run_kdocs(*args, timeout=60000):
    """运行 kdocs-cli 命令"""
    cmd = ["kdocs-cli"] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout / 1000)
        if result.returncode != 0:
            print(f"  ERROR: {result.stderr.strip()}")
            return None
        return json.loads(result.stdout)
    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT after {timeout}ms")
        return None
    except Exception as e:
        print(f"  EXCEPTION: {e}")
        return None


def fetch_sheet(sheet_id, row_to, col_to):
    """拉取单个sheet"""
    print(f"  Fetching sheet {sheet_id} (rows: 0-{row_to}, cols: 0-{col_to})...")
    
    result = run_kdocs(
        "sheet", "get-range-data",
        json.dumps({
            "file_id": FILE_ID,
            "worksheet_id": sheet_id,
            "range": {
                "rowFrom": 0,
                "rowTo": row_to,
                "colFrom": 0,
                "colTo": col_to,
            }
        }),
        timeout=60000
    )
    
    if result and result.get("code") == 0:
        detail = result.get("data", {}).get("detail", {})
        range_data = detail.get("rangeData", [])
        
        simplified = []
        for cell in range_data:
            simplified.append({
                "originRow": cell.get("originRow", 0),
                "originCol": cell.get("originCol", 0),
                "cellText": cell.get("cellText", ""),
            })
        
        print(f"    ✅ {len(simplified)} cells")
        return simplified
    
    print(f"    ❌ Failed")
    return None


def main():
    print("=" * 60)
    print("WPS 数据同步")
    print(f"文件: {FILE_ID}")
    print("=" * 60)
    
    # 检查认证
    status = run_kdocs("auth", "status")
    if not status or not status.get("authenticated"):
        print("❌ WPS 未认证，请先运行 kdocs-cli auth login")
        sys.exit(1)
    
    success_count = 0
    for sheet_id, config in SHEETS.items():
        data = fetch_sheet(sheet_id, config["rows"], config["cols"])
        if data is None:
            print(f"  ⚠️  Sheet {sheet_id} failed, skipping...")
            continue
        
        output = {
            "sheetId": sheet_id,
            "name": config["name"],
            "rangeData": data,
        }
        
        outpath = OUTPUT_DIR / f"sheet_{sheet_id}.json"
        with open(outpath, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False)
        
        file_size = outpath.stat().st_size
        print(f"  📁 Saved: {outpath} ({file_size:,} bytes)")
        success_count += 1
    
    print(f"\n✅ 同步完成: {success_count}/{len(SHEETS)} sheets")
    
    if success_count == len(SHEETS):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
