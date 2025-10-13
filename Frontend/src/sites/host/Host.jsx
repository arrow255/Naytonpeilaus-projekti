import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"
import handleRCPOffer from "./handleMessages.js"

// Components
import Screen from "../../components/Screen/Screen.jsx"
import { Link } from "react-router-dom"

// Styling
import "./host.css"

const renderUser = (user, handleAnswer) => {
  const username = user.username

  if (!user.wantsToStream) {
    return (
      <div key={username}>
        <p>{username}</p>
      </div>
    )
  }

  return (
    <div key={username}>
      <p>{username}</p>
      <button onClick={() => handleAnswer(true, user)}>Accept</button>
      <button onClick={() => handleAnswer(false, user)}>Decline</button>
    </div>
  )
}

const Host = () => {
  const [remoteStream, setRemoteStream] = useState(null)
  const { sendMessage, messages } = useWebSocket()
  const [streamingUser, setStreamingUser] = useState(null)

  const [users, setUsers] = useState([])
  const { roomID } = useParams()

  useEffect(() => {
    if (messages.length < 1) return // Ei vielä viestejä käsiteltäväksi

    // Katsotaan viesti joka saapui
    const last = messages[messages.length - 1]

    switch (last.type) {
      case "USER_JOINED":
        setUsers((prevUsers) => [
          ...prevUsers,
          {
            username: last.username,
            wantsToStream: false,
            sdp: null,
            RTC: new RTCPeerConnection(),
            PendingICEcandidates: [],
          },
        ])
        break

      case "USER_LEFT":
        setUsers((prevUsers) =>
          prevUsers.filter((u) => u.username !== last.username)
        )
        break

      case "RCP_OFFER":
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.username === last.username
              ? { ...u, wantsToStream: true, sdp: last.sdp }
              : u
          )
        )
        break

      case "ICE_CANDIDATE":
        updateICEcandidates(last)
        break

      case "STOP_SHARING":
        // Check if the current user stops stream, otherwise continue
        if (streamingUser && last.username === streamingUser.username) {
          setStreamingUser(null)
          setRemoteStream(null)
        } 

        // If user pulled their request for streaming away
        removeUserRequest(last.username)
        break

      default:
        console.log("Other message type: ", last.type)
    }

    // We want this to run only when we get messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const updateICEcandidates = (message) => {
    let user = users.find((u) => u.username == message.username)
    if (!user) return

    // Add ICE to users pending ICE candidates
    user.PendingICEcandidates.push(message.candidate)
  }

  const removeUserRequest = (username) => {
    // Remove the request from user
    const nextUsers = users.map((o) => {
      if (o.username === username) {
        o.wantsToStream = false
      }
      return o
    })
    setUsers(nextUsers)
  }

  const handleAnswer = (answer, user) => {
    // If host decides to decline answer
    if (!answer) {
      // Remove the request from user
      removeUserRequest(user.username)

      // Send message to user about declining
      // TODO -> sendMessage()

      return
    }

    if (streamingUser) {
      window.alert("There is already stream running")
      return
    }

    // Get tracks from remote stream, add to video stream
    const stream = new MediaStream()
    user.RTC.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => stream.addTrack(track))
    }

    // Send ICE candidates
    user.RTC.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: "ICE_CANDIDATE",
          username: user.username,
          candidate: event.candidate,
        })
      }
    }

    // Show clients stream
    setRemoteStream(stream)

    // Send RCP Offer
    handleRCPOffer(user, sendMessage)

    // Add all ICE candidates to Users RTC
    user.PendingICEcandidates.forEach((c) =>
      user.RTC.addIceCandidate(new RTCIceCandidate(c))
    )

    // Remove user request and add them as the streaming user
    removeUserRequest(user.username)
    setStreamingUser(user)
  }

  return (
    <>
      <h1>This is the host website, hosting room {roomID}</h1>
      <Link to='/'>
        <button>Back</button>
      </Link>

      <Screen stream={remoteStream}></Screen>

      <h2>Current users in room</h2>
      {users.map((user) => {
        return renderUser(user, handleAnswer)
      })}
    </>
  )
}

export default Host
