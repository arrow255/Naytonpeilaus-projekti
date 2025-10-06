import React, { useRef } from "react"
import "./screen.css"

const Screen = ({ stream }) => {
  const videoRef = useRef(null)

  if (videoRef.current) {
      videoRef.current.srcObject = stream || null
  }


  if (stream) {
    return (
      <div id='videoContainer'>
        <video
          ref={videoRef}
          autoPlay
          playsInline
        />
      </div>
    )
  }

  return <div id='videoContainer'></div>
}

export default Screen
