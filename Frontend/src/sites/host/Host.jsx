import { Link } from "react-router-dom"
import { useState } from "react"
import './host.css'

const Screen = ({shareScreen}) => {
    if (shareScreen) {
        return <div id='videoContainer'><video id='videoContainer' poster='https://media1.tenor.com/m/ZdsIbPaZn64AAAAC/verycat-cateat.gif' autoPlay></video></div>
    }
    
    return <div id='videoContainer'></div>
}

const buttonText = (shareScreen) => {
  if (shareScreen) {
    return 'Hide stream'
  }
  return "Show Stream"
}


const Host = () => {
  const [shareScreen, changeShareScreen] = useState(false);

  return (
    <>
      <h1>This is the host website</h1>
      <Link to='/'>
        <button>Back</button>
      </Link>

      <button onClick={() => changeShareScreen(!shareScreen)}>{buttonText(shareScreen)}</button>

      <Screen shareScreen={shareScreen}></Screen>
    </>
  )
}

export default Host
