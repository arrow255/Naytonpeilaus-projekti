async function handleRCPOffer(RTC, lastMessage, sendMessage) {
    // Luodaan RCP vastaus ja lähetetään
    const receivedOffer = new RTCSessionDescription({
        type: "offer",
        sdp: lastMessage.sdp,
    })
    await RTC.setRemoteDescription(receivedOffer)

    const answer = await RTC.createAnswer()
    await RTC.setLocalDescription(answer)

    sendMessage({
        type: "RCP_ANSWER",
        username: lastMessage.username,
        sdp: answer.sdp,
    })
}

export default handleRCPOffer