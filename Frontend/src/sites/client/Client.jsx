import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"
import { useRef } from "react"
import config from "@/components/servers.js"
import { Box, VStack, Button } from "@chakra-ui/react"
import { useTranslation } from 'react-i18next';

// Components
import Screen from "../../components/Screen/Screen.jsx"


const InfoBox = ({ connectionState }) => {
  const messages = {
    idle: "Waiting for stream to start...",
    waiting: "Waiting for host to accept...",
    connected: "You are currently streaming!",
    ended: "Connection ended or failed",
  }

  const text = messages[connectionState] ?? "Unknown state"

  return (
    <div
      style={{
        backgroundColor: "teal",
        color: "white",
        padding: "1rem",
        borderRadius: "8px",
      }}
    >
      <p>
        <b>Debug laatikko:</b>
      </p>
      <h3>{text}</h3>
    </div>
  )
}

const Client = () => {
  const { t } = useTranslation();
  const RTC = useRef(null)
  const pendingCandidates = useRef([])
  const navigate = useNavigate()

  const savedUsername = useRef(sessionStorage.getItem("username"))

  // WebRTC
  const [localStream, setLocalStream] = useState(null)
  const { sendMessage, messages, clearMessages } = useWebSocket()

  // UI changes
  const [buttonText, setButtonText] = useState(t('startSharing'));

  // Track connection status
  const [connectionStatus, setConnectionStatus] = useState("idle")

  useEffect(() => {
    // Initialize RTC connection
    if (!RTC.current) {
      RTC.current = new RTCPeerConnection(config)

      // Setup ICE candidate handler
      RTC.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: "ICE_CANDIDATE",
            candidate: event.candidate,
          })
        }
      }

      // If connection fails, change the connection state
      RTC.current.onconnectionstatechange = () => {
        if (
          ["disconnected", "failed", "closed"].includes(
            RTC.current.connectionState
          )
        ) {
          setConnectionStatus("ended")
          setLocalStream(null)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lastMessage = useRef(0)
  useEffect(() => {
    
    // Check the message
    for (let i = lastMessage.current; i < messages.length; ++i) {
      const message = messages[i]
      console.debug(message)

      if (message.type == "RCP_ANSWER") {
        handleAnswer(message)
      }

      if (message.type == "ICE_CANDIDATE") {
        handleICEcandidate(message.candidate)
      }

      if (message.type == "STOP_SHARING") {
        stopStream()
      }

      if (message.type == "LEFT_ROOM") {
        clearMessages()
        navigate('/')
      }
    }
    lastMessage.current = messages.length

    // We want this to run only when we get messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const stopStream = () => {
    // Stops the stream
    if (localStream) localStream.getTracks().forEach((track) => track.stop())

    setConnectionStatus("ended")
    setButtonText(t('startSharing'))
    setLocalStream(null)
  }

  const handleAnswer = async (answer) => {
    const receivedOffer = new RTCSessionDescription({
      type: "answer",
      sdp: answer.sdp,
    })

    await RTC.current.setRemoteDescription(receivedOffer)

    // Apply any ICE candidates received before the remote description
    for (const candidate of pendingCandidates.current) {
      await RTC.current.addIceCandidate(new RTCIceCandidate(candidate))
    }
    pendingCandidates.current = []

    // We are now connected to the host
    setConnectionStatus("connected")
  }

  const sendMessageStopStreaming = () => {
    // Send message to host
    sendMessage({
      type: "STOP_SHARING",
      username: savedUsername.current,
    })

    stopStream()
  }

  const leaveRoom = () => {
    // Send message to host about leaving the room
    sendMessage({
      type: "LEAVE_ROOM",
      username: savedUsername.current,
    })
  }

  const handleICEcandidate = (candidate) => {
    /*
      Handles incoming ice candidates by either
        - Add them to relevant RTC
        - Buffer them until remote description is set
    */

    if (RTC.current.remoteDescription) {
      // Add the candidate to RTC
      RTC.current.addIceCandidate(new RTCIceCandidate(candidate))
    } else {
      // Buffer the candidate until remote description is set
      pendingCandidates.current.push(candidate)
    }
  }

  const controlVideoSharing = async () => {
    // User wants to stop the stream
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop()

        // Remove track from peer connection
        const senders = RTC.current.getSenders()
        const sender = senders.find((s) => s.track === track)
        if (sender) {
          RTC.current.removeTrack(sender)
        }
      })

      sendMessageStopStreaming()
      return
    }

    // TODO try catch if user refuses to choose screen
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })

    // Set the local stream so user sees his stream
    setLocalStream(stream)
    setButtonText(t('stopSharing'))
    setConnectionStatus("waiting")

    // Add tracks from Local stream to peer connection
    stream.getTracks().forEach((track) => {
      RTC.current.addTrack(track, stream)
    })

    // Handle stream ending (user stops sharing via browser UI)
    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        // Remove all tracks from peer connection
        const senders = RTC.current.getSenders()
        senders.forEach((sender) => {
          if (sender.track) {
            RTC.current.removeTrack(sender)
          }
        })
        sendMessageStopStreaming()
      }
    })

    // Create Offer and send offer
    const offerDescription = await RTC.current.createOffer()
    await RTC.current.setLocalDescription(offerDescription)

    const offer = {
      type: "RCP_OFFER",
      sdp: offerDescription.sdp,
    }

    // Send offer to other party
    sendMessage(offer)
  }

  return (
    <Box display='flex' minH='100vh'>
      { /* Current stream screen */}
      <Box flex='1' bg='yellow.100' p={4}>
        <Screen stream={localStream}></Screen>
      </Box>

      {/* Sidebar */}
      <Box
        width='200px'
        bg='green.200'
        p={4}
        display='flex'
        flexDirection='column'
        height='100vh'
      >
        {/* Button for different actions */}
        <VStack spacing={2} align='stretch' flex='1' overflowY='auto'>
          <Box>{t('greeting')} {savedUsername.current}!</Box>
          <Link to='/'>
            <Button colorPalette="teal" 
                    size="xl" 
                    variant="surface" onClick={leaveRoom}>
                {t('exitRoom')}
            </Button>
          </Link>
          <Button
            colorPalette='teal'
            size='xl'
            variant='surface'
            onClick={controlVideoSharing}
          >
            {buttonText}
          </Button>
          <InfoBox connectionState={connectionStatus}></InfoBox>
        </VStack>
      </Box>
    </Box>
  )
}

export default Client
