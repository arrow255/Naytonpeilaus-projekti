import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

// Sites
import Client from "./sites/client/Client"
import Host from "./sites/host/Host"
import CreateRoom from "./sites/createRoom/CreateRoom"
import JoinRoom from "./sites/joinRoom/JoinRoom"
import App from "./App.jsx"


createRoot(document.getElementById("root")).render(
  <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path='/host' element={<Host />} />
          <Route path='/client' element={<Client />} />
          <Route path='/' element={<App />} />
          <Route path='/create_room' element={<CreateRoom/>}/>
          <Route path='/join_room' element={<JoinRoom/>}/>
        </Routes>
      </BrowserRouter>
  </StrictMode>
)
