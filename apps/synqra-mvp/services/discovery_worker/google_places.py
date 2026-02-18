import logging
from typing import Any

from .http_fetch import HttpFetcher

MAX_PLACES_PAGES_PER_CITY = 3
GOOGLE_PLACES_TEXTSEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"


def fetch_city_places(
    fetcher: HttpFetcher,
    api_key: str,
    city: str,
    query: str,
    max_pages: int = MAX_PLACES_PAGES_PER_CITY,
    logger: logging.Logger | None = None,
) -> list[dict[str, Any]]:
    if max_pages < 0:
        raise ValueError("max_pages must be >= 0")

    logger = logger or logging.getLogger(__name__)
    capped_pages = min(max_pages, MAX_PLACES_PAGES_PER_CITY)
    all_places: list[dict[str, Any]] = []
    next_page_token: str | None = None

    for _ in range(capped_pages):
        params = {"query": f"{query} in {city}", "key": api_key}
        if next_page_token:
            params["pagetoken"] = next_page_token

        payload = fetcher.fetch_json(GOOGLE_PLACES_TEXTSEARCH_URL, params=params)
        results = payload.get("results", [])
        if not results:
            logger.warning("Zero results returned for city=%s query=%s", city, query)

        all_places.extend(results)
        next_page_token = payload.get("next_page_token")
        if not next_page_token:
            break

    return all_places

