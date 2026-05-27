"""Celery tasks for WOPI conversion."""

import logging

from django.contrib.auth import get_user_model

from core import models
from wopi.conversion.exceptions import ConversionProviderError
from wopi.conversion.services import perform_conversion

from drive.celery_app import app

logger = logging.getLogger(__name__)


class ConvertFileTask(app.Task):
    """Celery task base deleting the placeholder when conversion ultimately fails."""

    # pylint: disable-next=too-many-arguments,too-many-positional-arguments
    def on_failure(self, _exc, _task_id, _args, kwargs, _einfo):
        """Hard-delete the placeholder after retries are exhausted."""
        placeholder_id = kwargs.get("converted_item_id")
        if not placeholder_id:
            return

        try:
            placeholder = models.Item.objects.get(id=placeholder_id)
            placeholder.soft_delete()
            placeholder.delete()
        except models.Item.DoesNotExist:
            return


@app.task(
    base=ConvertFileTask,
    autoretry_for=(ConversionProviderError,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=3,
)
def convert_file(source_item_id, converted_item_id, user_id):
    """Convert the source item and attach the result to the placeholder."""
    User = get_user_model()  # pylint: disable=invalid-name

    try:
        source = models.Item.objects.get(id=source_item_id)
    except models.Item.DoesNotExist:
        logger.error("convert_file: source item %s does not exist, aborting", source_item_id)
        return

    try:
        placeholder = models.Item.objects.get(id=converted_item_id)
    except models.Item.DoesNotExist:
        logger.error(
            "convert_file: placeholder item %s does not exist, aborting", converted_item_id
        )
        return

    if placeholder.upload_state != models.ItemUploadStateChoices.CONVERTING:
        logger.error(
            "convert_file: placeholder %s upload_state is %s, not converting; aborting",
            placeholder.id,
            placeholder.upload_state,
        )
        return

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error("convert_file: user %s does not exist, aborting", user_id)
        return

    try:
        perform_conversion(source, placeholder, user)
    except Exception:
        logger.exception("convert_file: conversion failed for placeholder %s", placeholder.id)
        raise
