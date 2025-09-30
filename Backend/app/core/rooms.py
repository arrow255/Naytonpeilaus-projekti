from fastapi import WebSocket, WebSocketDisconnect
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
    async def broadcast(self, message: dict):
        for user in self.users.values():
            logger.debug(f"Sending to user: {user.name} | message: {message}")
            await user.send_json(message)
    async def send_host(self, message: dict):
        if self.host:
            logger.debug(f"Sending to host: {message}")
            await self.host.send_json(message)

class RoomManager:
    def __init__(self):
        self._rooms = {}

    def create_room(self, host: WebSocket) -> Room:
        roomid = _generate_room_id()
        ## Handle minimal chance of collision in room names
        while roomid in self._rooms:
            roomid = _generate_room_id()
        room = Room(roomid, host)
        self._rooms[roomid] = room
        logger.debug(f"Room created: {roomid}")
        return room

    def get(self, roomid: str) -> Room:
        roomid = roomid.strip().lower()
        if roomid not in self._rooms:
            raise RuntimeError("Room not found")
        return self._rooms[roomid]

    def add_user(self, roomid: str, user: WebSocket) -> bool:
        roomid = roomid.strip().lower()
        room = self.get(roomid)
        if user.name in room.users:
            raise RuntimeError("Username already exists in this room")
        room.users[user.name] = user
        logger.debug(f"User added to room {roomid}: {user.name}")
        return True
    async def send_host(self, roomid: str, message: dict):
        room = self.get(roomid)
        await room.send_host(message)

    async def remove_user(self, roomid: str, user: WebSocket):
        room = self.get(roomid)
        if user == room.host:
            room.host = None
            logger.debug(f"Host removed from room {roomid}")
            if not room.users:
                del self._rooms[roomid]
                logger.debug(f"Room removed: {roomid}")
            return
        if user.name in room.users:
            logger.debug(f"User removed from room {roomid}: {user.name}")
            del room.users[user.name]
            if not room.users and not room.host:
                del self._rooms[roomid]
                logger.debug(f"Room removed: {roomid}")
            elif room.host and room.host != user:
                await room.host.send_json({"type": "USER_LEFT", "username": user.name})

async def handle_connection(ws: WebSocket, user_id: str):
    ws.user_id = user_id
    await ws.accept()
    room_manager = ws.app.state.room_manager
    room = None
    logger.debug(f"WebSocket connected: {ws.user_id}")
    try:
        while True:
            data = await ws.receive_json()
            logger.debug(f"Received data from {ws.user_id}: {data}")
            msg_type = data.get("type")
            if msg_type == "CREATE_ROOM":
                username = data.get("username").strip().lower()
                if not username:
                    await ws.send_json({"type": "INVALID_USERNAME", "message": "Username is required"})
                    continue
                try:
                    if room:
                        await room_manager.remove_user(room.roomid, ws)
                    room = room_manager.create_room(ws)
                    await ws.send_json({"type": "ROOM_CREATED", "roomid": room.roomid})
                except RuntimeError as e:
                    await ws.send_json({"type": "ERROR", "message": str(e)})
                continue
            if msg_type == "JOIN_ROOM":
                roomid = data.get("roomid")
                if not roomid:
                    await ws.send_json({"type": "INVALID_ROOM_ID", "message": "Room ID is required"})
                    continue
                try:
                    if room:
                        await room_manager.remove_user(room.roomid, ws)
                        room = None
                    username = data.get("username").strip().lower()
                    if not username:
                        await ws.send_json({"type": "INVALID_USERNAME", "message": "Username is required"})
                        continue
                    ws.name = username
                    room_manager.add_user(roomid, ws)
                    room = room_manager.get(roomid)
                    await ws.send_json({"type": "ROOM_JOINED", "roomid": roomid})
                    await room.send_host({"type": "USER_JOINED", "username": username})
                except RuntimeError as e:
                    # TODO: improve this logic. Currently the function throws RuntimeError on username collision
                    # but this is bad logic
                    await ws.send_json({"type": "INVALID_USERNAME", "message": str(e)})
                continue
            ## Handle messages that requires the user to be in a room
            if not room:
                await ws.send_json({"type": "ERROR", "message": "You must join a room first"})
                continue
            if msg_type == "REQUEST_SHARING":
                await room.send_host({"type": "REQUEST_SHARING", "username": ws.name})
            elif msg_type == "STOP_SHARING":
                if room.host == ws:
                    await room.broadcast({"type": "STOP_SHARING"})
                else:
                    await room.send_host({"type": "STOP_SHARING", "username": ws.name})
            elif msg_type == "ALLOW_SHARING":
                target_user = data.get("username")
                if target_user in room.users:
                    await room.users[target_user].send_json({"type": "ALLOW_SHARING"})
                else:
                    await ws.send_json({"type": "ERROR", "message": "User not found"})
            elif msg_type == "RCP_OFFER":
                sdp_data = data.get("sdp")
                await room.send_host({"type": "RCP_OFFER", "sdp": sdp_data, "username": ws.name})
            elif msg_type == "RCP_ANSWER":
                target_user = data.get("username")
                if target_user in room.users:
                    sdp_data = data.get("sdp")
                    await room.users[target_user].send_json({"type": "RCP_ANSWER", "sdp": sdp_data})
                else:
                    await ws.send_json({"type": "ERROR", "message": "User not found"})
            elif msg_type == "ICE_CANDIDATE":
                if ws == room.host:
                    target_user = data.get("username")
                    if target_user in room.users:
                        candidate_data = data.get("candidate")
                        await room.users[target_user].send_json({"type": "ICE_CANDIDATE", "candidate": candidate_data})
                    else:
                        await ws.send_json({"type": "ERROR", "message": "User not found"})
                else:
                    candidate_data = data.get("candidate")
                    await room.send_host({"type": "ICE_CANDIDATE", "candidate": candidate_data, "username": ws.name})
            else:
                logger.debug(f"Unknown message type: {msg_type}")
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {ws.user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if room:
            await room_manager.remove_user(room.roomid, ws)


