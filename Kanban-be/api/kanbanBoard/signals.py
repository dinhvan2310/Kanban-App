from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from .models import Cards, Workspaces
from api.models import Columns
from utils.cloudinary_upload_services import remove_file
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User

@receiver(post_delete, sender=Cards)
def post_delete_card(sender, instance, **kwargs):
    # remove image from cloudinary
    if instance.image:
        remove_file(instance.id)

@receiver(post_save, sender=Cards)
def post_save_card(sender, instance, created, **kwargs):
    if created:
        return
    if instance.image == None:
        # remove image from cloudinary
        remove_file(instance.id)

@receiver(post_save, sender=Columns)
def post_save_column(sender, instance, created, **kwargs):
    if created:
        # update column order in workspace 
        workspace = instance.workspace
        workspace.column_orders.append(str(instance.id))
        workspace.save()