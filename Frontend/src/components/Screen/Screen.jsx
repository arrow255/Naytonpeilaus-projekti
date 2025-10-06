import React, { useEffect, useRef } from "react"
import "./screen.css"

const Screen = ({ stream }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

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
