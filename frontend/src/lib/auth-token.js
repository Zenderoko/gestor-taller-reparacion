let getTokenFn = null;

export function setGetToken(fn) {
  getTokenFn = fn;
}

export async function getAuthToken() {
  if (!getTokenFn) return null;
  try {
    const token = await getTokenFn({ skipCache: true });
    return token;
  } catch {
    return null;
  }
}
