"""Tests for the OIDC profile system check."""

from django.test.utils import override_settings

from core.authentication.checks import check_oidc_profile_settings


def _ids(**overrides):
    with override_settings(**overrides):
        return [message.id for message in check_oidc_profile_settings(None)]


def test_oidc_profile_check_defaults_do_not_warn():
    """The default configuration passes the check."""
    assert _ids() == []


def test_oidc_profile_check_warns_on_missing_scope():
    """Without the 'profile' scope no picture or locale is received."""
    assert _ids(OIDC_RP_SCOPES="openid email") == ["core.W001"]


def test_oidc_profile_check_warns_on_missing_stored_claims():
    """Dropping 'picture' or 'locale' from the stored claims disables features."""
    assert _ids(OIDC_STORE_CLAIMS=[]) == ["core.W002", "core.W002"]


def test_oidc_profile_check_warns_on_odd_fullname_fields():
    """Full-name fields are paired positionally, so the list must be even."""
    assert _ids(OIDC_USERINFO_FULLNAME_FIELDS=["first_name"]) == ["core.W003"]
