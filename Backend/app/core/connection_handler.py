from fastapi import WebSocket, WebSocketDisconnect
import logging
from app.core.rooms import Room, RoomManager
from app.core.exceptions import InvalidUsernameError, RoomNotFoundError, UsernameInUseError
from app.core.user import User

logger = logging.getLogger("app")

def _check_username(username):
    if username is None:
        raise InvalidUsernameError("Username missing")
    username = username.strip()
    if not username or len(username) > 30 or not username.isprintable():
        raise InvalidUsernameError("Invalid username")
    return username
    



async def handle_connection(ws: WebSocket, user_id: str):
    ws.user_object = User("",user_id,None)
    user = ws.user_object
    await ws.accept()
    room_manager:RoomManager = ws.app.state.room_manager
    logger.info(f"WebSocket connected: {user.user_id}")
    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")
            logger.info(f"{user.user_id} :: msg: {msg_type}")
            logger.debug(f"Received data from {user.user_id}: {data}")
            if msg_type == "CREATE_ROOM":
                try:
                    username = _check_username(data.get("username"))
                    roomid = await room_manager.create_room(ws)
                    await ws.send_json({"type": "ROOM_CREATED", "roomid": roomid})
                except InvalidUsernameError as e:
                    await ws.send_json({"type": "INVALID_USERNAME", "message": str(e)})
                except RuntimeError as e:
                    await ws.send_json({"type": "ERROR", "message": str(e)})
                continue
            if msg_type == "JOIN_ROOM":
                roomid = data.get("roomid")
                if not roomid:
                    await ws.send_json({"type": "INVALID_ROOM_ID", "message": "Room ID is required"})
                    continue
                try:
                    username = _check_username(data.get("username"))
                    user.name = username
                    await room_manager.add_user(roomid, ws)
                    await ws.send_json({"type": "ROOM_JOINED", "roomid": roomid})
                    await user.room.send_host({"type": "USER_JOINED", "username": username})
                except (InvalidUsernameError, UsernameInUseError) as e:
                    await ws.send_json({"type": "INVALID_USERNAME", "message": str(e)})                
                except RoomNotFoundError as e:
                    await ws.send_json({"type": "INVALID_ROOM_ID", "message": "Room with given ID not found"})
                except RuntimeError as e:
                    await ws.send_json({"type": "ERROR", "message": str(e)})
                continue
            ## Handle messages that requires the user to be in a room
            if not user.room:
                await ws.send_json({"type": "ERROR", "message": "You must join a room first"})
                continue
            if msg_type == "LEAVE_ROOM":
                await room_manager.remove_user(ws)
                await ws.send_json({"type": "LEFT_ROOM"})
            elif msg_type == "REQUEST_SHARING":
                await user.room.send_host({"type": "REQUEST_SHARING", "username": user.name})
            elif msg_type == "STOP_SHARING":
                if user.room.host == ws:
                    target_user = data.get("username")
                    if target_user in user.room.users:
                        await user.room.users[target_user].send_json({"type": "STOP_SHARING"})
                    else:
                        await ws.send_json({"type": "ERROR", "message": "User not found"})
                else:
                    await user.room.send_host({"type": "STOP_SHARING", "username": user.name})
            elif msg_type == "ALLOW_SHARING":
                target_user = data.get("username")
                if target_user in user.room.users:
                    await user.room.users[target_user].send_json({"type": "ALLOW_SHARING"})
                else:
                    await ws.send_json({"type": "ERROR", "message": "User not found"})
            elif msg_type == "RCP_OFFER":
                sdp_data = data.get("sdp")
                await user.room.send_host({"type": "RCP_OFFER", "sdp": sdp_data, "username": user.name})
            elif msg_type == "RCP_ANSWER":
                target_user = data.get("username")
                if target_user in user.room.users:
                    sdp_data = data.get("sdp")
                    await user.room.users[target_user].send_json({"type": "RCP_ANSWER", "sdp": sdp_data})
                else:
                    await ws.send_json({"type": "ERROR", "message": "User not found"})
            elif msg_type == "ICE_CANDIDATE":
                if ws == user.room.host:
                    target_user = data.get("username")
                    if target_user in user.room.users:
                        candidate_data = data.get("candidate")
                        logger.debug(f"Sending ICE_CANDIDATE to host: {candidate_data}")
                        await user.room.users[target_user].send_json({"type": "ICE_CANDIDATE", "candidate": candidate_data})
                    else:
                        await ws.send_json({"type": "ERROR", "message": "User not found"})
                else:
                    candidate_data = data.get("candidate")
                    logger.debug(f"Sending ICE_CANDIDATE to {user.name}: {candidate_data}")
                    await user.room.send_host({"type": "ICE_CANDIDATE", "candidate": candidate_data, "username": user.name})
            else:
                logger.debug(f"Unknown message type: {msg_type}")
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {user.user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await room_manager.remove_user(ws)

