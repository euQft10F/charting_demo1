import datetime as dt
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query

from app.buckets import BUCKET_LABELS, Frequency, bucket_means
from app.data import get_dataset
from app.schemas import BarsResponse, IndicesResponse, LevelsResponse, Series


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    # Generate the data at startup, honouring a test override of the dependency.
    app.dependency_overrides.get(get_dataset, get_dataset)()
    yield


app = FastAPI(title="Performance Charting", lifespan=lifespan)

Dataset = Annotated[pd.DataFrame, Depends(get_dataset)]


@app.get("/api/indices")
def list_indices(data: Dataset) -> IndicesResponse:
    return IndicesResponse(
        indices=list(data.columns),
        start=data.index[0].date(),
        end=data.index[-1].date(),
    )


def require_known(data: pd.DataFrame, names: list[str]) -> None:
    unknown = [n for n in names if n not in data.columns]
    if unknown:
        raise HTTPException(404, f"Unknown Index: {', '.join(unknown)}")


@app.get("/api/levels")
def levels(data: Dataset, names: Annotated[list[str], Query()]) -> LevelsResponse:
    require_known(data, names)
    return LevelsResponse(
        dates=[d.date() for d in data.index],
        series=[Series(name=n, values=data[n].round(4).tolist()) for n in names],
    )


@app.get("/api/performance-buckets")
def performance_buckets(
    data: Dataset,
    benchmark: str,
    strategy: str,
    start: dt.date,
    end: dt.date,
    frequency: Frequency = "daily",
) -> BarsResponse:
    require_known(data, [benchmark, strategy])
    benchmark_means, strategy_means = bucket_means(data, benchmark, strategy, start, end, frequency)
    return BarsResponse(
        categories=BUCKET_LABELS if benchmark_means else [],
        series=[
            Series(name=benchmark, values=benchmark_means),
            Series(name=strategy, values=strategy_means),
        ],
    )
