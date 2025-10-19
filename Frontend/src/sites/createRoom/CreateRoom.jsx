import { Link, useNavigate } from "react-router-dom"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext"
import { useEffect } from "react"
import { Box, VStack, Heading, Button, ButtonGroup } from "@chakra-ui/react"


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
        <Box bg="yellow.100" minH="100vh" w="100%" p={4}>
            <h1>This is the Create room site</h1>
            <Button colorPalette="teal" 
                    size="xl" 
                    variant="surface"
                    onClick={createRoom}>
                Luo huone
            </Button>

            <Link to="/">
                <Button colorPalette="teal" 
                        size="xl" 
                        variant="surface"
                        onClick={() => navigate(-1)}>
                    Takaisin
                </Button>
            </Link>
        </Box>
    )
}

export default CreateRoom