import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AvatarUpload from '../AvatarUpload'

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
}))

vi.mock('@aws-sdk/credential-provider-cognito-identity', () => ({
  fromCognitoIdentityPool: vi.fn(
    () => () =>
      Promise.resolve({
        accessKeyId: 'test',
        secretAccessKey: 'test',
        sessionToken: 'test',
      })
  ),
}))

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(() =>
    Promise.resolve({
      identityId: 'test-identity-id',
    })
  ),
}))

describe('AvatarUpload', () => {
  const mockOnUploadComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the upload button', () => {
    render(<AvatarUpload onUploadComplete={mockOnUploadComplete} />)
    expect(screen.getByText(/upload avatar/i)).toBeInTheDocument()
  })

  it('renders file input', () => {
    render(<AvatarUpload onUploadComplete={mockOnUploadComplete} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', 'image/*')
  })

  it('disables upload button when no file is selected', () => {
    render(<AvatarUpload onUploadComplete={mockOnUploadComplete} />)
    const button = screen.getByRole('button', { name: /upload avatar/i })
    expect(button).toBeDisabled()
  })

  it('enables upload button when file is selected', () => {
    render(<AvatarUpload onUploadComplete={mockOnUploadComplete} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })

    const button = screen.getByRole('button', { name: /upload avatar/i })
    expect(button).not.toBeDisabled()
  })

  it('can render without onUploadComplete callback', () => {
    render(<AvatarUpload />)
    expect(screen.getByText(/upload avatar/i)).toBeInTheDocument()
  })
})
