import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"

// Components
import Screen from "../../components/Screen/Screen.jsx"
import { Link } from "react-router-dom"

// Styling
import "./host.css"

const buttonText = (remoteStream) => {
  if (remoteStream) {
    return "Hide stream"
  }
  return "Show Stream"
}

const Host = () => {
  let RTC = new RTCPeerConnection()
  const [remoteStream, setRemoteStream] = useState(null)
  const { _sendMessage, messages } = useWebSocket()

  const [users, setUsers] = useState([])
  const { roomID } = useParams()

  useEffect(() => {
    if (messages.length < 1) return // Ei vielä viestejä käsiteltäväksi

    // Katsotaan viesti joka saapui
    const last = messages[messages.length - 1]

    if (last.type == "USER_JOINED") {
      setUsers((prevUsers) => [...prevUsers, last.username]);
    }

    if (last.type == "USER_LEFT") {
      setUsers((prevUsers) => prevUsers.filter((u) => u !== last.username));
    }

  }, [messages])

  const receiveVideo = () => {
    if (remoteStream) return setRemoteStream(null)

    // Get tracks from remote stream, add to video stream
    setRemoteStream(new MediaStream())

    RTC.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track)
      })
    }
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
        return <p key={user}>{user}</p>
      })}
    </>
  )
}

export default Host
