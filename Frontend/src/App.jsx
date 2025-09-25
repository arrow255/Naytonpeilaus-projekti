import "./App.css"
import Client from "./sites/client/Client"
import { Routes, Route, Link } from "react-router-dom"

function App() {
  return (
    <>
      <h1>Näytönpeilaus projekti</h1>
      
      <Link to='/create_room'>
        <button>Create Room</button>
      </Link>

      <Link to='/join_room'>
        <button>Join Room</button>
      </Link>
    </>
  )
}

export default App
