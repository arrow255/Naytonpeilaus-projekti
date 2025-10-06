import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"
import { useMemo } from "react"

// Components
import Screen from "../../components/Screen/Screen.jsx"

// Styling
import "./client.css"

// Probably not necessary, CLIENT might send ICE after offer
const pendingCandidates = [];


const Client = () => {
  const RTC = useMemo(() => new RTCPeerConnection(), [])

  const [localStream, setLocalStream] = useState(null)
  const [buttonText, setButtonText] = useState("Request Screen Share")
  const { sendMessage, messages } = useWebSocket()


  useEffect(() => {
    // Start sending ICE candidates as we start the app
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
    if (messages.length < 1) return // Not yet message for reading

    // Check the message
    const last = messages[messages.length - 1]

    if (last.type == "RCP_ANSWER") {
      async function handleAnswer() {
        const receivedOffer = new RTCSessionDescription({type: "answer", sdp: last.sdp,})

        await RTC.setRemoteDescription(receivedOffer)

        // Apply any ICE candidates received before the remote description
        pendingCandidates.forEach((c) => RTC.addIceCandidate(new RTCIceCandidate(c)));
        pendingCandidates.length = 0;
      }

      handleAnswer()
    }

    if (last.type == "ICE_CANDIDATE") {
      if (RTC.remoteDescription && RTC.remoteDescription.type) {
        RTC.addIceCandidate(new RTCIceCandidate(last.candidate))
      } else {
        // Buffer the candidate until remote description is set
        pendingCandidates.push(last.candidate);
      }

    }

  }, [messages, RTC, sendMessage])

  const controlVideoSharing = async () => {
    // User wants to stop the stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      setLocalStream(null)
      setButtonText("Request Screen Share")
      return
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })

    // Init the ICE candidate event
    RTC.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: "ICE_CANDIDATE",
          candidate: event.candidate,
        })
      }
    }


    // Push tracks from Local stream to peer connection
    stream.getTracks().forEach((track) => {
      RTC.addTrack(track, stream)
    })


    // Create Offer
    const offerDescription = await RTC.createOffer()
    await RTC.setLocalDescription(offerDescription)

    const offer = {
      type: "RCP_OFFER",
      sdp: offerDescription.sdp,
    }


    // Update screen
    setLocalStream(stream)
    setButtonText("Stop Screen Share")

    // Send offer to other party
    sendMessage(offer)


    // Checks if the stream is stopped by other means
    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        setLocalStream(null)
        setButtonText("Request Screen Share")
      }
    })

    console.log("Got local stream:", stream)
    console.log("React State Stream:", localStream)
  }

  return (
    <>
      <h1>This is the client website</h1>
      <Link to='/'>
        <button>Back</button>
      </Link>

      <button onClick={controlVideoSharing}>{buttonText}</button>
      <Screen stream={localStream}></Screen>
    </>
  )
}

export default Client
