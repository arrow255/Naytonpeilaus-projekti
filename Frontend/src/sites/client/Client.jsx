import { Link } from "react-router-dom"
import "./client.css"
import servers from "../utils";
import { useState } from "react";
import Screen from '../../components/Screen/Screen.jsx'

const Client = () => {
    let RTC = new RTCPeerConnection(servers);
    const [localStream, setLocalStream] = useState(null);
    const [buttonText, setButtonText] = useState('Request Screen Share')

    const controlVideoSharing = async () => {
        // User wants to stop the stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null)
            setButtonText('Request Screen Share')
            return
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({video: true})

        // Checks if the stream is stopped by other means
        stream.getVideoTracks().forEach((track) => {
            track.onended = () => {
            setLocalStream(null);
            setButtonText('Request Screen Share')
            };
        });

        // Push tracks from Local stream to peer connection
        setLocalStream(stream)
        setButtonText('Stop Screen Share')

        localStream.getTracks().forEach((track) => {
            RTC.addTrack(track, localStream)
        });
    }

    return (
        <>
            <h1>This is the client website</h1>
            <Link to="/">
                <button>
                    Back
                </button>
            </Link>

            <button onClick={controlVideoSharing} >{buttonText}</button>
            <Screen stream={localStream}></Screen>
        </>
    )
}

export default Client