import React from 'react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside style={{width:240, borderRight:'1px solid #eee', padding:16}}>
      <h3>MapMe</h3>
      <nav>
        <ul style={{listStyle:'none', padding:0}}>
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/onboarding">Update info</Link></li>
          <li><Link to="/home?new=1">New search</Link></li>
          <li><Link to="/home?near=1">Near me</Link></li>
        </ul>
      </nav>
    </aside>
  )
}