"""Unit tests for core.authentication.language."""

from django.test.utils import override_settings

import pytest

from core.authentication.backends import OIDCAuthenticationBackend
from core.authentication.language import (
    compute_language,
    compute_stored_language,
    is_language_confirmed,
)
from core.factories import UserFactory

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    "locale,expected",
    [
        ("nl", "nl-nl"),
        ("nl-NL", "nl-nl"),
        ("nl_NL", "nl-nl"),  # some IdPs send an underscore tag
        (" NL ", "nl-nl"),
        ("en-US", "en-us"),
        ("fr", "fr-fr"),
        ("ja", None),  # not a supported language
        ("es", None),
        ("", None),
        (None, None),
    ],
)
def test_compute_language(locale, expected):
    """compute_language() maps a BCP47 "locale" claim to a supported language code."""
    assert compute_language({"locale": locale}) == expected


def test_compute_language_non_string_claim():
    """A non-string "locale" claim is rejected rather than crashing."""
    assert compute_language({"locale": ["nl"]}) is None


def test_compute_language_missing_claim():
    """No "locale" claim at all resolves to None, not a KeyError."""
    assert compute_language({}) is None


@pytest.mark.parametrize(
    "locale,expected_confirmation",
    [("nl", True), ("nl-NL", True), ("ja", False), (None, False)],
)
def test_authentication_records_language_confirmation(locale, expected_confirmation, monkeypatch):
    """
    The flag must say whether the IdP asserted a *usable* locale — an
    unsupported ("ja") or absent claim counts as unconfirmed, distinguishing
    it from a language the IdP actually chose for this user.
    """
    db_user = UserFactory()
    klass = OIDCAuthenticationBackend()

    def get_userinfo_mocked(*args):
        user_info = {"sub": db_user.sub, "email": db_user.email}
        if locale is not None:
            user_info["locale"] = locale
        return user_info

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    klass.get_or_create_user(access_token="test-token", id_token=None, payload=None)

    db_user.refresh_from_db()
    assert db_user.language_confirmed_by_idp is expected_confirmation


@override_settings(OIDC_STORE_CLAIMS=[])
def test_language_confirmation_follows_the_store_claims_setting(monkeypatch):
    """
    Deriving the flag from the stored claim ties it to OIDC_STORE_CLAIMS: an
    operator who stops persisting claims also gives up the "the IdP manages
    this user's language" signal.
    """
    db_user = UserFactory()
    klass = OIDCAuthenticationBackend()

    def get_userinfo_mocked(*args):
        return {"sub": db_user.sub, "email": db_user.email, "locale": "nl"}

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    klass.get_or_create_user(access_token="test-token", id_token=None, payload=None)

    db_user.refresh_from_db()
    # The language itself is still applied — only the provenance is lost.
    assert db_user.language == "nl-nl"
    assert db_user.language_confirmed_by_idp is False


def test_authentication_updates_language_from_locale_claim(monkeypatch):
    """
    Real path: a "locale" claim on an existing user's re-login ends up in
    User.language via get_or_create_user -> update_user_if_needed, not just
    resolved in isolation by compute_language().
    """
    db_user = UserFactory(language="en-us")
    klass = OIDCAuthenticationBackend()

    def get_userinfo_mocked(*args):
        return {"sub": db_user.sub, "email": db_user.email, "locale": "nl"}

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    user = klass.get_or_create_user(access_token="test-token", id_token=None, payload=None)

    user.refresh_from_db()
    assert user == db_user
    assert user.language == "nl-nl"


def test_authentication_stores_default_language_when_locale_claim_unsupported(monkeypatch):
    """A well-formed but unsupported "locale" must not leave the old language in place."""
    db_user = UserFactory(language="fr-fr")
    klass = OIDCAuthenticationBackend()

    def get_userinfo_mocked(*args):
        return {"sub": db_user.sub, "email": db_user.email, "locale": "ja"}

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    user = klass.get_or_create_user(access_token="test-token", id_token=None, payload=None)

    user.refresh_from_db()
    assert user.language == "en-us"
    assert user.language_confirmed_by_idp is False


@pytest.mark.parametrize("locale", ["und", "*", "   ", 5, ["nl"]])
def test_authentication_keeps_language_when_locale_claim_malformed(monkeypatch, locale):
    """A blank or malformed "locale" leaves the existing language alone."""
    db_user = UserFactory(language="fr-fr")
    klass = OIDCAuthenticationBackend()

    def get_userinfo_mocked(*args):
        return {"sub": db_user.sub, "email": db_user.email, "locale": locale}

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    user = klass.get_or_create_user(access_token="test-token", id_token=None, payload=None)

    user.refresh_from_db()
    assert user.language == "fr-fr"


@pytest.mark.parametrize(
    "locale,expected",
    [
        ("nl", "nl-nl"),
        ("nl_NL", "nl-nl"),
        ("es", "en-us"),  # well-formed but unsupported: default language
        ("pt-BR", "en-us"),
        ("und", None),
        ("*", None),
        ("x-foo", None),
        ("", None),
        ("   ", None),
        (None, None),
        (5, None),
        (["nl"], None),
    ],
)
def test_compute_stored_language(locale, expected):
    """Unsupported locales fall back to the default; malformed ones return None."""
    assert compute_stored_language({"sub": "abc", "locale": locale}) == expected


def test_compute_stored_language_missing_claim():
    """No "locale" claim at all leaves the stored language untouched."""
    assert compute_stored_language({"sub": "abc"}) is None


@override_settings(LANGUAGE_CODE="en")
def test_compute_stored_language_default_is_a_supported_code():
    """A bare LANGUAGE_CODE is mapped onto the matching settings.LANGUAGES code."""
    assert compute_stored_language({"locale": "es"}) == "en-us"


def test_malformed_locale_warning_names_sub_and_truncates(caplog):
    """The warning identifies the user and caps the logged value."""
    compute_stored_language({"sub": "abc-123", "locale": "*" + "x" * 500})
    assert "abc-123" in caplog.text
    assert "x" * 100 not in caplog.text


@pytest.mark.parametrize(
    "claims,language,expected",
    [
        ({"locale": "nl-NL"}, "nl-nl", True),
        ({"locale": "nl-NL"}, "fr-fr", False),  # changed afterwards, no longer the IdP's
        ({"locale": "es"}, "en-us", False),  # unsupported: stored default is not "confirmed"
        ({}, "nl-nl", False),
        (None, "nl-nl", False),
        (["locale"], "nl-nl", False),
    ],
)
def test_is_language_confirmed(claims, language, expected):
    """Confirmed only when the language equals the one the stored claim maps to."""
    assert is_language_confirmed(claims, language) is expected
