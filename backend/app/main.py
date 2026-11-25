from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query

from app.data import get_dataset
from app.schemas import IndicesResponse, LevelsResponse, Series


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
    get_dataset()  # generate the synthetic data at startup
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


@app.get("/api/levels")
def levels(data: Dataset, names: Annotated[list[str], Query()]) -> LevelsResponse:
    unknown = [n for n in names if n not in data.columns]
    if unknown:
        raise HTTPException(404, f"Unknown Index: {', '.join(unknown)}")
    return LevelsResponse(
        dates=[d.date() for d in data.index],
        series=[Series(name=n, values=data[n].round(4).tolist()) for n in names],
    )
