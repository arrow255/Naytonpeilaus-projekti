import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext";
import { Box, Button, Input } from "@chakra-ui/react"

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
        if (messages.length < 1) return // Not yet messages to be handled

        // Katsotaan viesti joka saapui
        const last = messages[messages.length - 1];

        if (last.type == 'ROOM_JOINED') {
            sessionStorage.setItem('username', username);
            navigate(`/room/${last.roomid}`, { state: {username} })
        } else {
            setVirheilmoitus(last.message)
        }
        
        // Silence the warning, only run this effect when new messages show up
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages])

    return (
        <>
        <Box bg="yellow.100" minH="100vh" p={4}>
            <h1>This is the Join room site</h1>

            <div id='joinRoomForm'>
                <label>Huoneen ID</label>
                <Input value={roomID} onChange={(event) => setRoomID(event.target.value)}/>

                <label>käyttäjänimi</label>
                <Input value={username} onChange={(event) => setUsername(event.target.value)}/>

                <Button colorPalette="teal" 
                        size="xl" 
                        variant="surface"
                        onClick={joinRoom}>
                    Liity huoneeseen
                </Button>
            </div>

            

            <h3>{virheilmoitus}</h3>

            <Link to="/">
                <button>
                    Back
                </button>
            </Link>
        </Box>    
        </>
    )
}

export default JoinRoom