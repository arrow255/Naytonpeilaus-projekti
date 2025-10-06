import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"
import handleRCPOffer from "./handle_messages.js"

// Components
import Screen from "../../components/Screen/Screen.jsx"
import { Link } from "react-router-dom"
import { useMemo } from "react"

// Styling
import "./host.css"

const buttonText = (remoteStream) => {
  if (remoteStream) {
    return "Hide stream"
  }
  return "Show Stream"
}

const renderUser = (user) => {
  if (!user.wantsToStream) { return <div><p key={user.username}>{user.username}</p></div> }
  return (
    <div>
      <p key={user.username}>{user.username}</p>
      <button>Accept</button>
      <button>Decline</button>
    </div>
  )
}

const Host = () => {
  const RTC = useMemo(() => new RTCPeerConnection(), [])

  const [remoteStream, setRemoteStream] = useState(null)
  const { sendMessage, messages } = useWebSocket()

  const [users, setUsers] = useState([])
  // const [streamingUser, setStreamingUser] = useState(null)
  const { roomID } = useParams()

  useEffect(() => {
    // Ajetaan kun striimaava käyttäjä vaihtuu
    RTC.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: "ICE_CANDIDATE",
          username: 'Kalle',
          candidate: event.candidate,
        })
      }
    }
  })

  useEffect(() => {
    if (messages.length < 1) return // Ei vielä viestejä käsiteltäväksi

    // Katsotaan viesti joka saapui
    const last = messages[messages.length - 1]

    switch(last.type) {
      case "USER_JOINED":
        setUsers((prevUsers) => [...prevUsers, {username: last.username, wantsToStream: false}]) 
        break

      case "USER_LEFT":
        setUsers((prevUsers) => prevUsers.filter((u) => u.username !== last.username))
        break

      case "RCP_OFFER":
        handleRCPOffer(RTC, last, sendMessage)
        break
      
      case "ICE_CANDIDATE":
        RTC.addIceCandidate(new RTCIceCandidate(last.candidate))
        break

      default:
        console.log("Other message type: ", last.type)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const receiveVideo = () => {
    // TODO This function doesn't work, It hides stream but it doesn't show up again
    if (remoteStream) return setRemoteStream(null) 
    
    // Get tracks from remote stream, add to video stream
    const stream = new MediaStream()

    RTC.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => stream.addTrack(track))
    }

    setRemoteStream(stream)
  }

  return (
    <>
      <h1>This is the host website, hosting room {roomID}</h1>
      <Link to='/'>
        <button>Back</button>
      </Link>

      <button onClick={() => receiveVideo()}>{buttonText(remoteStream)}</button>

      <Screen stream={remoteStream}></Screen>

      <h2>Current users in room</h2>
      {users.map((user) => {
        return renderUser(user)

      })}
    </>
  )
}

export default Host
