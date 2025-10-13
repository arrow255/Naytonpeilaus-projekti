import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext";

// Styling
import "./joinRoom.css"


const JoinRoom = () => {
    const navigate = useNavigate()
    const [roomID, setRoomID] = useState('')
    const [username, setUsername] = useState('')
    const {sendMessage, messages} = useWebSocket();
    const [virheilmoitus, setVirheilmoitus] = useState(null) 


    const joinRoom = async () => {
        sendMessage({type: "JOIN_ROOM", roomid: roomID, username: username})
    }

    useEffect(() => {
        // Run with initial render only
        const savedUsername = localStorage.getItem('username')
        if (savedUsername) setUsername(savedUsername)
    }, [])

    useEffect(() => {
        if (messages.length < 1) return // Ei vielä viestejä käsiteltäväksi

        // Katsotaan viesti joka saapui
        const last = messages[messages.length - 1];

        if (last.type == 'ROOM_JOINED') {
            localStorage.setItem('username', username);
            navigate(`/room/${last.roomid}`, { state: {username} })
        } else {
            setVirheilmoitus(last.message)
        }
        
        // Silence the warning, only run this effect when new messages show up
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages])


    return (
        <>
            <h1>This is the Join room site</h1>

            <div id='joinRoomForm'>
                <label>room id</label>
                <input value={roomID} onChange={(event) => setRoomID(event.target.value)}/>

                <label>username</label>
                <input value={username} onChange={(event) => setUsername(event.target.value)}/>

                <button onClick={() => joinRoom()}>
                    Join Room
                </button>
            </div>

            <h3>{virheilmoitus}</h3>

            <Link to="/">
                <button>
                    Back
                </button>
            </Link>

        </>
    )
}

export default JoinRoom