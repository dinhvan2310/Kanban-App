from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def send_request_workspace_reload_data(user_id, workspace_id):
    print(f"Sending request to reload data to workspace_{f'workspace_{workspace_id}'}")
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'workspace_{workspace_id}',
        {
            'type': 'send_request_reload_data',
            'user_id': user_id
        }
    )
