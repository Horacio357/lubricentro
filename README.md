# Rudy Web App

Plataforma de historial de servicios vehiculares para **RudyServices**, un centro de servicio automotriz ubicado en Tucumán, Argentina. Funciona como una "historia clínica" digital para cada vehículo: los clientes acceden a su perfil vía un link único (`mi.rudyservices.com.ar/{userid}`) y pueden ver el historial completo de servicios, checklist de inspección previa, y datos del vehiculo. El panel admin permite gestionar cuentas, registrar servicios, y generar tickets en PDF.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (Pages Router) | 15.5 |
| UI | React | 19 |
| Base de datos | Firebase Firestore | 11.6 |
| Autenticación | Firebase Auth (email/password) | 11.6 |
| Emails transaccionales | Brevo (Sendinblue) | 3.0 |
| Generación de PDF | pdf-lib | 1.17 |
| Selects | react-select | 5.10 |
| Estilos | CSS Modules + CSS custom properties | - |
| Lenguaje | JavaScript (sin TypeScript) | - |

---

## Requisitos Previos

- Node.js >= 18
- npm
- Proyecto Firebase (Firestore + Auth habilitados)
- API key de Brevo (`BREVO_API_KEY`)

---

## Instalación y Arranque

```bash
# Instalar dependencias
npm install

# Variables de entorno (crear .env.local en la raíz)
# Solo se necesita esta:
BREVO_API_KEY=tu_api_key_de_brevo

# Desarrollo
npm run dev

# Build producción
npm run build

# Iniciar en producción
npm run start

# Lint
npm run lint
```

> **Nota:** La configuración de Firebase está hardcodeada en `src/services/firebase/firebaseConfig.js`. No se necesita archivo `.env` para Firebase.

---

## Estructura del Proyecto

