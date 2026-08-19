# 🗳️ VotoReal — Sistema Electoral Profesional (Clean Architecture)

Sistema oficial de control de votación, conteo manual, escaneo óptico por inteligencia artificial (OCR) y supervisión de personeros y coordinadores de mesa para Lima Metropolitana.

---

## 📁 Estructura Definitiva del Proyecto

```text
conteovotosapplima/
│
├── _backup_original/                             # 📦 Respaldo inmutable del sistema legacy completo
│
├── _referencias/                                 # 🖼️ 5 Capturas oficiales para control visual 1:1
│   ├── 01-mesa-incorrecta.png
│   ├── 02-conteo-imagen.png
│   ├── 03-conteo-manual.png
│   ├── 04-control-votacion.png
│   └── 05-mesa-requerida.png
│
├── backend/                                      # ⚙️ Servidor Node.js + Express (Clean Architecture)
│   ├── migrations/                               # 🗄️ Scripts SQL Server con control de versiones
│   │   ├── 001_initial_schema.sql                # Tablas principales
│   │   ├── 002_indexes.sql                       # Índices de rendimiento
│   │   ├── 003_seed_data.sql                     # Datos semilla
│   │   ├── 004_add_direccion_mesas.sql           # Dirección y tipos en dbo.Mesas
│   │   ├── 005_constraints_mesas.sql             # Restricciones e índices
│   │   ├── 006_personero_mesa.sql                # Relación estricta 1:1 Personero - Mesa
│   │   ├── 007_seed_mesas_ate.sql                # Carga masiva de locales y mesas de Ate (123 locales, 1650 mesas)
│   │   └── audit_queries.sql                     # Consultas de verificación y auditoría
│   │
│   ├── src/
│   │   ├── domain/                               # CAPA DE DOMINIO (Reglas puras, sin frameworks)
│   │   │   ├── entities/                         # User.js, Vote.js, Attendance.js, Arrival.js
│   │   │   └── repositories/                     # Interfaces IUserRepository, IVoteRepository, etc.
│   │   ├── application/                          # CAPA DE APLICACIÓN (Casos de uso desacoplados)
│   │   │   └── use-cases/                        # auth, votes, attendance, coordinator, users, mesas, reports, config
│   │   ├── infrastructure/                       # CAPA DE INFRAESTRUCTURA (SQL Server)
│   │   │   ├── database/                         # connection.js, migrate.js con dbo.SchemaMigrations
│   │   │   └── repositories/                     # SqlUserRepository, SqlVoteRepository, etc.
│   │   ├── interfaces/                           # CAPA DE INTERFACES (Controladores HTTP y Rutas)
│   │   │   ├── controllers/                      # AuthController, VoteController, AttendanceController, etc.
│   │   │   ├── routes/                           # apiRoutes.js (/api/voto-real, /api/config, etc.)
│   │   │   └── middleware/                       # errorHandler.js
│   │   ├── config/                               # env.js (Puerto 5180)
│   │   └── server.js                             # Punto de entrada Express
│   ├── tests/
│   │   ├── audit-legacy-comparison.js            # Auditoría arquitectónica (70 verificaciones)
│   │   ├── integration.test.js                   # 14 pruebas de integración con SQL Server
│   │   └── verify_geocoding.js                   # Auditoría de geocodificación y mesas
│   ├── .dockerignore
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                                     # 💻 Cliente Web React + Vite
│   ├── public/                                   # 🌐 ÚNICO directorio público del frontend
│   │   └── favicon.svg                           # Ícono oficial
│   ├── src/
│   │   ├── components/                           # common/ (Header, Toast, AlertDialog), modals/ (Welcome, Config, Scanner)
│   │   ├── views/                                # Login/, Counting/ (components, Manual, OCR), Coordinator/
│   │   ├── hooks/                                # useAuth, useVotes, useAttendance, useGeolocation, useOcr, useOfflineSync
│   │   ├── services/                             # api, gps, sync, ocr
│   │   ├── constants/                            # data.js, distritos.js, usuarios.js
│   │   ├── utils/                                # helpers.js, imageCompressor.js
│   │   ├── styles/                               # style.css (100% diseño visual original conservado)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tests/                                    # frontend-logic.test.mjs
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .dockerignore
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 🚀 Despliegue y Ejecución

### Opción 1: Desarrollo Local
```bash
# Terminal 1: Backend (Puerto 5180)
cd backend
npm run migrate
npm start

# Terminal 2: Frontend (Puerto 5173)
cd frontend
npm run dev
```

### Opción 2: Docker Compose
```bash
docker compose up --build
```
Acceder a través de: `http://localhost:5173`.
