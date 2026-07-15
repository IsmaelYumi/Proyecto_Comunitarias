# 📡 Proyecto Comunitarias — API REST

API REST desarrollada con **Node.js**, **Express** y **TypeScript**, conectada a **Firebase Firestore** para el registro y consulta de datos de sensores comunitarios (nivel y presión).

---

## 🛠️ Tecnologías

| Tecnología | Versión |
|---|---|
| Node.js | >= 18 |
| TypeScript | ^5.4.5 |
| Express | ^4.22.2 |
| Firebase Admin SDK | ^13.10.0 |
| dotenv | ^17.4.2 |
| nodemon | ^3.1.14 |
| ts-node | ^10.9.2 |

---

## 📁 Estructura del Proyecto

```
Proyecto_Comunitarias/
├── src/
│   ├── config/
│   │   └── firebasebase.config.ts   # Inicialización de Firebase Admin SDK
│   ├── controllers/
│   │   └── Input.Controller.ts      # Controladores de las rutas
│   ├── routes/
│   │   └── Input.routes.ts          # Definición de rutas Express
│   ├── service/
│   │   └── Input.service.ts         # Lógica de negocio y acceso a Firestore
│   ├── app.ts                       # Configuración de Express y middlewares
│   └── index.ts                     # Punto de entrada del servidor
├── .env                             # Variables de entorno (no subir a git)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/IsmaelYumi/Proyecto_Comunitarias.git
cd Proyecto_Comunitarias
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=3000

# Firebase
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=tu-client-email@proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Nunca subas el archivo `.env` a GitHub.** Está incluido en `.gitignore`.

---

## 🚀 Ejecución

### Modo desarrollo (con recarga automática)

```bash
npm run dev
```

### Modo producción

```bash
npm run build
npm start
```

El servidor corre por defecto en: `http://localhost:3000`

---

## 📌 Endpoints de la API

Base URL: `/api`

### 📦 Registros (Nivel + Presión juntos)

#### `POST /api/registro`
Registra un par de valores (nivel y presión) en la colección `Registros`.

**Body:**
```json
{
  "nivel": 75,
  "presion": 120
}
```

**Respuesta exitosa `201`:**
```json
{
  "ok": true,
  "message": "Registro guardado correctamente en la colección \"Registros\".",
  "data": {
    "id": "abc123",
    "nivel": 75,
    "presion": 120,
    "createdAt": "2026-07-15T21:00:00.000Z"
  }
}
```

---

#### `GET /api/registros`
Obtiene todos los registros de la colección `Registros`, ordenados por fecha descendente.

**Respuesta exitosa `200`:**
```json
{
  "ok": true,
  "total": 2,
  "data": [
    {
      "id": "abc123",
      "nivel": 75,
      "presion": 120,
      "fechaHora": "15/07/2026, 16:00:00"
    }
  ]
}
```

---

### 📊 Nivel

#### `POST /api/nivel`
Registra únicamente el valor de nivel en la colección `Nivel`.

**Body:**
```json
{
  "nivel": 85
}
```

**Respuesta exitosa `200`:**
```json
{
  "ok": true,
  "message": "Registro guardado correctamente en la colección \"Nivel\".",
  "data": {
    "id": "xyz789",
    "nivel": 85,
    "createdAt": "2026-07-15T21:00:00.000Z"
  }
}
```

---

### 🔴 Presión

#### `POST /api/presion`
Registra únicamente el valor de presión en la colección `Presion`.

**Body:**
```json
{
  "presion": 130
}
```

**Respuesta exitosa `200`:**
```json
{
  "ok": true,
  "message": "Registro guardado correctamente en la colección \"Presion\".",
  "data": {
    "id": "def456",
    "presion": 130,
    "createdAt": "2026-07-15T21:00:00.000Z"
  }
}
```

---

## ❌ Respuestas de Error

Todos los endpoints retornan errores con el siguiente formato:

| Código | Descripción |
|---|---|
| `400` | Campo requerido faltante o con tipo de dato incorrecto |
| `500` | Error interno del servidor o de conexión con Firestore |

**Ejemplo `400`:**
```json
{
  "ok": false,
  "message": "El campo \"presion\" debe ser un número válido."
}
```

**Ejemplo `500`:**
```json
{
  "ok": false,
  "message": "Error al registrar la presion.",
  "error": "Detalle del error"
}
```

---

## 🗄️ Colecciones en Firestore

| Colección | Campos almacenados |
|---|---|
| `Registros` | `nivel`, `presion`, `createdAt` |
| `Nivel` | `nivel`, `createdAt` |
| `Presion` | `presion`, `createdAt` |

---

## 👤 Autor

**Ismael** — Proyecto Comunitarias
