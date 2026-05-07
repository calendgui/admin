# Admin Panel — GUI

Panel de administración para gestionar usuarios, challenges, spots y más.

## URL
> https://calendgui.github.io/admin

## Stack
- Vanilla JS (ES Modules)
- Firebase Auth (Google OAuth)
- Fetch API

## 📁 Estructura

src/
├── config/
│   ├── auth.js          # Firebase Auth
│   └── config.js        # BASE_URL y constantes
├── layout/
│   └── dashboard.js     # Layout principal con sidebar
└── modules/
    ├── login.js
    ├── users.js
    ├── challenges.js
    ├── announcements.js
    ├── spots.js
    ├── slots_type.js
    └── ch_allowed.js

## Deploy

El proyecto está conectado a BackendGui(Render). Para ver los cambios reflejados en producción, simplemente pusheá al repositorio:

git add .
git commit -m "descripción del cambio"
git push

> ⚠️ El login requiere autenticación con Google via Firebase.
> No es posible correr en local sin configurar el dominio autorizado en Firebase Console.