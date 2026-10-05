"""Resolve a user's language from the OIDC "locale" claim."""

import logging
import re

from django.conf import settings

from core.authentication.profile import claims_dict

logger = logging.getLogger(__name__)


def compute_language(user_info):
    """Resolve a supported Django language code from the OIDC "locale" claim.

    The identity provider is the source of truth for the user's language
    (standard ``locale`` claim); the app only reads it. The claim is a BCP47
    tag (e.g. "nl", "nl-NL" or "en"); only its primary subtag is used,
    matched against the primary subtag of each code in ``settings.LANGUAGES``
    (e.g. "en" -> "en-us", "nl" -> "nl-nl").
    Returns None when the claim is missing, not a string, or not one of our
    supported languages. This only does the mapping; what to store for an
    unsupported language is decided by ``compute_stored_language``.
    """
    locale = user_info.get("locale")
    if locale is not None and not isinstance(locale, str):
        # Warning, not debug: the IdP sent a claim, but not the string BCP47
        # tag the OIDC spec requires — an IdP-side integration bug, not the
        # routine "profile scope not granted" case handled below.
        logger.warning("OIDC 'locale' claim is not a string: %r", locale)
        return None
    if not locale:
        # Debug, not warning/error: a missing claim is the expected state
        # for any tenant where the "profile" scope isn't actually granted
        # by the IdP, and this is the only place that surfaces it — grep
        # this when "language never syncs" is reported.
        logger.debug("No usable OIDC 'locale' claim in user_info")
        return None
    # Some IdPs send underscore tags ("nl_NL"); only the primary subtag matters.
    lang_code = locale.strip().replace("_", "-").split("-")[0].lower()
    return _supported_languages().get(lang_code)


def _supported_languages():
    """Map each primary subtag to its code in ``settings.LANGUAGES``."""
    return {code.split("-")[0]: code for code, _name in settings.LANGUAGES}


def _default_language():
    """``settings.LANGUAGE_CODE`` as a code from ``settings.LANGUAGES``."""
    code = settings.LANGUAGE_CODE
    return _supported_languages().get(code.split("-")[0].lower(), code)


def compute_stored_language(user_info):
    """Return the language to store on the user, or None to leave it untouched.

    A supported locale maps to its language. A well-formed locale the IdP
    asserted but we don't support (e.g. "es") falls back to
    the default language, so a stale value doesn't keep emails in the
    previous language. A missing, blank or malformed claim ("und", "*", a
    non-string) returns None so an IdP bug can't overwrite a good language.
    """
    language = compute_language(user_info)
    if language:
        return language
    locale = user_info.get("locale")
    if not isinstance(locale, str) or not locale.strip():
        return None
    primary = locale.strip().replace("_", "-").split("-")[0].lower()
    if primary == "und" or not re.fullmatch(r"[a-z]{2,3}", primary):
        logger.warning(
            "Ignoring malformed OIDC 'locale' %.40r for sub %s",
            locale,
            user_info.get("sub"),
        )
        return None
    default = _default_language()
    logger.warning(
        "Unsupported OIDC 'locale' %.40r for sub %s: storing default language %s",
        locale,
        user_info.get("sub"),
        default,
    )
    return default


def is_language_confirmed(claims, language):
    """Whether ``language`` equals the one the stored "locale" claim maps to."""
    claim_language = compute_language(claims_dict(claims))
    return claim_language is not None and language == claim_language
