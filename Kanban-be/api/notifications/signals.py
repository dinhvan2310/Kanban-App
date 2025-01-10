from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from api.notifications.models import Request
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from api.notifications.serializers import RequestSerializer

@receiver(post_save, sender=Request)
def create_notification(sender, instance, created, **kwargs):
    requests = Request.objects.filter(user_receiver=instance.user_receiver)
    serializer = RequestSerializer(requests, many=True)
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{instance.user_receiver.user.id}',
        {
            'type': 'send.requests',
            'requests': serializer.data
        }
    )

@receiver(post_delete, sender=Request)
def delete_notification(sender, instance, **kwargs):
    requests = Request.objects.filter(user_receiver=instance.user_receiver)
    serializer = RequestSerializer(requests, many=True)
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'user_{instance.user_receiver.user.id}',
        {
            'type': 'send.requests',
            'requests': serializer.data
        }
    )