import React, { useEffect, useState } from 'react'
import { cfg } from '../aws-config'
import { Auth } from 'aws-amplify'

interface Search {
  userId: string;
  createdAt: string;
  query: string;
}

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function api(path: string, opts: ApiOptions = {}): Promise<any> {
  const session = await Auth.currentSession()
  const token = session.getIdToken().getJwtToken()
  
  const res = await fetch(`${cfg.apiBase}${path}`, {
    ...opts,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  
  return res.json()
}

export default function Home(): JSX.Element {
  const [searches, setSearches] = useState<Search[]>([])
  
  useEffect(() => {
    api('/searches', { method: 'GET' })
      .then(setSearches)
      .catch(console.error)
  }, [])

  const add = async (): Promise<void> => {
    await api('/searches', {
      method: 'POST',
      body: JSON.stringify({ query: 'Near me' }),
    })
    const updated = await api('/searches', { method: 'GET' })
    setSearches(updated)
  }

  return (
    <div>
      <h2>Home</h2>
      <button onClick={add}>Add sample search</button>
      <ul>
        {searches.map((s) => (
          <li key={s.createdAt}>
            {new Date(+s.createdAt * 1000).toLocaleString()}: {s.query}
          </li>
        ))}
      </ul>
    </div>
  )
}
