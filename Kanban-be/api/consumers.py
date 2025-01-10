# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from api.models import Request, Profile
from api.notifications.serializers import RequestSerializer
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User, AnonymousUser
from channels.db import database_sync_to_async

@database_sync_to_async
def get_request(user_id):
    return Request.objects.filter(user_receiver=Profile.objects.get(user=user_id))

class UserConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        self.room_group_name = f'user_{user.id}'
        if user.is_anonymous:
            self.close()
        else:
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

            request = await get_request(user.id)
            requestSerializer = await sync_to_async(RequestSerializer)(request, many=True)
            request_data = await sync_to_async(lambda: requestSerializer.data)()
            await self.send(text_data=json.dumps({
                'requests': request_data
            }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def send_requests(self, event):
        requests = event['requests']
        await self.send(text_data=json.dumps({
            'requests': requests
        }))