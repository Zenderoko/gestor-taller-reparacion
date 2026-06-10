const TOKEN_KEY = 'gestor_taller_token';

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthToken() {
  return Promise.resolve(getToken());
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
