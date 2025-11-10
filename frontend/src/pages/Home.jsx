import React, { useEffect, useState } from 'react'
import { cfg } from '../aws-config'
import { Auth } from 'aws-amplify'

async function api(path, opts={}) {
  const session = await Auth.currentSession()
  const token = session.getIdToken().getJwtToken()
  const res = await fetch(`${cfg.apiBase}${path}`, {
    ...opts,
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
      ...(opts.headers||{})
    }
  })
  return res.json()
}

export default function Home() {
  const [searches, setSearches] = useState([])
  useEffect(()=>{
    api('/searches','GET').then(setSearches).catch(console.error)
  },[])

  const add = async () => {
    await api('/searches', { method:'POST', body: JSON.stringify({ query: 'Near me' })})
    const updated = await api('/searches', 'GET')
    setSearches(updated)
  }

  return (
    <div>
      <h2>Home</h2>
      <button onClick={add}>Add sample search</button>
      <ul>
        {searches.map(s => (
          <li key={s.createdAt}>{new Date(+s.createdAt*1000).toLocaleString()}: {s.query}</li>
        ))}
      </ul>
    </div>
  )
}