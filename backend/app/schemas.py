import datetime as dt

from pydantic import BaseModel


class IndicesResponse(BaseModel):
    indices: list[str]
    start: dt.date
    end: dt.date


class Series(BaseModel):
    name: str
    values: list[float]


class LevelsResponse(BaseModel):
    dates: list[dt.date]
    series: list[Series]


class DrawdownsResponse(BaseModel):
    """Drawdowns in %, at most 0, on the days of the Window; None for an Index not asked for."""

    dates: list[dt.date]
    benchmark: Series | None
    strategy: Series | None
