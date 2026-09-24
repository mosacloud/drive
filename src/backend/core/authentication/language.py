"""Mosa-specific: resolve a user's language from the OIDC "locale" claim.

Kept out of ``backends.py`` (a `lasuite`-maintained override point) so that
file's diff against upstream stays as small as possible — everything here is
net-new, added for the Epicentre/Hub -> Zitadel `locale`-claim flow.
"""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def compute_language(user_info):
    """Resolve a supported Django language code from the OIDC "locale" claim.

    Epicentre/Hub is the single place users set their language preference
    (written to Zitadel's standard ``locale`` claim); drive only reads it.
    The claim is a BCP47 tag (e.g. "nl", "nl-NL" or "en"); only its primary
    subtag is used, matched against the primary subtag of each code in
    ``settings.LANGUAGES`` (e.g. "en" -> "en-us", "nl" -> "nl-nl"). Returns
    None when the claim is missing, not a string, or not one of our
    supported languages, so it never overrides the user's existing language
    (the base ``update_user_if_needed`` only applies truthy claim values).
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
    lang_code = locale.split("-")[0].lower()
    supported_languages = {code.split("-")[0]: code for code, _name in settings.LANGUAGES}
    return supported_languages.get(lang_code)
