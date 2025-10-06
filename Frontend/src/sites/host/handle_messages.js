async function handleRCPOffer(user, sendMessage) {
    // Luodaan RCP vastaus ja lähetetään
    const receivedOffer = new RTCSessionDescription({
        type: "offer",
        sdp: user.sdp,
    })
    
    await user.RTC.setRemoteDescription(receivedOffer)

    const answer = await user.RTC.createAnswer()
    await user.RTC.setLocalDescription(answer)

    sendMessage({
        type: "RCP_ANSWER",
        username: user.username,
        sdp: answer.sdp,
    })
}

export default handleRCPOffer