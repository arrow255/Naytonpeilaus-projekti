import { Link, useNavigate } from "react-router-dom"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext"
import { useEffect } from "react"
import { Box, VStack, Heading, Button, ButtonGroup, Center, Text, Checkbox  } from "@chakra-ui/react"


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
        <Box bg="yellow.100" minH="100vh" w="100%">
            <Box p={4} textAlign="center" bgGradient="to-b" gradientFrom="orange.200" gradientTo="yellow.100">
                <Text fontSize="5xl" fontWeight="bold">
                    Jaa näyttösi helposti!
                </Text>
            </Box>

            <Box display="flex" justifyContent="center" alignItems="center" minHeight="48vh">
                <VStack>
                    <Button colorPalette="teal" 
                            fontSize = {30}
                            px={20}
                            py={10} 
                            variant="surface"
                            onClick={createRoom}>
                        Luo huone
                    </Button>

                    <Link to="/">
                        <Button colorPalette="teal" 
                                fontSize = {30}
                                px={20}
                                py={10}  
                                variant="surface"
                                onClick={() => navigate(-1)}>
                            Takaisin
                        </Button>
                    </Link>
                </VStack>
            </Box>
        </Box>
    )
}

export default CreateRoom
