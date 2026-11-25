from collections.abc import Iterator

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.data import get_dataset
from app.main import app


@pytest.fixture
def dataset() -> pd.DataFrame:
    """Five business days of two hand-built Indices."""
    dates = pd.bdate_range("2024-01-01", periods=5)
    return pd.DataFrame(
        {
            "Index A": [100.0, 110.0, 99.0, 105.0, 120.0],
            "Index B": [100.0, 102.0, 104.0, 90.0, 95.0],
        },
        index=dates,
    )


@pytest.fixture
def client(dataset: pd.DataFrame) -> Iterator[TestClient]:
    app.dependency_overrides[get_dataset] = lambda: dataset
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
