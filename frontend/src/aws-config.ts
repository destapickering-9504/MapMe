/**
 * AWS Configuration from environment variables
 */

export interface AWSConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  identityPoolId: string;
  avatarsBucket: string;
  apiBase: string;
}

export const cfg: AWSConfig = {
  region: import.meta.env.VITE_REGION || '',
  userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
  identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || '',
  avatarsBucket: import.meta.env.VITE_AVATARS_BUCKET || '',
  apiBase: import.meta.env.VITE_API_BASE || '',
};
