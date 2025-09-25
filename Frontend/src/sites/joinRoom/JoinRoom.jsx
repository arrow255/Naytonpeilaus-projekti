import { Link } from "react-router-dom"
import "./joinRoom.css"

const JoinRoom = () => {
    return (
        <>
            <h1>This is the Join room site</h1>
            <Link to="/">
                <button>
                    Back
                </button>
            </Link>
        </>
    )
}

export default JoinRoom