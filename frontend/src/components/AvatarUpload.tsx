import { useState, ChangeEvent } from 'react'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { fetchAuthSession } from 'aws-amplify/auth'
import { cfg } from '../aws-config'

async function getS3(): Promise<S3Client> {
  const session = await fetchAuthSession()
  const logins: Record<string, string> = {}

  // Map the Cognito User Pool as an identity provider for Identity Pool
  const idToken = session.tokens?.idToken?.toString()
  if (idToken) {
    const key = `cognito-idp.${cfg.region}.amazonaws.com/${cfg.userPoolId}`
    logins[key] = idToken
  }

  const creds = fromCognitoIdentityPool({
    clientConfig: { region: cfg.region },
    identityPoolId: cfg.identityPoolId,
    logins,
  })

  return new S3Client({ region: cfg.region, credentials: creds })
}

export default function AvatarUpload(): JSX.Element {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string>('')

  const upload = async (): Promise<void> => {
    if (!file) return

    try {
      const session = await fetchAuthSession()
      const sub = session.tokens?.idToken?.payload?.sub as string
      const s3 = await getS3()
      const key = `avatars/${sub}/${file.name}`

      await s3.send(
        new PutObjectCommand({
          Bucket: cfg.avatarsBucket,
          Key: key,
          Body: file,
          ContentType: file.type,
        })
      )

      setMessage('Uploaded: ' + key)
    } catch (e) {
      console.error(e)
      setMessage('Upload failed')
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFile(e.target.files?.[0] || null)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={upload} disabled={!file}>
        Upload
      </button>
      <div>{message}</div>
    </div>
  )
}
