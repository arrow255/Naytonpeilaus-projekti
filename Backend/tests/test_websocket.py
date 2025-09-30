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
                "username": "student-name"
            })
            response2 = websocket2.receive_json()
            assert response2["type"] == "ROOM_JOINED"
            assert response2["roomid"] == roomid

            host_notification = websocket1.receive_json()
            assert host_notification["type"] == "USER_JOINED"
            assert host_notification["username"] == "student-name"

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
    with client.websocket_connect("/ws") as student_ws:
        student_ws.send_json({
            "type": "JOIN_ROOM",
            "roomid": roomid,
            "username": "student-name"
        })
        response_host = host_ws.receive_json()
        response_student = student_ws.receive_json()
        assert response_student["type"] == "ROOM_JOINED"
        assert response_student["roomid"] == roomid
        assert response_host["type"] == "USER_JOINED"
        yield roomid, host_ws, student_ws

def test_request_sharing(join_room):
    roomid, host_ws, student_ws = join_room
    student_ws.send_json({
        "type": "REQUEST_SHARING"
    })
    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "REQUEST_SHARING"

def test_stop_sharing_by_host(join_room):
    roomid, host_ws, student_ws = join_room
    host_ws.send_json({
        "type": "STOP_SHARING"
    })
    student_notification = student_ws.receive_json()
    assert student_notification["type"] == "STOP_SHARING"

def test_stop_sharing_by_student(join_room):
    roomid, host_ws, student_ws = join_room
    student_ws.send_json({
        "type": "STOP_SHARING"
    })
    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "STOP_SHARING"
    assert host_notification["username"] == "student-name"

def test_allow_sharing(join_room):
    roomid, host_ws, student_ws = join_room
    host_ws.send_json({
        "type": "ALLOW_SHARING",
        "username": "student-name"
    })
    student_notification = student_ws.receive_json()
    assert student_notification["type"] == "ALLOW_SHARING"

def test_user_leaves_room(create_room):
    roomid, host_ws = create_room
    with client.websocket_connect("/ws") as student_ws:
        student_ws.send_json({
            "type": "JOIN_ROOM",
            "roomid": roomid,
            "username": "student-name"
        })
        response_student = student_ws.receive_json()
        response_host = host_ws.receive_json()
        assert response_student["type"] == "ROOM_JOINED"
        assert response_student["roomid"] == roomid
        assert response_host["type"] == "USER_JOINED"

    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "USER_LEFT"
    assert host_notification["username"] == "student-name"

def test_user_sends_rcp_offer(join_room):
    roomid, host_ws, student_ws = join_room
    student_ws.send_json({
        "type": "RCP_OFFER",
        "sdp": "sdp-data",
    })
    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "RCP_OFFER"
    assert host_notification["sdp"] == "sdp-data"
    assert host_notification["username"] == "student-name"

def test_host_sends_rcp_answer(join_room):
    roomid, host_ws, student_ws = join_room
    host_ws.send_json({
        "type": "RCP_ANSWER",
        "sdp": "sdp-data",
        "username": "student-name"
    })
    student_notification = student_ws.receive_json()
    assert student_notification["type"] == "RCP_ANSWER"
    assert student_notification["sdp"] == "sdp-data"
    assert 'username' not in student_notification

def test_user_sends_ice_candidate(join_room):
    roomid, host_ws, student_ws = join_room
    student_ws.send_json({
        "type": "ICE_CANDIDATE",
        "candidate": "candidate-data",
    })
    host_notification = host_ws.receive_json()
    assert host_notification["type"] == "ICE_CANDIDATE"
    assert host_notification["candidate"] == "candidate-data"
    assert host_notification["username"] == "student-name"

def test_host_sends_ice_candidate(join_room):
    roomid, host_ws, student_ws = join_room
    host_ws.send_json({
        "type": "ICE_CANDIDATE",
        "candidate": "candidate-data",
        "username": "student-name"
    })
    student_notification = student_ws.receive_json()
    assert student_notification["type"] == "ICE_CANDIDATE"
    assert student_notification["candidate"] == "candidate-data"
    assert 'username' not in student_notification


