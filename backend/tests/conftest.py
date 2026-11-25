from collections.abc import Callable, Generator
from contextlib import ExitStack

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
def client_for() -> Generator[Callable[[pd.DataFrame], TestClient]]:
    """Makes a client whose Indices are the given Levels; the override is undone afterwards."""
    with ExitStack() as stack:

        def make(levels: pd.DataFrame) -> TestClient:
            app.dependency_overrides[get_dataset] = lambda: levels
            return stack.enter_context(TestClient(app))

        yield make
    app.dependency_overrides.clear()


@pytest.fixture
def client(dataset: pd.DataFrame, client_for: Callable[[pd.DataFrame], TestClient]) -> TestClient:
    return client_for(dataset)