```
rudy-web-app/
├── public/                          # Assets estáticos y datos JSON
│   ├── brands.json                  # 318 marcas de vehículos
│   ├── models.json                  # 5042 modelos de vehículos
│   ├── brands_upper.json            # Versión uppercase (generado por script)
│   ├── models_upper.json            # Versión uppercase (generado por script)
│   ├── marcas.xls / modelos.xls     # Fuentes originales
│   ├── logo_rudy.webp / logo_negro.webp
│   ├── spinner.gif
│   ├── rudy_footer.png
│   └── footer/                      # Iconos de redes sociales
│
├── scripts/
│   └── convertir-a-uppercase.js     # Genera los JSON uppercase
│
├── src/
│   ├── components/                  # Componentes UI reutilizables (genéricos)
│   │   ├── Button/                  # Botón con variante "danger"
│   │   ├── Form/                    # Wrapper de <form> con preventDefault
│   │   ├── Input/                   # Input controlado (uppercase, no espacios)
│   │   ├── Spinner/                 # Spinner CSS puro
│   │   └── SpinnerBranded/          # Splash de carga con logo Rudy
│   │
│   ├── layouts/                     # Layouts principales (uno por rol)
│   │   ├── admin/                   # Panel de administración
│   │   │   ├── Admin.jsx            # Orquestador principal del admin
│   │   │   ├── components/          # Sub-componentes del admin
│   │   │   │   ├── SearchAccountPanel.jsx    # Búsqueda por patente
│   │   │   │   ├── CreateAccountPanel.jsx    # Alta de vehículo + cliente
│   │   │   │   ├── DeleteAccountPanel.jsx    # Eliminación por patente
│   │   │   │   ├── DashboardPanel/           # Conteo total de vehículos
│   │   │   │   ├── FeedbackBox.jsx           # Feedback de operaciones
│   │   │   │   ├── PanelSelector.jsx         # Selector de panel (dropdown)
│   │   │   │   ├── MultipleSelector/         # react-select con tema oscuro
│   │   │   │   ├── SimplifiedDateSelector/   # Selector de fecha DD/MM/YYYY
│   │   │   │   └── AdminFooter/              # Footer con botón cerrar sesión
│   │   │   ├── hooks/
│   │   │   │   ├── useApi.js                 # CRUD admin (crear/buscar/eliminar)
│   │   │   │   ├── useCarsData.js            # Marcas y modelos desde Firestore
│   │   │   │   └── useDashboard.js           # Conteo total de vehículos
│   │   │   └── utils/
│   │   │       ├── adminEnums.js             # Estados del panel admin
│   │   │       ├── frontendValidations.js    # Validaciones del formulario
│   │   │       ├── firestoreFormDataHandlers.js  # CRUD de marcas/modelos
│   │   │       ├── firestoreDashboardHandlers.js # Conteo de vehículos
│   │   │       └── MocksAndLabels.js         # Plantillas y etiquetas
│   │   │
│   │   ├── login/
│   │   │   └── Login.jsx             # Formulario de login Firebase email/password
│   │   │
│   │   └── user/                     # Perfil público del vehículo ("Mi Rudy")
│   │       ├── User.jsx              # Layout principal del perfil
│   │       ├── components/
│   │       │   ├── VehicleInfo/      # Datos del titular (solo admin ve)
│   │       │   ├── ServiceUI/        # Tarjeta de cada servicio registrado
│   │       │   │   ├── ChecklistUI/  # Visualización del checklist (lazy load)
│   │       │   │   ├── DeleteUI/     # Botón eliminar servicio (admin)
│   │       │   │   └── Lubricentro/  # Datos de lubricentro (tipo aceite, filtros)
│   │       │   ├── AddServiceUI/     # Flujo de nueva orden de servicio
│   │       │   │   ├── PreviousForm/ # Checklist de inspección previa (7 secciones)
│   │       │   │   │   ├── ChecklistSection/
│   │       │   │   │   ├── ChecklistItem/
│   │       │   │   │   ├── ChecklistItemSides/  # Toggle Izquierda/Derecha
│   │       │   │   │   └── FeedbackBox/         # Barra inferior del checklist
│   │       │   │   ├── ServiceForm/  # Formulario de servicio (kilometraje, detalle, precio)
│   │       │   │   │   ├── VerticalSelect/      # Selector de tipo de servicio
│   │       │   │   │   └── LubricentroUI/       # Sub-form de lubricentro
│   │       │   │   └── ServiceInput/            # Input/textarea etiquetado
│   │       │   ├── DropdownBox/      # Acordeón reutilizable (expandir/colapsar)
│   │       │   ├── Footer/           # Footer con links a redes sociales
│   │       │   └── InfoField/        # Campo label:valor
│   │       ├── hooks/
│   │       │   ├── useService.js     # Lógica de crear/eliminar servicio
│   │       │   └── usePreviousForm.js # Lógica del checklist pre-servicio
│   │       ├── utils/
│   │       │   ├── mocksAndLabels.js # Plantillas y etiquetas del formulario
│   │       │   └── ticketGenerating.js # Generación de texto para ticket PDF
│   │       └── data/
│   │           └── checklist.js      # Definición de las 7 secciones del checklist
│   │
│   ├── pages/                       # Rutas (Next.js Pages Router)
│   │   ├── _app.js                  # App shell: fuente Nexa + estilos globales
│   │   ├── _document.js             # HTML lang="es"
│   │   ├── index.jsx                # Redirige a rudyservices.com.ar (302)
│   │   ├── [userid].jsx             # Perfil del vehículo (ruta dinámica)
│   │   ├── admin/
│   │   │   └── index.jsx            # Panel admin (requiere auth)
│   │   ├── admin_legacy.jsx         # Copia legacy del admin (duplicado)
│   │   ├── api/
│   │   │   ├── hello.js             # Endpoint de test
│   │   │   └── send-welcome-email.js # Envío de email de bienvenida (Brevo)
│   │   └── fonts/                   # Fuentes locales Nexa (TTF)
│   │
│   ├── services/
│   │   ├── firebase/
│   │   │   └── firebaseConfig.js    # Inicialización Firebase (hardcoded)
│   │   └── brevo/
│   │       └── brevoConfig.js       # Instancia API Brevo (usa BREVO_API_KEY)
│   │
│   ├── styles/
│   │   ├── globals.css              # CSS custom properties y estilos base
│   │   └── normalize.css
│   │
│   └── utils/
│       ├── enums.js                 # ADMIN_STATES, FETCH_STATES
│       ├── helpers.js               # scrollToBottom, formatPrice
│       ├── normalizeStrings.js      # Normalizar a mayúsculas sin acentos
│       ├── firebase/
│       │   ├── firebase.js          # CRUD público + privado de vehículos/servicios
│       │   └── firebaseAdminPanel.js # CRUD del admin (buscar/crear/eliminar)
│       ├── pdflib/
│       │   └── pdflib.js            # Generación de PDF del ticket
│       ├── options/
│       │   ├── brands.json          # Marcas para selects
│       │   ├── models.json          # Modelos para selects
│       │   └── provinces_arg.json   # 23 provincias + CABA de Argentina
│       └── upload_test.js           # Utilidad de migración de datos
│
├── jsconfig.json                    # Alias @/* → ./src/*
├── next.config.mjs                  # reactStrictMode: true
└── package.json
```

