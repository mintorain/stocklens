from pydantic import BaseModel


class IndexDataOut(BaseModel):
    code: str
    name: str
    value: float
    prev_close: float
    change: float
    change_pct: float
    snapshot_date: str


class IndicesResponse(BaseModel):
    data: list[IndexDataOut]
    meta: dict
