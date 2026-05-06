// config/auth.js
import { signInWithPopup, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'

import { auth, provider } from './firebase.js'

/** Login con Google — devuelve el usuario */
export async function login() {
  const result = await signInWithPopup(auth, provider)
  return result.user
}

/** Devuelve el ID token del usuario actual (útil para llamadas al backend) */
export async function getToken() {
  if (!auth.currentUser) throw new Error('No hay sesión activa')
  return auth.currentUser.getIdToken()
}

/** Cierra la sesión */
export async function logout() {
  return signOut(auth)
}

/** Suscripción al estado de sesión — llama callback(user) cada vez que cambia */
export function onSession(callback) {
  return onAuthStateChanged(auth, callback)
}