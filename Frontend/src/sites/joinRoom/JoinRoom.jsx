import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext";
import { Box, Button, Input } from "@chakra-ui/react"
import { useTranslation } from 'react-i18next';



// Styling
import "./joinRoom.css"


const JoinRoom = () => {
    const { t } = useTranslation();
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
        const savedUsername = sessionStorage.getItem('username')
        if (savedUsername) setUsername(savedUsername)
    }, [])

    useEffect(() => {
        if (messages.length < 1) return // Ei vielä viestejä käsiteltäväksi

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
            <div id='joinRoomForm'>
                <label>{t('roomID')}</label>
                <Input value={roomID} onChange={(event) => setRoomID(event.target.value)}/>

                <label>{t('username')}</label>
                <Input value={username} onChange={(event) => setUsername(event.target.value)}/>

                <Button colorPalette="teal" 
                        size="xl" 
                        variant="surface"
                        onClick={joinRoom}>
                    {t('joinRoom')}
                </Button>
            </div>

            

            <h3>{virheilmoitus}</h3>

            <Link to="/">
                <button>
                    {t('back')}
                </button>
            </Link>
        </Box>    
        </>
    )
}

export default JoinRoom