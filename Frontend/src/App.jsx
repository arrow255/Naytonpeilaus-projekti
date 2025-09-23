import "./App.css"
import Client from "./sites/client/Client"
import { Routes, Route, Link } from "react-router-dom"

function App() {
  return (
    <>
      <h1>Näytönpeilaus projekti</h1>
      <Link to="/client">client</Link>
      <Link to="/host">host</Link>
    </>
  )
}

export default App
