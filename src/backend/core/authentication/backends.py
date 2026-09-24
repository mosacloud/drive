"""Authentication Backends for the Drive core app."""

import logging

from django.conf import settings
from django.core.exceptions import SuspiciousOperation

from lasuite.oidc_login.backends import (
    OIDCAuthenticationBackend as LaSuiteOIDCAuthenticationBackend,
)

from core.authentication.exceptions import UserCannotAccessApp
from core.authentication.language import compute_language
from core.entitlements import get_entitlements_backend
from core.models import DuplicateEmailError

logger = logging.getLogger(__name__)


class OIDCAuthenticationBackend(LaSuiteOIDCAuthenticationBackend):
    """Custom OpenID Connect (OIDC) Authentication Backend.

    This class overrides the default OIDC Authentication Backend to accommodate differences
    in the User and Identity models, and handles signed and/or encrypted UserInfo response.
    """

    def compute_full_name(self, user_info):
        """
        Compute the user's full name from OIDC fields in settings.

        `OIDC_USERINFO_FULLNAME_FIELDS` lists first- and last-name field
        candidates for different IdP naming conventions (e.g. Keycloak's
        `first_name`/`last_name` vs. standard OIDC `given_name`/`family_name`).
        Some IdPs populate more than one convention for the same person, so
        pick the first non-empty candidate per slot instead of joining every
        truthy field, to avoid duplicating the name (e.g. "John Doe John Doe").

        The list must alternate given,family,given,family,... — fields are
        matched positionally (even indices are given-name candidates, odd
        indices family-name candidates), not by field name. A misconfigured,
        non-alternating list silently pairs the wrong fields.
        """
        name_fields = settings.OIDC_USERINFO_FULLNAME_FIELDS
        given_name_fields = name_fields[0::2]
        family_name_fields = name_fields[1::2]

        def first_present(fields):
            return next((user_info[field] for field in fields if user_info.get(field)), None)

        parts = [first_present(given_name_fields), first_present(family_name_fields)]
        full_name = " ".join(part for part in parts if part)
        return full_name or None

    def get_extra_claims(self, user_info):
        """
        Return extra claims from user_info.

        Args:
          user_info (dict): The user information dictionary.

        Returns:
          dict: A dictionary of extra claims.
        """

        # We need to add the claims that we want to store so that they are
        # available in the post_get_or_create_user method.
        claims_to_store = {claim: user_info.get(claim) for claim in settings.OIDC_STORE_CLAIMS}
        extra = {
            "full_name": self.compute_full_name(user_info),
            "short_name": user_info.get(settings.OIDC_USERINFO_SHORTNAME_FIELD),
            "claims": claims_to_store,
        }
        language = compute_language(user_info)
        if language:
            extra["language"] = language
        return extra

    def get_existing_user(self, sub, email):
        """Fetch existing user by sub or email."""

        try:
            return self.UserModel.objects.get_user_by_sub_or_email(sub, email)
        except DuplicateEmailError as err:
            raise SuspiciousOperation(err.message) from err

    def get_or_create_user(self, access_token, id_token, payload):
        user = super().get_or_create_user(access_token, id_token, payload)
        entitlement_backend = get_entitlements_backend()
        result = entitlement_backend.can_access(user)
        if not result["result"]:
            raise UserCannotAccessApp(result.get("message", "User does not have access to the app"))
        return user
