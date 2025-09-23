import { Link } from "react-router-dom"

const Client = () => {
    return (
        <>
            <h1>This is the client website</h1>
            <Link to="/">
                <button>
                    Back
                </button>
            </Link>
        </>
    )
}

export default Client