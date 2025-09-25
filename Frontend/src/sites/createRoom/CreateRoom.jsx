import { Link } from "react-router-dom"
import "./createRoom.css"

const Client = () => {


    return (
        <>
            <h1>This is the Create room site</h1>
            <Link to="/">
                <button>
                    Back
                </button>
            </Link>
        </>
    )
}

export default Client