import { Link } from "react-router-dom"
import { useState } from "react"
import Screen from '../../components/Screen/Screen.jsx'
import servers from "../utils.js"

import './host.css'

const buttonText = (remoteStream) => {
  if (remoteStream) {
    return 'Hide stream'
  }
  return "Show Stream"
}

const Host = () => {
  let RTC = new RTCPeerConnection(servers)
  const [remoteStream, setRemoteStream] = useState(null)

  const receiveVideo = () => {
    if (remoteStream) return setRemoteStream(null)

    // Get tracks from remote stream, add to video stream
    setRemoteStream(new MediaStream())

    RTC.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track)
        });
      }
  }

  return (
    <>
      <h1>This is the host website</h1>
      <Link to='/'>
        <button>Back</button>
      </Link>

      <button onClick={() => receiveVideo()}>{buttonText(remoteStream)}</button>

      <Screen stream={remoteStream}></Screen>
    </>
  )
}

export default Host
