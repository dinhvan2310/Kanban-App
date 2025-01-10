# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class WorkspaceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        workspace_id = self.scope["url_route"]["kwargs"]["workspace_id"]
        print('workspace_id', workspace_id)
        self.room_group_name = f'workspace_{workspace_id}'
        if user.is_anonymous:
            self.close()
        else:
            await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def send_request_reload_data(self, event):
        user_id = event['user_id']
        print('send_request_reload_data', user_id)
        await self.send(text_data=json.dumps({
            'type': 'reload_data',
            'user_id': user_id
        }))