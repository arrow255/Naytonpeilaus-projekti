import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import Client from "./sites/client/Client"
import Host from "./sites/host/Host"

import { BrowserRouter, Routes, Route } from "react-router-dom"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/host' element={<Host />} />
        <Route path='/client' element={<Client />} />
        <Route path='/' element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