---

## Rutas de la Aplicación

| Ruta | Archivo | Acceso | Descripción |
|---|---|---|---|
| `/` | `src/pages/index.jsx` | Público | Redirige a `https://rudyservices.com.ar` |
| `/:userid` | `src/pages/[userid].jsx` | Público | Perfil del vehículo. Muestra servicios, checklist, info del titular (admin) |
| `/admin` | `src/pages/admin/index.jsx` | Auth | Panel de administración. Muestra Login si no autenticado |
| `/admin_legacy` | `src/pages/admin_legacy.jsx` | Auth | Copia legacy de `/admin` (mismo código) |
| `/api/send-welcome-email` | `src/pages/api/send-welcome-email.js` | POST | Envía email de bienvenida vía Brevo |
| `/api/hello` | `src/pages/api/hello.js` | GET | Endpoint de test (retorna `{ name: "John Doe" }`) |

---

## Modelo de Datos (Firestore)

### Colecciones principales

```
vehicles/{userid}                    → Datos públicos del vehículo
├── patente: string                  # Patente (identificador legible)
├── brand: string                    # Marca
├── model: string                    # Modelo
│
├── services/{serviceId}             → Servicios (subcolección)
│   ├── kilometraje: number
│   ├── vertical: string             # LUBRICENTRO | MECANICA LIGERA | CUBIERTAS | REPUESTOS
│   ├── details: string
│   ├── timestamp: Timestamp
│   ├── nextService: string
│   └── lubricentroData?: object     # Solo si vertical == LUBRICENTRO
│
└── checklists/{serviceId}           → Checklists (subcolección)
    ├── trenDelantero: object        # 7 secciones del checklist
    ├── trenTrasero: object
    ├── suspension: object
    ├── traccion: object
    ├── direccion: object
    ├── ruedasYFrenos: object
    ├── accesorios: object
    ├── inspectedBy: string
    └── details: string

vehicles_private/{userid}            → Datos privados (solo admin ve)
├── owner_name: string
├── owner_surname: string
├── dni: string
├── birthdate: string                # DD/MM/YYYY
├── occupation: string
├── email: string
├── province: string
├── address: string
├── zipcode: string
├── phone: string
│
└── services/{serviceId}             → Datos privados del servicio
    └── importe: number              # Precio en centavos (USD)

form_data/
├── brands                           # Marcas para el selector del admin
└── models/lists/{brandId}           # Modelos agrupados por marca
```

### Reglas de visibilidad de datos

- **Público** (`vehicles`): patente, marca, modelo, servicios (sin precio), checklists
- **Privado** (`vehicles_private`): datos personales del titular, precios de servicios
- Un admin autenticado ve ambos. Un usuario regular solo ve `vehicles`

---

## Flujo Principal: Creación de Servicio

```
1. Admin abre perfil del vehículo (/:userid)
2. Clic en "Nueva orden de servicio"
3. Completa checklist de inspección previa (7 secciones)
4. Genera y firma ticket PDF (descarga automática)
5. Completa formulario de servicio:
   - Kilometraje, tipo de vertical, descripción
   - Si LUBRICENTRO: tipo de aceite + filtros
   - Siguiente servicio, importe (precio)
6. Envío → addService() escribe en:
   - vehicles/{id}/services     → datos públicos (sin precio)
   - vehicles_private/{id}/services → precio en centavos
7. Si completó checklist → addChecklistData() escribe en:
   - vehicles/{id}/checklists/{serviceId}
8. Al crear cuenta nueva, se envía email de bienvenida vía Brevo
   con link personalizado: mi.rudyservices.com.ar/{userid}
```

---

## Autenticación y Roles

