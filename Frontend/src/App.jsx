import "./App.css"
import Client from "./sites/client/Client"
import { Routes, Route, Link } from "react-router-dom"

function App() {
  return (
    <>
      <h1>Näytönpeilaus projekti</h1>
      
      <Link to='/host'>
        <button>Host</button>
      </Link>

      <Link to='/client'>
        <button>Client</button>
      </Link>
    </>
  )
}

export default App
