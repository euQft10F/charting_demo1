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


class BarsResponse(BaseModel):
    """Bar-chart data, independent of any Charting Library."""

    categories: list[str]
    series: list[Series]
