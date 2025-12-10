import json
from channels.generic.websocket import AsyncWebsocketConsumer

class UpdatesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.page_id = self.scope["url_route"]["kwargs"]["page_id"]
        self.group_name = f"page_{self.page_id}"
        
        # 加入 group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass  # 前端不需要傳資料

    async def send_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def send_remove(self,event):
        await self.send(text_data=json.dumps(event["data"]))

    async def send_displayOder(self,event):
        await self.send(text_data=json.dumps(event["data"]))

    async def send_reload(self,event):
        await self.send(text_data=json.dumps(event["data"]))

    async def send_autoPlayDelay(self,event):
        await self.send(text_data=json.dumps(event["data"]))