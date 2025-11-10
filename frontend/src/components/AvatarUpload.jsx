import React, { useState } from 'react'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { Auth } from 'aws-amplify'
import { cfg } from '../aws-config'

async function getS3() {
  const session = await Auth.currentSession()
  const logins = {}
  // Map the Cognito User Pool as an identity provider for Identity Pool
  const key = `cognito-idp.${cfg.region}.amazonaws.com/${cfg.userPoolId}`
  logins[key] = session.getIdToken().getJwtToken()

  const creds = fromCognitoIdentityPool({
    clientConfig: { region: cfg.region },
    identityPoolId: cfg.identityPoolId,
    logins
  })
  return new S3Client({ region: cfg.region, credentials: creds })
}

export default function AvatarUpload() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')

  const upload = async () => {
    if (!file) return
    try {
      const session = await Auth.currentSession()
      const sub = session.getIdToken().payload.sub
      const s3 = await getS3()
      const key = `avatars/${sub}/${file.name}`
      await s3.send(new PutObjectCommand({
        Bucket: cfg.avatarsBucket, Key: key, Body: file, ContentType: file.type
      }))
      setMessage('Uploaded: ' + key)
    } catch (e) {
      console.error(e)
      setMessage('Upload failed')
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0])} />
      <button onClick={upload} disabled={!file}>Upload</button>
      <div>{message}</div>
    </div>
  )
}