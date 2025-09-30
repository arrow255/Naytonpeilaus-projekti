# Installing the dependencies
```bash
python -m venv venv
source venv/bin/activate  # On windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

# Running the server in development mode
```bash
source venv/bin/activate
fastapi dev
```

# Running tests
```bash
source venv/bin/activate
pip install -r requirements_test.txt
pytest
```

# Documentation
Currently, only supports websocket endpoint on ws://localhost:8000/ws

The 'client-name' in documentation is referring to the user who wants to share screen. Host name does not matter and user does not need to know it.
Host name should be made known to the user only if we want to display it in the UI.

## Currently implemented messages

### Errors
Server might respond with error message if something goes wrong or is not yet implemented:
```json
{
  "type": "ERROR",
  "message": "Description of the error"
}
```

If username is already in use in the room or is invalid:
```json
{
  "type": "INVALID_USERNAME",
  "message": "Description of the error"
}
```

If room is not found:
```json
{
  "type": "INVALID_ROOM_ID",
  "message": "Description of the error"
}
```


### Create Room
Client sends:
```json
{
  "type": "CREATE_ROOM",
  "username": "host-name"
}
```
Server responds:
```json
{
  "type": "ROOM_CREATED",
  "roomid": "room-id"
}
```

### Join Room
Client sends:
```json
{
  "type": "JOIN_ROOM",
  "roomid": "room-id",
  "username": "client-name"
}
```
Server responds:
```json
{
  "type": "ROOM_JOINED",
  "roomid": "room-id"
}
```
Server notifies host:
```json
{
  "type": "USER_JOINED",
  "username": "client-name"
}
```

### Request Sharing
Client sends:
```json
{
  "type": "REQUEST_SHARING"
}
```
Server forwards the request to host:
```json
{
  "type": "REQUEST_SHARING",
  "username": "client-name"
}
```

### Stop Sharing
Client sends:
```json
{
  "type": "STOP_SHARING"
}
```
Currently, if sender is the host, server broadcasts to all users:
```json
{
  "type": "STOP_SHARING"
}
```
In the future this will most likely be changed to only notify the user who was sharing.
Don't rely on this behavior.

If sender is not the host, server forwards the request to host:
```json
{
  "type": "STOP_SHARING",
  "username": "client-name"
}
```

### Allow Sharing
Host sends:
```json
{
  "type": "ALLOW_SHARING",
  "username": "client-name"
}
```
Server forwards the request to the user:
```json
{
  "type": "ALLOW_SHARING"
}
```

### RCP Messages

Client sends:
```json
{
  "type": "RCP_OFFER",
  "sdp": "offer data"
}
```

Server forwards the request to host:
```json
{
  "type": "RCP_OFFER",
  "username": "client-name",
  "sdp": "offer data"
}
```

Host sends:
```json
{
  "type": "RCP_ANSWER",
  "username": "client-name",
  "sdp": "answer data"
}
```

Server forwards the request to the user:
```json
{
  "type": "RCP_ANSWER",
  "sdp": "answer data"
}
```

### ICE Candidate Messages
Client sends:
```json
{
  "type": "ICE_CANDIDATE",
  "candidate": "candidate data",
}
```

Server forwards the request to host:
```json
{
  "type": "ICE_CANDIDATE",
  "username": "client-name",
  "candidate": "candidate data"
}
```

Host sends:
```json
{
  "type": "ICE_CANDIDATE",
  "username": "client-name",
  "candidate": "candidate data"
}
```

Server forwards the request to the user:
```json
{ 
  "type": "ICE_CANDIDATE",
  "candidate": "candidate data"
}
```
