import unittest
from unittest.mock import Mock

from services.discovery_worker.google_places import MAX_PLACES_PAGES_PER_CITY, fetch_city_places


class GooglePlacesTests(unittest.TestCase):
    def test_page_cap_enforced_before_api_calls(self) -> None:
        fetcher = Mock()
        fetcher.fetch_json.side_effect = [
            {"results": [{"place_id": "1"}], "next_page_token": "t1"},
            {"results": [{"place_id": "2"}], "next_page_token": "t2"},
            {"results": [{"place_id": "3"}], "next_page_token": "t3"},
            {"results": [{"place_id": "4"}]},
        ]

        places = fetch_city_places(
            fetcher=fetcher,
            api_key="k",
            city="Austin",
            query="realtors",
            max_pages=999,
        )

        self.assertEqual(fetcher.fetch_json.call_count, MAX_PLACES_PAGES_PER_CITY)
        self.assertEqual([p["place_id"] for p in places], ["1", "2", "3"])

    def test_zero_results_logged_as_warning(self) -> None:
        fetcher = Mock()
        fetcher.fetch_json.return_value = {"results": []}
        logger = Mock()

        places = fetch_city_places(fetcher=fetcher, api_key="k", city="Dallas", query="travel", logger=logger)

        self.assertEqual(places, [])
        logger.warning.assert_called_once()


if __name__ == "__main__":
    unittest.main()

