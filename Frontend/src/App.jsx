// src/App.jsx
import { PinInput, Input, Box, VStack, Button, Text, Flex, Separator, Alert, CloseButton } from "@chakra-ui/react"
import { useWebSocket } from "./components/WebSocketContext/WebSocketContext"
import { useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import i18n from "./i18n"


function App() {
  const [show, setShow] = useState(true);
  const [pin, setPin] = useState("")
  const [username, setUsername] = useState("")
  const [errorMessage, setErrorMessage] = useState(null)
  const navigate = useNavigate()

  const {sendMessage, messages} = useWebSocket()
  const { t } = useTranslation()

  // Process messages from the server
  const lastMessage = useRef(0)
  useEffect(() => {
      // Check the message
      for (let i = lastMessage.current; i < messages.length; ++i) {
        const message = messages[i]
        console.debug(message)

        if (message.type == 'ROOM_JOINED') {
            sessionStorage.setItem('username', username)
            navigate(`/room/${message.roomid}`, { state: {username} })
            return
        }

        if (message.type == 'ROOM_CREATED') {
            navigate(`/host/${message.roomid}`)
            return
        }

        else { handleErrors(message) }

      }
      lastMessage.current = messages.length
  
    // We want this to run only when we get messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages])

  const handleErrors = (error) => {
    if (error.type == 'Improper input') {
      if (error.message == 'Pin length must be 4') {
        setErrorMessage(t('pinError'))
        return
      }       

      if (error.message == 'Username not long enough') {
        setErrorMessage(t('usernameTooShortError'))
        return
      }
    }

    if (error.type == 'INVALID_USERNAME') { 
      if (error.message == 'Username already exists in this room') {
        setErrorMessage(t('usernameAlreadyExists'))
        return
      }
    }

    if (error.type == 'INVALID_ROOM_ID') { 
      if (error.message == 'Room with given ID not found') {
        setErrorMessage(t('roomDoesntExists'))
        return
      }
    }

    setErrorMessage("Tapahtui ennaltaodottamaton error")

  }

  const changeLang = (lang) => {
    setErrorMessage(null)
    i18n.changeLanguage(lang)
  }

  const joinRoom = async () => {
    setErrorMessage(null)

    if (pin.valueAsString.length != 4) {
      handleErrors({'type': 'Improper input', 'message': 'Pin length must be 4'})
      return
    }

    if (username.length < 3) {
      handleErrors({'type': 'Improper input', 'message': 'Username not long enough'})
      return
    }

    sendMessage({type: "JOIN_ROOM", roomid: pin.valueAsString, username: username})
  }

  const createRoom = () => {
    sendMessage({type: "CREATE_ROOM", username: 'hostname'})
  }


  return (
    <Box bg="yellow.100" minH="100vh" w="100%">
      {/* banner */}
       <Box p={4} bgGradient="to-b" gradientFrom="orange.200" gradientTo="yellow.100" position="relative">
        <Text fontSize="5xl" fontWeight="bold" textAlign="center">
          {t('welcomeBanner')}
        </Text>
        <Flex position="absolute" top="50%" right="1rem" transform="translateY(-50%)">
          <Button colorPalette="teal" onClick={() => changeLang('fi')} mr={2}>FI</Button>
          <Button colorPalette="teal" onClick={() => changeLang('en')}>EN</Button>
        </Flex>
      </Box>
        

      <Box display="flex" justifyContent="center" alignItems="center" minHeight="48vh">
        
        
        
        
        <VStack spacing={7} align="center">
          {/* pin koodi paikka */}
          <Box width="100%" padding="4" color="black" fontSize="2xl">
            {t('instructions')}:
          </Box>
          
           
          <PinInput.Root type="alphanumeric" onValueChange={(value) => setPin(value)} placeholder="" >
            <PinInput.HiddenInput />
            <PinInput.Control>
              <PinInput.Input index={0} w="80px" h="80px" fontSize="3xl" borderWidth="2px" borderColor="black" />
              <Box padding="2"></Box>
              <PinInput.Input index={1} w="80px" h="80px" fontSize="3xl" borderWidth="2px" borderColor="black"/>
              <Box padding="2"></Box>
              <PinInput.Input index={2} w="80px" h="80px" fontSize="3xl" borderWidth="2px" borderColor="black"/>
              <Box padding="2"></Box>
              <PinInput.Input index={3} w="80px" h="80px" fontSize="3xl" borderWidth="2px" borderColor="black"/>
            </PinInput.Control>
          </PinInput.Root>
          <Box padding="2"></Box>
          
          <Input
            placeholder={t('usernameInputPlaceholder')}
            width={400}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            bg="transparent"
            color="black"
            _placeholder={{ color: "black" }}
            border="1.3px solid black"
          />


          <Box padding="4" color="black" fontSize="xl" justifyContent="center" alignItems="center"></Box>
          
          <Button 
            onClick={joinRoom}
            colorPalette="teal"
            fontSize = {20}
            px={10}
            py={8}
            variant="surface"
            >
              {t('signIn')}
          </Button>

          {errorMessage && 
            <Box width="100%" padding="4" color="red" fontSize="xl" textAlign="center">
              {errorMessage}
            </Box> 
          }

          <Flex align="center" width="100%" gap={3} marginTop={"25px"}>
            <Separator borderColor="black" borderWidth="1px" flex="1" />
            <Text fontSize="3xl" flexShrink={0}>{t('createRoomInstructions')}</Text>
            <Separator borderColor="black" borderWidth="1px" flex="1"/>
          </Flex>


          <Button 
            onClick={createRoom}
            colorPalette="teal" 
            variant="surface"
            fontSize = {20}
            px={10}
            py={8}
            > 
              {t('createRoom')}   
          </Button>
        </VStack>
          {/* privacy notice */}
        {show && (  
          <Box position="fixed" bottom="0" left="0" w="100%" zIndex={1000}>
            <Alert.Root status="info" borderRadius="0">
              <Alert.Indicator />
              <Alert.Title>
                {t('privacyNotice')}
              </Alert.Title>
              <CloseButton position="absolute" top="8px" right="8px" onClick={() => setShow(false)} />
            </Alert.Root>
          </Box>
        )}

      </Box>
    </Box>
  )
}

export default App
