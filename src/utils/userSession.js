/**
 * useUser – reads the logged-in user from localStorage.
 * The user object is stored under the key "randr_user" as JSON.
 */
export function getUser() {
  try {
    const raw = localStorage.getItem('randr_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(userData) {
  localStorage.setItem('randr_user', JSON.stringify(userData));
}

export function clearUser() {
  localStorage.removeItem('randr_user');
}

/** Returns the initials of a name string (up to 2 chars). */
export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}
