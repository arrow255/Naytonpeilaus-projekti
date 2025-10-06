import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"
import servers from "../../components/utils.js"

// Components
import Screen from "../../components/Screen/Screen.jsx"

// Styling
import "./client.css"


const Client = () => {
  const [RTC, _] = useState(new RTCPeerConnection(servers))
  const [localStream, setLocalStream] = useState(null)
  const [buttonText, setButtonText] = useState("Request Screen Share")
  const { sendMessage, messages } = useWebSocket()

  useEffect(() => {
    // Ajetaan sovellukseen tultaessa
    RTC.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: "ICE_CANDIDATE",
          candidate: event.candidate,
        })
      }
    }
  })

  useEffect(() => {
    if (messages.length < 1) return // Ei vielä viestejä käsiteltäväksi

    // Katsotaan viesti joka saapui
    const last = messages[messages.length - 1]

    if (last.type == "RCP_ANSWER") {
      async function handleAnswer() {
        const receivedOffer = new RTCSessionDescription({
          type: "answer",
          sdp: last.sdp,
        })
        await RTC.setRemoteDescription(receivedOffer)
      }
      handleAnswer()
    }

    if (last.type == "ICE_CANDIDATE") {
      RTC.addIceCandidate(new RTCIceCandidate(last.candidate))
    }

  }, [messages])

  const handleOffers = async () => {
    const offerDescription = await RTC.createOffer()
    await RTC.setLocalDescription(offerDescription)

    const offer = {
      type: "RCP_OFFER",
      sdp: offerDescription.sdp,
    }

    sendMessage(offer)
  }

  const controlVideoSharing = async () => {
    // User wants to stop the stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      setLocalStream(null)
      setButtonText("Request Screen Share")
      return
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })

    // Checks if the stream is stopped by other means
    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        setLocalStream(null)
        setButtonText("Request Screen Share")
      }
    })

    // Push tracks from Local stream to peer connection
    setLocalStream(stream)
    setButtonText("Stop Screen Share")

    stream.getTracks().forEach((track) => {
      RTC.addTrack(track, stream)
    })
  }

  return (
    <>
      <h1>This is the client website</h1>
      <Link to='/'>
        <button>Back</button>
      </Link>

      <button onClick={controlVideoSharing}>{buttonText}</button>
      <button onClick={handleOffers}>Handle offer</button>
      <Screen stream={localStream}></Screen>
    </>
  )
}

export default Client
