import { Link } from "react-router-dom"
import "./client.css"

const Client = () => {
    return (
        <>
            <h1>This is the client website</h1>
            <Link to="/">
                <button>
                    Back
                </button>
            </Link>
            <button>Request To Share Screen</button>
        </>
    )
}

export default Client