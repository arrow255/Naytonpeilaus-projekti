import { Link, useNavigate } from "react-router-dom"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext"
import { useEffect } from "react"

// Styling
import "./createRoom.css"


const CreateRoom = () => {
    const navigate = useNavigate()
    const {sendMessage, messages} = useWebSocket();

    const createRoom = () => {
        sendMessage({type: "CREATE_ROOM", username: 'hostname'})
    }

    useEffect(() => {
        if (messages.length < 1) return // Ei vielä viestejä käsiteltäväksi

        // Katsotaan viesti joka saapui
        const last = messages[messages.length - 1];

        if (last.type == 'ROOM_CREATED') {
            navigate(`/host/${last.roomid}`)
        } 

    }, [messages, navigate]) 

    return (
        <>
            <h1>This is the Create room site</h1>
            <button onClick={() => createRoom()}>
                Create room
            </button>

            <Link to="/">
                <button>
                    Back
                </button>
            </Link>
        </>
    )
}

export default CreateRoom