import json
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"
USAGE_FILE = DATA_DIR / "usage.json"


def _ensure_dir():
    DATA_DIR.mkdir(exist_ok=True)


class UsageRecords(BaseModel):
    records: dict


@router.get("")
async def get_usage():
    _ensure_dir()
    if not USAGE_FILE.exists():
        return {"records": {}}
    try:
        data = json.loads(USAGE_FILE.read_text(encoding="utf-8"))
        return {"records": data.get("records", {})}
    except Exception:
        return {"records": {}}


@router.post("")
async def save_usage(body: UsageRecords):
    _ensure_dir()
    USAGE_FILE.write_text(
        json.dumps({"records": body.records}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return {"ok": True}
