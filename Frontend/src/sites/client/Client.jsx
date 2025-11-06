import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"
import { useRef } from "react"
import config from "@/components/servers.js"
import { Box, VStack, Text, Button, Heading } from "@chakra-ui/react"

// Components
import Screen from "../../components/Screen/Screen.jsx"

// Styling
import "./client.css"

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
  const RTC = useRef(null)
  const pendingCandidates = useRef([])

  // TODO: Better way to pass username, dont rely on localStorage
  const savedUsername = sessionStorage.getItem("username")

  // WebRTC
  const [localStream, setLocalStream] = useState(null)
  const { sendMessage, messages } = useWebSocket()

  // UI changes
  const [buttonText, setButtonText] = useState("Aloita jakaminen")

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
  })

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
    }
    lastMessage.current = messages.length

    // We want this to run only when we get messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const stopStream = () => {
    // Stops the stream
    if (localStream) localStream.getTracks().forEach((track) => track.stop())

    setConnectionStatus("ended")
    setButtonText("Aloita jakaminen")
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
      username: savedUsername,
    })

    stopStream()
  }

  const handleICEcandidate = (candidate) => {
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

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })

    // Set the local stream so user sees his stream
    setLocalStream(stream)
    setButtonText("Lopeta näytön jakaminen")
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
          <Link to='/'>
            <Button colorPalette='teal' size='xl' variant='surface'>
              Poistu huoneesta
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
