import React from 'react'
import { Link } from "react-router-dom";


function Home() {
  return (
    <div>
        <Link to={'/wordle'}>Wordle</Link>
        <Link to={'/qwordle'}>Qwordle</Link>
    </div>
  )
}

export default Home