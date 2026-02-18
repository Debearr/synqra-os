import json
import logging
import re
from typing import Any
from urllib.parse import urlsplit, urlunsplit

from .email_extraction import extract_primary_email
from .google_places import fetch_city_places
from .http_fetch import HttpFetcher

TABLE_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_.]*$")


def deduplicate_places(raw_places: list[dict[str, Any]]) -> list[dict[str, Any]]:
    unique_places: list[dict[str, Any]] = []
    seen_place_ids: set[str] = set()
    seen_websites: set[str] = set()

    for place in raw_places:
        place_id = str(place.get("place_id", "")).strip()
        website_url = normalize_website_url(place.get("website"))

        if place_id and place_id in seen_place_ids:
            continue
        if website_url and website_url in seen_websites:
            continue

        if place_id:
            seen_place_ids.add(place_id)
        if website_url:
            seen_websites.add(website_url)

        unique_places.append(place)

    return unique_places


def upsert_discovered_places(
    connection: Any,
    table_name: str,
    places: list[dict[str, Any]],
) -> int:
    if not TABLE_PATTERN.fullmatch(table_name):
        raise ValueError(f"Unsafe table_name: {table_name}")

    deduped = deduplicate_places(places)
    if not deduped:
        return 0

    sql = (
        f"INSERT INTO {table_name} "
        "(place_id, name, website_url, city, primary_email, source_payload) "
        "VALUES (%(place_id)s, %(name)s, %(website_url)s, %(city)s, %(primary_email)s, %(source_payload)s::jsonb) "
        "ON CONFLICT (place_id) DO NOTHING"
    )

    with connection.cursor() as cursor:
        for place in deduped:
            payload = {
                "place_id": place.get("place_id"),
                "name": place.get("name"),
                "website_url": normalize_website_url(place.get("website")),
                "city": place.get("city"),
                "primary_email": extract_primary_email(place.get("website_text"), place.get("website_html")),
                "source_payload": json.dumps(place),
            }
            cursor.execute(sql, payload)
    connection.commit()
    return len(deduped)


def discover_city(
    fetcher: HttpFetcher,
    connection: Any,
    api_key: str,
    city: str,
    query: str,
    table_name: str,
    logger: logging.Logger | None = None,
) -> int:
    logger = logger or logging.getLogger(__name__)
    places = fetch_city_places(fetcher=fetcher, api_key=api_key, city=city, query=query, logger=logger)
    return upsert_discovered_places(connection=connection, table_name=table_name, places=places)


def normalize_website_url(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    stripped = value.strip().lower()
    if not stripped:
        return None

    parts = urlsplit(stripped)
    if not parts.netloc:
        parts = urlsplit(f"https://{stripped}")
    if not parts.netloc:
        return None

    normalized = urlunsplit((parts.scheme or "https", parts.netloc, parts.path.rstrip("/"), "", ""))
    return normalized

