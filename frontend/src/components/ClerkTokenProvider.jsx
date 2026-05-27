import { useAuth } from '@clerk/clerk-react';
import { setGetToken } from '@/lib/auth-token';

export default function ClerkTokenProvider({ children }) {
  const { getToken, isSignedIn } = useAuth();

  if (isSignedIn && getToken) {
    setGetToken(getToken);
  }

  return children;
}
