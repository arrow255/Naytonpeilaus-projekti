from fastapi.testclient import TestClient
from app.main import app
import pytest

## implements only happy path testing


client = TestClient(app)
def test_creating_room():
    with client.websocket_connect("/ws") as websocket:
        websocket.send_json({
            "type": "CREATE_ROOM",
            "username": "my-name"
        })
        response = websocket.receive_json()
        assert response["type"] == "ROOM_CREATED"
        assert "roomid" in response

def test_joining_room():
    with client.websocket_connect("/ws") as websocket1:
        websocket1.send_json({
            "type": "CREATE_ROOM",
            "username": "host-name"
        })
        response1 = websocket1.receive_json()
        assert response1["type"] == "ROOM_CREATED"
        roomid = response1["roomid"]

        with client.websocket_connect("/ws") as websocket2:
            websocket2.send_json({
                "type": "JOIN_ROOM",
                "roomid": roomid,
                "username": "client-name"
            })
            response2 = websocket2.receive_json()
            assert response2["type"] == "ROOM_JOINED"
            assert response2["roomid"] == roomid

            host_notification = websocket1.receive_json()
            assert host_notification["type"] == "USER_JOINED"
            assert host_notification["username"] == "client-name"

@pytest.fixture
def create_room():
    with client.websocket_connect("/ws") as websocket:
        websocket.send_json({
            "type": "CREATE_ROOM",
            "username": "host-name"
        })
        response = websocket.receive_json()
        assert response["type"] == "ROOM_CREATED"
        roomid = response["roomid"]
        yield roomid, websocket

@pytest.fixture
def join_room(create_room):
    roomid, host_ws = create_room
    with client.websocket_connect("/ws") as client_ws:
        client_ws.send_json({
            "type": "JOIN_ROOM",
            "roomid": roomid,
            "username": "client-name"
        })
        response_client = client_ws.receive_json()
        response_host = host_ws.receive_json()
        assert response_client["type"] == "ROOM_JOINED"
        assert response_client["roomid"] == roomid
        assert response_host["type"] == "USER_JOINED"
        yield roomid, host_ws, client_ws

def test_request_sharing(join_room):
    roomid, host_ws, client_ws = join_room
    client_ws.send_json({
        "type": "REQUEST_SHARING"
    })
    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "REQUEST_SHARING"
    assert host_notification["username"] == "client-name"

def test_stop_sharing_by_host(join_room):
    roomid, host_ws, client_ws = join_room
    host_ws.send_json({
        "type": "STOP_SHARING"
    })
    client_notification = client_ws.receive_json()
    assert client_notification["type"] == "STOP_SHARING"

def test_stop_sharing_by_client(join_room):
    roomid, host_ws, client_ws = join_room
    client_ws.send_json({
        "type": "STOP_SHARING"
    })
    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "STOP_SHARING"
    assert host_notification["username"] == "client-name"

def test_allow_sharing(join_room):
    roomid, host_ws, client_ws = join_room
    host_ws.send_json({
        "type": "ALLOW_SHARING",
        "username": "client-name"
    })
    client_notification = client_ws.receive_json()
    assert client_notification["type"] == "ALLOW_SHARING"

def test_user_leaves_room(create_room):
    roomid, host_ws = create_room
    with client.websocket_connect("/ws") as client_ws:
        client_ws.send_json({
            "type": "JOIN_ROOM",
            "roomid": roomid,
            "username": "client-name"
        })
        response_client = client_ws.receive_json()
        response_host = host_ws.receive_json()
        assert response_client["type"] == "ROOM_JOINED"
        assert response_client["roomid"] == roomid
        assert response_host["type"] == "USER_JOINED"

    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "USER_LEFT"
    assert host_notification["username"] == "client-name"

def test_user_sends_rcp_offer(join_room):
    roomid, host_ws, client_ws = join_room
    client_ws.send_json({
        "type": "RCP_OFFER",
        "sdp": "sdp-data",
    })
    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "RCP_OFFER"
    assert host_notification["sdp"] == "sdp-data"
    assert host_notification["username"] == "client-name"

def test_host_sends_rcp_answer(join_room):
    roomid, host_ws, client_ws = join_room
    host_ws.send_json({
        "type": "RCP_ANSWER",
        "sdp": "sdp-data",
        "username": "client-name"
    })
    client_notification = client_ws.receive_json()
    assert client_notification["type"] == "RCP_ANSWER"
    assert client_notification["sdp"] == "sdp-data"
    assert 'username' not in client_notification

def test_user_sends_ice_candidate(join_room):
    roomid, host_ws, client_ws = join_room
    client_ws.send_json({
        "type": "ICE_CANDIDATE",
        "candidate": "candidate-data",
    })
    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "ICE_CANDIDATE"
    assert host_notification["candidate"] == "candidate-data"
    assert host_notification["username"] == "client-name"

def test_host_sends_ice_candidate(join_room):
    roomid, host_ws, client_ws = join_room
    host_ws.send_json({
        "type": "ICE_CANDIDATE",
        "candidate": "candidate-data",
        "username": "client-name"
    })
    client_notification = client_ws.receive_json()
    assert client_notification["type"] == "ICE_CANDIDATE"
    assert client_notification["candidate"] == "candidate-data"
    assert 'username' not in client_notification


