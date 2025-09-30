import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { WebSocketProvider } from "./components/WebSocketContext/WebSocketContext.jsx"

// Sites
import Client from "./sites/client/Client"
import Host from "./sites/host/Host"
import CreateRoom from "./sites/createRoom/CreateRoom"
import JoinRoom from "./sites/joinRoom/JoinRoom"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <WebSocketProvider>
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path='/host/:roomID' element={<Host />} />
          <Route path='/room/:roomID' element={<Client />} />
          <Route path='/' element={<App />} />
          <Route path='/create_room' element={<CreateRoom />} />
          <Route path='/join_room' element={<JoinRoom />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  </WebSocketProvider>
)
