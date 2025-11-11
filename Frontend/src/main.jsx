import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { WebSocketProvider } from "./components/WebSocketContext/WebSocketContext.jsx"
import { Provider } from "@/components/ui/provider"

// Sites
import Client from "./sites/client/Client"
import Host from "./sites/host/Host"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider>                
      <WebSocketProvider>    
        <BrowserRouter>
          <Routes>
            <Route path='/host/:roomID' element={<Host />} />
            <Route path='/room/:roomID' element={<Client />} />
            <Route path='/' element={<App />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </Provider>
  </StrictMode>
)
