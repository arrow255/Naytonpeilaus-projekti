import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"
import { useRef } from "react"

// Components
import Screen from "../../components/Screen/Screen.jsx"

// Styling
import "./client.css"

const Client = () => {
  const RTC = useRef(null)
  const pendingCandidates = useRef([])
  const savedUsername = localStorage.getItem("username")

  const [localStream, setLocalStream] = useState(null)
  const [buttonText, setButtonText] = useState("Request Screen Share")
  const { sendMessage, messages } = useWebSocket()

  useEffect(() => {
    // Initialize RTC connection
    if (!RTC.current) {
      RTC.current = new RTCPeerConnection()

      // Setup ICE candidate handler
      RTC.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: "ICE_CANDIDATE",
            candidate: event.candidate,
          })
        }
      }
    }
  })

  useEffect(() => {
    if (messages.length < 1) return // Not yet message for reading

    // Check the message
    const last = messages[messages.length - 1]

    if (last.type == "RCP_ANSWER") {
      handleAnswer(last)
    }

    if (last.type == "ICE_CANDIDATE") {
      handleICEcandidate(last.candidate)
    }
  }, [messages])

  async function handleAnswer(answer) {
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
  }

  function sendMessageStopStreaming() {
    // Send message to host
    sendMessage({
      type: "STOP_SHARING",
      username: savedUsername,
    })

    setLocalStream(null)
    setButtonText("Request Screen Share")
  }

  function handleICEcandidate(candidate) {
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
    setButtonText("Stop Screen Share")

    // Add tracks from Local stream to peer connection
    stream.getTracks().forEach((track) => {
      RTC.current.addTrack(track, stream)
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
  }

  return (
    <>
      <h1>This is the client website for {savedUsername}</h1>
      <Link to='/'>
        <button>Back</button>
      </Link>

      <button onClick={controlVideoSharing}>{buttonText}</button>
      <Screen stream={localStream}></Screen>
    </>
  )
}

export default Client
