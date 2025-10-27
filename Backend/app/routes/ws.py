from fastapi import APIRouter, WebSocket
from app.core.connection_handler import handle_connection
from uuid import uuid4

ws_router = APIRouter()
@ws_router.websocket("/ws/")
async def ws_endpoint(ws: WebSocket):
    user_id = uuid4()
    await handle_connection(ws, user_id)




