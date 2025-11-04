from fastapi import WebSocket
import logging
import random
import string
from app.core.exceptions import RoomNotFoundError, UsernameInUseError

logger = logging.getLogger("app")

alphanumerics = string.ascii_lowercase + string.digits
def _generate_room_id() -> str:
    return ''.join(random.choices(alphanumerics, k=4))

class Room:
    def __init__(self, roomid: str, host: WebSocket):
        self.roomid = roomid
        self.users = {}
        self.host = host
    async def _remove_user(self, ws: WebSocket):
        user = ws.user_object
        if ws == self.host:
            self.host = None
            logger.debug(f"Host removed from room {self.roomid}")
            return
        if user.name in self.users:
            logger.debug(f"User removed from room {self.roomid}: {user.name}")
            del self.users[user.name]
            if self.host and self.host != ws:
                await self.host.send_json({"type": "USER_LEFT", "username": user.name})        
        user.room = None

    async def broadcast(self, message: dict):
        for user in self.users.values():
            logger.debug(f"Sending to user: {user.user_object.name} | message: {message}")
            await user.send_json(message)
    async def send_host(self, message: dict):
        if self.host:
            logger.debug(f"Sending to host: {message}")
            await self.host.send_json(message)
    
    async def _add_user(self, user: WebSocket):
        self.users[user.user_object.name] = user

    def _is_empty(self) -> bool:
        return not self.users and not self.host


class RoomManager:
    def __init__(self):
        self._rooms = {}

    async def create_room(self, host: WebSocket) -> str:
        user = host.user_object
        if user.room:
            room = user.room
            await room._remove_user(host)
            if room._is_empty():
                del self._rooms[room.roomid]
                logger.debug(f"Room removed: {room.roomid}")
        roomid = _generate_room_id()
        ## Handle minimal chance of collision in room names
        while roomid in self._rooms:
            roomid = _generate_room_id()
        user.room = Room(roomid, host)
        self._rooms[roomid] = user.room
        logger.debug(f"Room created: {roomid}")

        return roomid

    def get(self, roomid: str) -> Room:
        roomid = roomid.strip().lower()
        if roomid not in self._rooms:
            raise RoomNotFoundError("Room not found")
        return self._rooms[roomid]

    async def add_user(self, roomid: str, ws: WebSocket) -> bool:
        user = ws.user_object
        roomid = roomid.strip().lower()
        if user.room:
            room = user.room
            await room._remove_user(ws)
            if room._is_empty():
                del self._rooms[room.roomid]
                logger.debug(f"Room removed: {room.roomid}")
        room = self.get(roomid)
        if user.name in room.users:
            raise UsernameInUseError("Username already exists in this room")
        await room._add_user(ws)
        user.room = room
        logger.debug(f"User added to room {roomid}: {user.name}")
        return True
    
    async def send_host(self, roomid: str, message: dict):
        room = self.get(roomid)
        await room.send_host(message)

    async def remove_user(self, ws: WebSocket):
        user = ws.user_object
        if user.room:
            room = user.room
            await room._remove_user(ws)
            if room._is_empty():
                del self._rooms[room.roomid]
                logger.debug(f"Room removed: {room.roomid}")



