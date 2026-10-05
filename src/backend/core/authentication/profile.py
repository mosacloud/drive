"""Profile data (full name, picture) derived from OIDC claims."""

import logging
from urllib.parse import urlparse

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator

logger = logging.getLogger(__name__)

MAX_PICTURE_URL_LENGTH = 2048


def compute_full_name(user_info, name_fields):
    """Join the first non-empty given-name and family-name candidates.

    ``name_fields`` (``OIDC_USERINFO_FULLNAME_FIELDS``) lists candidates for
    different IdP naming conventions (``first_name``/``last_name`` and the
    standard ``given_name``/``family_name``). Some IdPs fill more than one
    convention, so one candidate is picked per slot instead of joining every
    truthy field ("John Doe John Doe").

    An even-length list alternates given,family,given,family,...: fields are
    paired by position (even indices are given names), not by field name. An
    odd-length list can't be paired (e.g. ``first_name,middle_name,last_name``
    or a single ``name``), so every non-empty value is joined in order instead,
    without repeating a value, rather than silently dropping part of the name.
    Non-string and blank values are ignored.
    """

    def present(fields):
        for field in fields:
            value = user_info.get(field)
            if isinstance(value, str) and value.strip():
                yield value.strip()

    if len(name_fields) % 2:
        parts = list(dict.fromkeys(present(name_fields)))
    else:
        parts = [
            next(present(name_fields[0::2]), None),
            next(present(name_fields[1::2]), None),
        ]
    return " ".join(part for part in parts if part) or None


def claims_dict(claims):
    """Return stored OIDC claims, tolerating a null or non-dict JSON value."""
    return claims if isinstance(claims, dict) else {}


def picture_from_claims(claims):
    """Return the "picture" claim if it is an http(s) URL with a host."""
    picture = claims_dict(claims).get("picture")
    if not isinstance(picture, str) or not picture:
        return None
    if len(picture) > MAX_PICTURE_URL_LENGTH:
        logger.info("Ignoring OIDC 'picture': longer than %d characters", MAX_PICTURE_URL_LENGTH)
        return None
    try:
        parsed = urlparse(picture)
    except ValueError:
        logger.info("Ignoring OIDC 'picture': not a valid URL")
        return None
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        logger.info("Ignoring OIDC 'picture' with scheme %r or no host", parsed.scheme)
        return None
    try:
        # The claim ends up in an <img src>: also reject spaces, control
        # characters and other malformed URLs that urlparse accepts.
        URLValidator(schemes=["http", "https"])(picture)
    except ValidationError:
        logger.info("Ignoring OIDC 'picture': not a valid URL")
        return None
    return picture
