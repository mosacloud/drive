"""Unit tests for core.authentication.profile."""

import pytest

from core.authentication.profile import compute_full_name, picture_from_claims

NAME_FIELDS = ["first_name", "last_name", "given_name", "family_name"]


@pytest.mark.parametrize(
    "user_info,expected",
    [
        ({"first_name": "John", "last_name": "Doe"}, "John Doe"),
        ({"given_name": "John", "family_name": "Doe"}, "John Doe"),
        # Both conventions filled: one candidate per slot, no duplication.
        (
            {"first_name": "John", "last_name": "Doe", "given_name": "John", "family_name": "Doe"},
            "John Doe",
        ),
        ({"first_name": "  John ", "last_name": " Doe  "}, "John Doe"),
        ({"first_name": "John", "last_name": None}, "John"),
        # Non-string and blank values are ignored instead of raising a TypeError.
        ({"first_name": 5, "last_name": ["Doe"]}, None),
        ({"first_name": "   ", "last_name": ""}, None),
        ({}, None),
    ],
)
def test_compute_full_name(user_info, expected):
    """One trimmed given and family name; junk values never crash the login."""
    assert compute_full_name(user_info, NAME_FIELDS) == expected


@pytest.mark.parametrize(
    "claims,expected",
    [
        ({"picture": "https://example.com/a.png"}, "https://example.com/a.png"),
        ({"picture": "http://example.com/a.png"}, "http://example.com/a.png"),
        ({"picture": "javascript:alert(1)"}, None),
        ({"picture": "data:image/png;base64,AAAA"}, None),
        ({"picture": "https://"}, None),  # no host
        ({"picture": "/relative.png"}, None),
        ({"picture": "http://exa mple.com/a b"}, None),  # spaces
        ({"picture": "https://@/x"}, None),  # userinfo only, no host
        ({"picture": "http://["}, None),  # urlparse raises ValueError
        ({"picture": "https://example.com/" + "a" * 2048}, None),  # too long
        ({"picture": 5}, None),
        ({"picture": ""}, None),
        ({}, None),
        (None, None),
        (["picture"], None),
        ("picture", None),
    ],
)
def test_picture_from_claims(claims, expected):
    """Only a plain http(s) URL with a host survives; anything else is dropped."""
    assert picture_from_claims(claims) == expected