- **Firebase Auth** con email/password para el panel admin
- **Usuarios anónimos** (sin login) pueden ver el perfil de cualquier vehículo en `/:userid`
- **Admin autenticado** puede:
  - Ver datos privados del titular (VehicleInfo)
  - Agregar nuevos servicios (AddServiceUI)
  - Eliminar servicios (DeleteUI)
  - Crear/eliminar cuentas desde el panel admin
  - Ver precio de cada servicio
- La lógica de auth se maneja con `onAuthStateChanged` en `[userid].jsx` y `admin/index.jsx`

---

## API Routes

### `POST /api/send-welcome-email`

Envía email de bienvenida transaccional vía Brevo.

**Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "userId": "string",
  "email": "string"
}
```

**Respuesta:** `{ success: true }` o error con mensaje.

**Nota:** Usa `process.env.BREVO_API_KEY`. Se llama desde `useApi.createAccount()` al crear una cuenta desde el admin.

---

## Hooks Principales

| Hook | Ubicación | Función |
|---|---|---|
| `useService` | `src/layouts/user/hooks/useService.js` | Crear y eliminar servicios, validación, manejo de lubricentro |
| `usePreviousForm` | `src/layouts/user/hooks/usePreviousForm.js` | Checklist de inspección previa, generación de PDF |
| `useApi` | `src/layouts/admin/hooks/useApi.js` | CRUD admin: crear cuenta, buscar, eliminar + envío de email |
| `useCarsData` | `src/layouts/admin/hooks/useCarsData.js` | Carga y guardado de marcas/modelos en Firestore |
| `useDashboard` | `src/layouts/admin/hooks/useDashboard.js` | Conteo total de vehículos registrados |

---

## Variables de Entorno

| Variable | Ubicación | Descripción |
|---|---|---|
| `BREVO_API_KEY` | `.env.local` | API key de Brevo para emails transaccionales |

> La configuración de Firebase está en `src/services/firebase/firebaseConfig.js` (hardcodeada, no usa variables de entorno).

---

## Scripts

```bash
# Generar JSONs de marcas/modelos en mayúsculas
node scripts/convertir-a-uppercase.js

# Migrar datos de modelos a Firestore (utility de desarrollo)
# Editar src/utils/upload_test.js y ejecutar
```

---

## Notas para el Siguiente Desarrollador / IA

### Puntos importantes

1. **El home `/` redirige externamente** a `rudyservices.com.ar`. No hay contenido propio en `/`.
2. **`admin_legacy.jsx` es un duplicado exacto** de `admin/index.jsx`. Podría eliminarse o mantenerse como fallback.
3. **Las URLs públicas usan `mi.rudyservices.com.ar`** como dominio (no `localhost:3000`).
4. **Código en español** — componentes, hooks, utils, labels, y comentarios están en español.
5. **Sin tests** — No hay archivos de test ni framework de testing configurado.
6. **Sin TypeScript** — Todo es JavaScript/JSX con `jsconfig.json` para alias.
7. **Sin Tailwind** — Estilos con CSS Modules y CSS custom properties (`--mainColor: #FCBD00`).
8. **Firebase Auth gera el estado del admin** — Se usa `onAuthStateChanged` en los pages, no hay context/provider global.
9. **Precios en centavos** — El campo `importe` se almacena en centavos. Usar `formatPrice()` de `src/utils/helpers.js` para mostrarlo.
10. **Dual-write en servicios** — Al crear un servicio, se escribe en `vehicles` (público, sin precio) y `vehicles_private` (con precio). Esto es intencional por diseño de privacidad.
11. **Patente como identificador de búsqueda** — El admin busca vehículos por patente, no por ID de documento Firestore.
12. **El link del vehículo (`userid`)** es el ID del documento Firestore, no la patente.

### Estructura de carpetas a tener en cuenta

- `src/components/` → Componentes UI **genéricos** (Button, Input, Spinner)
- `src/layouts/` → Componentes **de dominio** agrupados por rol (admin, user, login)
- `src/utils/` → Capa de datos y helpers compartidos
- `src/services/` → Configuración de servicios externos (Firebase, Brevo)

### Comandos disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Iniciar en producción
npm run lint     # Lint con ESLint (Next.js)
```

NOTA DEL DESARROLLADOR: este proyecto tiene practicas y decisiones que hice cuando aun estaba aprendiendo desarrollo, mil disculpas por los problemas, bugs y decisiones suboptimas que tomé, mucha suerte y exitos. 