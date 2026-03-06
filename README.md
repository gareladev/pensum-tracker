# Pensum Tracker

Herramienta para que los estudiantes den seguimiento a su avance en la carrera. Visualiza la malla curricular por cuatrimestres, permite marcar materias como cursando o aprobadas, muestra prerrequisitos y desbloqueos, y opcionalmente guarda el progreso en la nube.

Incluye por defecto las carreras de ingeniería de UNICARIBE (Ciberseguridad, Datos e Inteligencia Organizacional, Redes y Telecomunicaciones, Software).

---

## Características

- **Malla visual** por cuatrimestres con nodos por materia y líneas de prerrequisitos.
- **Estados por materia**: Pendiente, Cursando, Aprobada, Disponible (según prerrequisitos).
- **Interacción**: clic en una materia para cambiar estado; al seleccionarla se resaltan prerrequisitos y materias que desbloquea.
- **Resumen**: contador de materias aprobadas, cursando, disponibles y pendientes, con barra de progreso.
- **Zoom**: botones + / − y recentrar para navegar la malla.
- **Guardado en la nube** (opcional): registro e inicio de sesión con correo y contraseña; el progreso se guarda en Supabase y se sincroniza al iniciar sesión.

---

## Stack

| Tecnología        | Uso                    |
|-------------------|------------------------|
| React 19          | UI                     |
| TypeScript        | Tipado                 |
| Vite              | Build y dev            |
| React Flow        | Grafo de la malla      |
| Supabase          | Auth y base de datos   |
| Lucide React      | Iconos                 |
| pdfjs-dist        | Lectura de PDFs        |

---

## Requisitos

- Node.js 18+
- (Opcional) Cuenta en [Supabase](https://supabase.com) para guardar progreso en la nube.

---

## Instalación

```bash
git clone https://github.com/tu-usuario/pensum-tracker.git
cd pensum-tracker
npm install
```

---

## Uso local

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173). El progreso se guarda en `localStorage` aunque no configures Supabase.

---

## Guardar progreso en la nube (Supabase)

Para habilitar el botón **Guardar** y el login/registro:

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En **Project Settings → API** copia la **URL** y la **anon (public) key**.
3. En la raíz del proyecto crea un archivo `.env`:

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

   Puedes usar `.env.example` como plantilla.

4. **Migración**: crea la tabla `user_progress` de una de estas formas:
   - **Dashboard**: en Supabase → **SQL Editor** → New query, pega y ejecuta el contenido de `supabase/migrations/20250305000000_create_user_progress.sql` (o de `supabase-schema.sql`).
   - **CLI**: `npx supabase link --project-ref <tu-project-ref>` y luego `npm run db:migrate`.
5. Verifica con `npm run db:verify` (debe imprimir "OK: tabla user_progress existe").
6. (Opcional) En **Authentication → Providers → Email** activa **Confirm email** para que los usuarios verifiquen el correo al registrarse.
7. **Correo de confirmación (importante)**: si el enlace del email lleva a `http://localhost:3000` en vez de tu dominio, en Supabase ve a **Authentication** → **URL Configuration** y cambia:
   - **Site URL** a `https://pensum.garela.dev` (Supabase usa esta URL para generar el enlace del correo).
   - **Redirect URLs**: añade `https://pensum.garela.dev/**` para permitir la redirección tras confirmar.
   - Guarda los cambios. Los próximos correos de confirmación usarán `https://pensum.garela.dev/#access_token=...`.

Tras esto, los usuarios podrán registrarse, iniciar sesión y guardar/cargar su progreso desde la nube.

---

## Cómo agregar nuevas carreras

Hay dos formas de incluir nuevas carreras en la app.

### Opción 1: Desde un PDF de pensum (recomendado si tienes el PDF de la universidad)

1. Coloca el archivo PDF del pensum dentro de **`src/data/`** (por ejemplo `Pensum_MiCarrera.pdf`).
2. En la raíz del proyecto ejecuta:
   ```bash
   node scripts/parse-pdfs.mjs
   ```
3. El script lee todos los PDFs en `src/data/`, extrae materias y prerrequisitos, y **reescribe** `src/data/careers.ts` con todas las carreras (las que ya había más las nuevas).
4. Reinicia la app (`npm run dev`) y verás la nueva carrera en el selector.

**Nota:** El parser está pensado para PDFs de pensum con formato tipo UNICARIBE (tabla con CLAVE, NOMBRE, PRE, cuatrimestres). Si el PDF tiene otro formato, puede que haya que ajustar el script o usar la opción 2.

### Opción 2: A mano en código

Edita **`src/data/careers.ts`** y agrega un objeto más al array `careers`:

```ts
{
  id: 'id-unico-carrera',           // ej: 'ingenieria-civil'
  name: 'Nombre de la carrera',    // ej: 'Ingeniería Civil'
  type: 'grado',                    // 'grado' o 'postgrado'
  subjects: [
    { id: 'COD-101', name: 'Nombre materia', semester: 1, prerequisites: [] },
    { id: 'COD-102', name: 'Otra materia',   semester: 2, prerequisites: ['COD-101'] },
    // ...
  ],
}
```

- **id**: identificador único (sin espacios, minúsculas).
- **name**: nombre que se muestra en el selector.
- **subjects**: cada materia tiene `id` (código), `name`, `semester` (número de cuatrimestre) y `prerequisites` (array de `id` de materias que son prerrequisito).

Guarda el archivo y, si la app está corriendo, se actualizará solo.

---

## Scripts

| Comando           | Descripción                    |
|-------------------|--------------------------------|
| `npm run dev`     | Servidor de desarrollo         |
| `npm run build`   | Build de producción            |
| `npm run preview` | Vista previa del build         |
| `npm run lint`    | Ejecutar ESLint                |
| `npm run test`    | Tests unitarios (Vitest)       |
| `npm run db:verify` | Comprobar que la tabla existe en Supabase |
| `npm run db:migrate` | Aplicar migraciones (requiere `supabase link`) |

---

## Estructura del proyecto

```
src/
├── components/     # MallaCurricular, Leyenda, StatsBar, AuthModal, etc.
├── contexts/      # AuthContext
├── data/          # careers.ts (pensums) y PDFs de referencia
├── hooks/         # useProgress, useCareers, useDevice
├── lib/           # supabase, progressApi
├── utils/         # curriculum, layout
├── types.ts
├── App.tsx
└── main.tsx
```

---

## Autor y redes

**Garela Dev** · [garela.dev](https://garela.dev)

Sígueme:

- [**Instagram**](https://www.instagram.com/gareladev) · [**TikTok**](https://www.tiktok.com/@gareladev) · [**YouTube**](https://www.youtube.com/@gareladev) · [**X**](https://x.com/gareladev)

---

## Licencia

MIT