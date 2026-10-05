"""System checks for OIDC settings that silently disable the profile sync.

Django system checks run on ``manage.py check``, ``runserver`` and ``migrate``,
after logging is configured, so unlike a warning logged during settings setup
they are always visible.
"""

from django.conf import settings
from django.core import checks


@checks.register(checks.Tags.security, deploy=False)
def check_oidc_profile_settings(app_configs, **kwargs):  # pylint: disable=unused-argument
    """Warn when env overrides disable the picture, language or name sync."""
    messages = []
    scopes = str(settings.OIDC_RP_SCOPES).split()
    if "profile" not in scopes:
        messages.append(
            checks.Warning(
                "OIDC_RP_SCOPES lacks 'profile': no picture, locale or given/family "
                "name will be received from the identity provider.",
                hint="Add 'profile' to OIDC_RP_SCOPES.",
                id="core.W001",
            )
        )
    for claim in ("picture", "locale"):
        if claim not in settings.OIDC_STORE_CLAIMS:
            messages.append(
                checks.Warning(
                    f"OIDC_STORE_CLAIMS lacks {claim!r}: the matching profile feature is disabled.",
                    hint=f"Add {claim!r} to OIDC_STORE_CLAIMS.",
                    id="core.W002",
                )
            )
    if len(settings.OIDC_USERINFO_FULLNAME_FIELDS) % 2:
        messages.append(
            checks.Warning(
                "OIDC_USERINFO_FULLNAME_FIELDS should alternate given,family,... "
                "(even length); an odd-length list can't be paired, so all "
                f"non-empty values are joined instead: {settings.OIDC_USERINFO_FULLNAME_FIELDS}.",
                id="core.W003",
            )
        )
    return messages
