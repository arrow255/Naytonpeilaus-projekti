import React, { createContext, useContext, useEffect, useRef, useState } from "react"

const WebSocketContext = createContext(null)
const SERVER_PATH = process.env.NODE_ENV === 'development' ? "ws://localhost:8000/ws/" : "wss://" + location.hostname + "/ws/"

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([]) // store all incoming messages

  useEffect(() => {
    const ws = new WebSocket(SERVER_PATH)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("✅ WebSocket connected")
      setIsConnected(true)
    }

    ws.onclose = () => {
      console.log("❌ WebSocket closed")
      setIsConnected(false)
    }

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        console.log("📩 Message from server:", msg)

        // append to history
        setMessages((prev) => [...prev, msg])
      } catch {
        console.error("❌ Failed to parse message:", event.data)
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const sendMessage = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    } else {
      console.warn("⚠️ WebSocket not connected, message not sent")
    }
  }

  return (
    <WebSocketContext.Provider value={{ sendMessage, isConnected, messages }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)
