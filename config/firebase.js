// config/firebase.js
import { initializeApp }           from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'

const firebaseConfig = {
  apiKey:     'AIzaSyCEsQAEZ0V7Xu96r9zyVS7RCBI2SFkeils',
  authDomain: 'calendgui-v2.firebaseapp.com',
  projectId:  'calendgui-v2',
}

const app = initializeApp(firebaseConfig)

export const auth     = getAuth(app)
export const provider = new GoogleAuthProvider()