import { useEffect, useState, useRef, useMemo } from "react"
import { useParams } from "react-router-dom"
import { useWebSocket } from "../../components/WebSocketContext/WebSocketContext.jsx"
import { Box, VStack, Text, Button, Heading, QrCode } from "@chakra-ui/react"
import handleRCPOffer from "./handleMessages.js"
import config from "@/components/servers.js"

// Components
import Screen from "../../components/Screen/Screen.jsx"
import { Link } from "react-router-dom"

// Styling
import "./host.css"

const Host = () => {
  const [remoteStream, setRemoteStream] = useState(null)
  const { sendMessage, messages } = useWebSocket()
  const [streamingUser, setStreamingUser] = useState(null)
  const [sidebarView, setSidebarView] = useState("kayttajat")

  const [users, setUsers] = useState([])
  const { roomID } = useParams()

  const lastMessage = useRef(0)
  useEffect(() => {
    for (let i = lastMessage.current; i < messages.length; ++i) {
      // Katsotaan viesti joka saapui
      const last = messages[i]

      switch (last.type) {
        case "USER_JOINED":
          const newRTC = new RTCPeerConnection(config)
          // Set up ICE candidate handler immediately when RTC is created
          newRTC.onicecandidate = (event) => {
            if (event.candidate) {
              sendMessage({
                type: "ICE_CANDIDATE",
                username: last.username,
                candidate: event.candidate,
              })
            }
          }

          setUsers((prevUsers) => [
            ...prevUsers,
            {
              username: last.username,
              wantsToStream: false,
              sdp: null,
              RTC: newRTC,
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
    }
    lastMessage.current = messages.length
    // We want this to run only when we get messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const sortedUsers = useMemo(() => {
    // This function returns the sorted version of users
    if (!users) return [];

    return [...users].sort((a, b) => {
      // 1. streaming user first
      if (streamingUser) {
        if (a.username === streamingUser.username) return -1;
        if (b.username === streamingUser.username) return 1;
      }

      // 2. users who want to stream
      if (a.wantsToStream && !b.wantsToStream) return -1;
      if (!a.wantsToStream && b.wantsToStream) return 1;

      // 3. alphabetical for the rest
      return a.username.localeCompare(b.username);
    });
  }, [users, streamingUser]);

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
      sendMessage({  
          "type": "STOP_SHARING",
          "username": user.username
        })

      return
    }

    if (streamingUser) {
      if (confirm(`Tällä hetkellä näyttöä jakaa ${streamingUser.username}, haluatko lopettaa tämän hetkisen näytönjaon ja vaihtaa käyttäjän ${user.username} näyttöön?`)) { stopUserStream() }
      else { return }
    }

    // Get tracks from remote stream, add to video stream
    const stream = new MediaStream()
    user.RTC.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => stream.addTrack(track))
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

  const stopUserStream = () => {
    // Stop the stream
    if (!streamingUser) return

    // TODO: implement the new message
    sendMessage({
      type: "STOP_SHARING",
      username: streamingUser.username,
    })

    resetStream()
  }

  const resetStream = () => {
    setRemoteStream(null)
    setStreamingUser(null)
  }

  return (
    <Box display="flex" minH="100vh">
      {/* Jaettu näyttö */}
      <Box flex="1" bg="yellow.100" p={4}>
        <Screen stream={remoteStream} />
      </Box>

      {/* Sivupalkkijutut */}
      <Box
        width="200px"
        bg="green.200"
        p={4}
        display="flex"
        flexDirection="column"
        height="100vh"
      >
        {/* Toggle napit */}
        <Box display="flex" gap={1} mb={4}>
          <Button
            onClick={() => setSidebarView("kayttajat")}
            colorPalette={sidebarView === "kayttajat" ? "teal" : "gray"}
            variant={sidebarView === "kayttajat" ? "solid" : "outline"}
          >
            Käyttäjät
          </Button>
          <Button
            onClick={() => setSidebarView("asetukset")}
            colorPalette={sidebarView === "asetukset" ? "teal" : "gray"}
            variant={sidebarView === "asetukset" ? "solid" : "outline"}
          >
            Asetukset
          </Button>
        </Box>

        {/* Sidebar content */}
        <Box flex="1" overflowY="auto">
          {sidebarView === "kayttajat" && (
            <VStack spacing={2} align="stretch">
              <Text fontWeight="bold">Liittyneet käyttäjät:</Text>
              {sortedUsers.map((user) => (
                <Box key={user.username} p={2} bg="white" borderRadius="md">
                  <Text>{user.username}</Text>

                  {streamingUser && streamingUser.username == user.username && (
                      <Button
                        colorPalette="blue"
                        size="xs"
                        onClick={stopUserStream}
                      >
                        Keskeytä jako
                      </Button>
                  )}

                  {user.wantsToStream && (
                    <Box mt={1} display="flex" gap={2}>
                      <Button
                        colorPalette="green"
                        size="xs"
                        onClick={() => handleAnswer(true, user)}
                      >
                        Aloita jako
                      </Button>
                      <Button
                        colorPalette="red"
                        size="xs"
                        onClick={() => handleAnswer(false, user)}
                      >
                        Hylkää
                      </Button>
                    </Box>
                  )}

                </Box>
              ))}
            </VStack>
          )}

          {sidebarView === "asetukset" && (
            <VStack spacing={2} align="stretch">
              <Text fontWeight="bold">Asetukset:</Text>
              <Button>Asetus 1</Button>
              <Button>Asetus 2</Button>
            </VStack>
          )}
        </Box>

        {/* liitymiskoodi */}
        <Box mt={2} display="flex" justifyContent="center">
          <VStack>
            <Heading size="2xl">Liittymiskoodi:</Heading>
            <Heading size="4xl" borderRadius="lg" bg="teal.300" p={2}>
              {roomID}
            </Heading>
          </VStack>
        </Box>

        {/* QR koodi liitymislinkki */}
        <Box mt={2} display="flex" justifyContent="center">
          <QrCode.Root value={"http://localhost:5173/room/" + roomID}>
            <QrCode.Frame>
              <QrCode.Pattern />
            </QrCode.Frame>
          </QrCode.Root>
        </Box>

        {/* Takaisin nappi */}
        <Box mt={2} display="flex" justifyContent="center">
          <Link to="/">
            <Button colorPalette="teal" size="lg">
              Takaisin
            </Button>
          </Link>
        </Box>
      </Box>
    </Box>
)
}

export default Host
