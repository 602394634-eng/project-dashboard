#!/usr/bin/env python3
"""WPS 数据同步服务 - 定时从WPS云表格拉取数据，提供REST API"""

import json
import subprocess
import os
import time
import threading
from pathlib import Path

FILE_ID = "RUPn6afnmxMEihs1Bb5N1xUmgNcNGTwmW"

# Sheet 配置: {sheet_id: sheet_name}
SHEETS = {
    2: "项目节点完成情况",
    13: "试制计划及进展",
    1: "6月项目异常台账",
    11: "项目异常台账",
    5: "T4异常",
    15: "（测试）箱变",
}

CACHE_DIR = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)

_cache = {}
_cache_lock = threading.Lock()
_last_sync = 0
SYNC_INTERVAL = 300  # 5分钟同步一次


def run_kdocs(*args, timeout=60000):
    """运行 kdocs-cli 命令并返回 JSON 结果"""
    cmd = ["kdocs-cli"] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout / 1000)
        if result.returncode != 0:
            print(f"kdocs-cli error: {result.stderr}")
            return None
        return json.loads(result.stdout)
    except Exception as e:
        print(f"kdocs-cli exception: {e}")
        return None


def fetch_sheet_data(sheet_id, row_from=0, row_to=100, col_from=0, col_to=30):
    """从WPS拉取单个sheet数据"""
    print(f"Fetching sheet {sheet_id}...")
    
    result = run_kdocs(
        "sheet", "get-range-data",
        json.dumps({
            "file_id": FILE_ID,
            "worksheet_id": sheet_id,
            "range": {
                "rowFrom": row_from,
                "rowTo": row_to,
                "colFrom": col_from,
                "colTo": col_to,
            }
        }),
        timeout=60000
    )
    
    if result and result.get("code") == 0:
        detail = result.get("data", {}).get("detail", {})
        range_data = detail.get("rangeData", [])
        
        # 简化数据
        simplified = []
        for cell in range_data:
            simplified.append({
                "originRow": cell.get("originRow", 0),
                "originCol": cell.get("originCol", 0),
                "cellText": cell.get("cellText", ""),
            })
        
        print(f"  Sheet {sheet_id}: {len(simplified)} cells")
        return simplified
    
    print(f"  Sheet {sheet_id}: FAILED")
    return None


def sync_all_sheets():
    """同步所有sheet数据"""
    global _last_sync
    
    print(f"\n=== Syncing all sheets at {time.strftime('%Y-%m-%d %H:%M:%S')} ===")
    
    new_cache = {}
    for sheet_id, sheet_name in SHEETS.items():
        data = fetch_sheet_data(sheet_id)
        if data is not None:
            new_cache[str(sheet_id)] = {
                "name": sheet_name,
                "data": data,
                "updated_at": time.time(),
            }
    
    with _cache_lock:
        _cache.clear()
        _cache.update(new_cache)
        _last_sync = time.time()
    
    print(f"=== Sync complete: {len(new_cache)} sheets updated ===\n")
    return len(new_cache)


def get_cache():
    """获取缓存数据"""
    with _cache_lock:
        return dict(_cache), _last_sync


def needs_sync():
    """检查是否需要同步"""
    with _cache_lock:
        if not _cache:
            return True
        return (time.time() - _last_sync) > SYNC_INTERVAL


def load_local_fallback():
    """加载本地JSON作为后备数据"""
    import glob
    
    local_dir = Path(__file__).parent.parent / "public" / "data"
    if not local_dir.exists():
        return {}
    
    data = {}
    for f in sorted(local_dir.glob("sheet_*.json")):
        sheet_id = f.stem.replace("sheet_", "")
        try:
            with open(f, "r") as fp:
                content = json.load(fp)
            data[sheet_id] = {
                "name": SHEETS.get(int(sheet_id), f"Sheet {sheet_id}"),
                "data": content.get("rangeData", []),
                "updated_at": os.path.getmtime(f),
            }
        except Exception as e:
            print(f"Error loading {f}: {e}")
    
    return data


def start_background_sync():
    """启动后台同步线程"""
    def sync_loop():
        while True:
            try:
                sync_all_sheets()
            except Exception as e:
                print(f"Sync error: {e}")
            time.sleep(SYNC_INTERVAL)
    
    thread = threading.Thread(target=sync_loop, daemon=True)
    thread.start()
    print(f"Background sync started (interval: {SYNC_INTERVAL}s)")


# FastAPI 应用
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="WPS数据同步服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "last_sync": _last_sync, "sheets": len(_cache)}


@app.get("/api/sheets")
async def list_sheets():
    """列出所有sheet"""
    cache, _ = get_cache()
    sheets_info = []
    for sheet_id, info in cache.items():
        sheets_info.append({
            "id": sheet_id,
            "name": info["name"],
            "cell_count": len(info["data"]),
            "updated_at": info["updated_at"],
        })
    return {"sheets": sheets_info}


@app.get("/api/sheet/{sheet_id}")
async def get_sheet(sheet_id: str):
    """获取单个sheet数据"""
    cache, last_sync = get_cache()
    
    if sheet_id in cache:
        return {
            "sheetId": sheet_id,
            "name": cache[sheet_id]["name"],
            "rangeData": cache[sheet_id]["data"],
            "updated_at": cache[sheet_id]["updated_at"],
        }
    
    return JSONResponse(
        {"error": f"Sheet {sheet_id} not found"},
        status_code=404
    )


@app.get("/api/all")
async def get_all_sheets():
    """获取所有sheet数据"""
    cache, last_sync = get_cache()
    
    result = {
        "updated_at": last_sync,
        "sheets": {}
    }
    
    for sheet_id, info in cache.items():
        result["sheets"][sheet_id] = {
            "name": info["name"],
            "rangeData": info["data"],
        }
    
    return result


@app.post("/api/sync")
async def trigger_sync():
    """手动触发同步"""
    count = sync_all_sheets()
    return {"status": "ok", "sheets_synced": count, "timestamp": time.time()}


@app.on_event("startup")
async def startup():
    """启动时先加载本地数据，然后后台同步"""
    global _cache, _last_sync
    
    # 先加载本地后备数据
    local_data = load_local_fallback()
    if local_data:
        with _cache_lock:
            _cache.update(local_data)
            _last_sync = time.time()
        print(f"Loaded {len(local_data)} sheets from local cache")
    
    # 启动后台同步
    start_background_sync()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
