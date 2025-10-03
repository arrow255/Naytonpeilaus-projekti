from fastapi import WebSocket
import logging
import random
import string

logger = logging.getLogger("app")

alphanumerics = string.ascii_lowercase + string.digits
def _generate_room_id() -> str:
    return ''.join(random.choices(alphanumerics, k=4))

class Room:
    def __init__(self, roomid: str, host: WebSocket):
        self.roomid = roomid
        self.users = {}
        self.host = host
    async def remove_user(self, user: WebSocket):
        if user == self.host:
            self.host = None
            logger.debug(f"Host removed from room {self.roomid}")
            return
        if user in self.users:
            logger.debug(f"User removed from room {self.roomid}: {user.user_object.name}")
            del self.users[user.name]
            if self.host and self.host != user:
                await self.host.send_json({"type": "USER_LEFT", "username": user.user_object.name})        

    async def broadcast(self, message: dict):
        for user in self.users.values():
            logger.debug(f"Sending to user: {user.name} | message: {message}")
            await user.send_json(message)
    async def send_host(self, message: dict):
        if self.host:
            logger.debug(f"Sending to host: {message}")
            await self.host.send_json(message)
    
    async def add_user(self, user: WebSocket):
        self.users[user] = user


class RoomManager:
    def __init__(self):
        self._rooms = {}

    async def create_room(self, host: WebSocket) -> Room:
        user = host.user_object
        if user.room:
            await user.room.remove_user(host)
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
            raise RuntimeError("Room not found")
        return self._rooms[roomid]

    async def add_user(self, roomid: str, user: WebSocket) -> bool:
        roomid = roomid.strip().lower()
        room = self.get(roomid)
        for u in room.users:
            if u.user_object.name == user.user_object.name:
                raise RuntimeError("Username already exists in this room")
        await room.add_user(user)
        user.room = room
        logger.debug(f"User added to room {roomid}: {user.name}")
        return True
    
    async def send_host(self, roomid: str, message: dict):
        room = self.get(roomid)
        await room.send_host(message)

    async def remove_user(self, roomid: str, user: WebSocket):
        room = self.get(roomid)
        await room.remove_user(user)
        if not room.users and not room.host:
            del self._rooms[self.roomid]
            logger.debug(f"Room removed: {self.roomid}")





