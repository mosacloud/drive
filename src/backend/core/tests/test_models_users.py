"""
Unit tests for the User model
"""

from unittest import mock

from django.core import mail
from django.core.exceptions import ValidationError

import pytest

from core import factories, models

pytestmark = pytest.mark.django_db


def test_models_users_str():
    """The str representation should be the email."""
    user = factories.UserFactory()
    assert str(user) == user.email


def test_models_users_id_unique():
    """The "id" field should be unique."""
    user = factories.UserFactory()
    with pytest.raises(ValidationError, match="User with this Id already exists."):
        factories.UserFactory(id=user.id)


def test_models_users_send_mail_main_existing():
    """The "email_user' method should send mail to the user's email address."""
    user = factories.UserFactory()

    with mock.patch("django.core.mail.send_mail") as mock_send:
        user.email_user("my subject", "my message")

    mock_send.assert_called_once_with("my subject", "my message", None, [user.email])


def test_models_users_send_mail_main_missing():
    """The "email_user' method should fail if the user has no email address."""
    user = factories.UserFactory(email=None)

    with pytest.raises(ValueError) as excinfo:
        user.email_user("my subject", "my message")

    assert str(excinfo.value) == "User has no email address."


def test_models_users_convert_valid_invitations():
    """
    The "_convert_valid_invitations" method should convert valid invitations to item accesses.
    """
    email = "test@example.com"
    item = factories.ItemFactory()
    other_item = factories.ItemFactory()
    invitation_item = factories.InvitationFactory(email=email, item=item)
    invitation_other_item = factories.InvitationFactory(email="Test@example.coM", item=other_item)
    other_email_invitation = factories.InvitationFactory(email="pre_test@example.com", item=item)

    assert item.accesses.count() == 0
    assert other_item.accesses.count() == 0

    user = factories.UserFactory(email=email)

    assert item.accesses.filter(user=user).count() == 1
    assert other_item.accesses.filter(user=user).count() == 1

    assert not models.Invitation.objects.filter(id=invitation_item.id).exists()
    assert not models.Invitation.objects.filter(id=invitation_other_item.id).exists()
    assert models.Invitation.objects.filter(id=other_email_invitation.id).exists()


def test_models_users_send_email():
    """The "send_email" method should send a templated email to the user."""
    user = factories.UserFactory(email="recipient@example.com")

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    user.send_email(
        "my subject",
        {
            "title": "My title",
            "message": "My message",
            "link": "https://example.com/some-link/",
            "link_label": "Click here",
            "button_label": "Confirm",
        },
        "en",
    )

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 1

    # pylint: disable-next=no-member
    email = mail.outbox[0]

    assert email.to == ["recipient@example.com"]
    email_content = " ".join(email.body.split())

    assert "My message" in email_content
    assert "https://example.com/some-link/" in email_content


def test_models_users_picture_valid_url():
    """The "picture" property should return a valid http(s) claim value."""
    user = factories.UserFactory(claims={"picture": "https://example.com/avatar.png"})
    assert user.picture == "https://example.com/avatar.png"


def test_models_users_picture_missing():
    """The "picture" property should return None when the claim is absent."""
    user = factories.UserFactory(claims={})
    assert user.picture is None


@pytest.mark.parametrize(
    "picture",
    [
        "javascript:alert(1)",
        "ftp://example.com/avatar.png",
        "not a url",
        123,
        None,
    ],
)
def test_models_users_picture_invalid(picture):
    """The "picture" property should discard non-http(s) or non-string claim values."""
    user = factories.UserFactory(claims={"picture": picture})
    assert user.picture is None


def test_models_users_language_confirmed_by_idp_true():
    """language_confirmed_by_idp should be True for a supported locale claim."""
    user = factories.UserFactory(claims={"locale": "nl-NL"})
    assert user.language_confirmed_by_idp is True


@pytest.mark.parametrize("claims", [{}, {"locale": "ja-JP"}, {"locale": 123}])
def test_models_users_language_confirmed_by_idp_false(claims):
    """language_confirmed_by_idp should be False without a supported locale claim."""
    user = factories.UserFactory(claims=claims)
    assert user.language_confirmed_by_idp is False
