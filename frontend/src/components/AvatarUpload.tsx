import { useState, ChangeEvent } from 'react'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity'
import { fetchAuthSession } from 'aws-amplify/auth'
import { cfg } from '../aws-config'

interface AvatarUploadProps {
  onUploadComplete?: (url: string) => void
}

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

export default function AvatarUpload({ onUploadComplete }: AvatarUploadProps): JSX.Element {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string>('')
  const [uploading, setUploading] = useState<boolean>(false)

  const upload = async (): Promise<void> => {
    if (!file) return

    setUploading(true)
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

      // Construct the S3 URL
      const avatarUrl = `https://${cfg.avatarsBucket}.s3.${cfg.region}.amazonaws.com/${key}`

      setMessage('Avatar uploaded successfully!')

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(avatarUrl)
      }
    } catch (e) {
      console.error(e)
      setMessage('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFile(e.target.files?.[0] || null)
    setMessage('')
  }

  return (
    <div className="text-center">
      <div className="mb-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="form-control"
          id="avatarInput"
        />
      </div>
      <button
        onClick={upload}
        disabled={!file || uploading}
        className="btn btn-primary"
        type="button"
      >
        {uploading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Uploading...
          </>
        ) : (
          'Upload Avatar'
        )}
      </button>
      {message && (
        <div
          className={`mt-2 small ${message.includes('success') ? 'text-success' : 'text-danger'}`}
        >
          {message}
        </div>
      )}
    </div>
  )
}
