import { Link } from "react-router-dom"

const Host = () => {
  return (
    <>
      <h1>This is the host website</h1>
      <Link to='/'>
        <button>Back</button>
      </Link>
    </>
  )
}

export default Host
