"""只读共享：把一组ROI标记与测量参数打成快照共享给他人。

- 快照标明来源（创建者）与共享时间
- 只有在允许查看名单中的人才能看到标记细节，否则返回原因
- 创建者可撤回共享，撤回后链接立即失效
"""
import secrets
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/shares", tags=["sharing"])


class SharedMarker(BaseModel):
    label: str
    center: List[float]
    radius: float


class ShareCreateRequest(BaseModel):
    owner: str = Field(..., min_length=1)  # 来源（创建者标识）
    preset: str = "brain"
    window: float = 80.0
    level: float = 40.0
    markers: List[SharedMarker]
    allowed_viewers: List[str] = []  # 允许查看者名单
    note: str = ""


class ShareRecord(ShareCreateRequest):
    token: str
    created_at: str
    revoked: bool = False


# 内存存储（演示用，服务重启后共享记录清空）
_SHARES: dict[str, ShareRecord] = {}


def _public_view(rec: ShareRecord) -> dict:
    """授权查看者可见的只读快照（标明来源与共享时间）"""
    return {
        "token": rec.token,
        "owner": rec.owner,
        "created_at": rec.created_at,
        "preset": rec.preset,
        "window": rec.window,
        "level": rec.level,
        "markers": [m.model_dump() for m in rec.markers],
        "note": rec.note,
        "readonly": True,
    }


@router.post("", status_code=201)
def create_share(req: ShareCreateRequest):
    if not req.markers:
        raise HTTPException(400, "共享内容为空：请至少包含一个标记")
    token = secrets.token_hex(8)
    rec = ShareRecord(
        **req.model_dump(),
        token=token,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    _SHARES[token] = rec
    return {
        "token": token,
        "owner": rec.owner,
        "created_at": rec.created_at,
        "marker_count": len(rec.markers),
        "allowed_viewers": rec.allowed_viewers,
    }


@router.get("")
def list_shares(owner: str = Query(..., min_length=1)):
    """创建者查看自己发出的共享列表（用于管理与撤回）"""
    shares = [
        {
            "token": r.token,
            "owner": r.owner,
            "created_at": r.created_at,
            "revoked": r.revoked,
            "marker_count": len(r.markers),
            "allowed_viewers": r.allowed_viewers,
            "note": r.note,
        }
        for r in _SHARES.values()
        if r.owner == owner
    ]
    shares.sort(key=lambda s: s["created_at"], reverse=True)
    return {"shares": shares}


@router.get("/{token}")
def open_share(token: str, viewer: str = Query(..., min_length=1)):
    """打开共享：校验撤回状态与查看权限，未授权时不返回任何标记细节"""
    rec = _SHARES.get(token)
    if rec is None:
        raise HTTPException(404, "共享链接不存在或已失效")
    if rec.revoked:
        raise HTTPException(410, "该共享已被创建者撤回，标记内容不再可见")
    if viewer not in rec.allowed_viewers:
        raise HTTPException(
            403, f"当前身份「{viewer}」不在该共享的允许查看名单中，无法查看标记细节"
        )
    return _public_view(rec)


@router.post("/{token}/revoke")
def revoke_share(token: str, owner: str = Query(..., min_length=1)):
    """撤回共享：仅创建者本人可操作，撤回后立即生效"""
    rec = _SHARES.get(token)
    if rec is None:
        raise HTTPException(404, "共享链接不存在或已失效")
    if rec.owner != owner:
        raise HTTPException(403, "只有共享创建者本人可以撤回该共享")
    rec.revoked = True
    return {"token": token, "revoked": True}
