# RealEstate OS 🏠

> **El Sistema Operativo para Inmobiliarias.** Plataforma SaaS multi-tenant centrada en el **lead** (no en la propiedad): pipeline comercial, lead scoring explicable, centro de operaciones en tiempo real y automatizaciones.

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 15 (App Router) · React 19 · TailwindCSS v4 · tRPC + React Query · motion
- **Backend**: tRPC 11 · Prisma 6 · PostgreSQL (Neon) · RBAC · transactional outbox
- **Auth**: Clerk (pendiente de cablear) — mientras tanto, stub de desarrollo por header

## Estructura

```
├── apps/
│   └── web/            # App Next.js (frontend + API tRPC en /api/trpc)
├── packages/
│   ├── core/           # Enums de dominio, pipeline, eventos, motor de Lead Score
│   ├── db/             # Schema Prisma, migraciones, seed, helpers outbox/auditoría
│   ├── auth/           # Matriz RBAC (rol × permiso) y tipos del principal
│   └── api/            # Servidor tRPC: contexto multi-tenant, routers, servicios
├── docs/               # Documentación completa de producto y arquitectura (14 docs)
│   └── viewer.html     # Visor local de la documentación (node docs/serve-docs.js)
└── PLAN.md             # Plan maestro del proyecto
```

## Setup (primera vez)

Requisitos: **Node 20+** y **pnpm 9** (si no lo tenés global: usá `npx pnpm@9.12.3 <cmd>`).

```bash
# 1. Clonar e instalar
git clone https://github.com/Gigisanta/Software-Inmobiliarias.git
cd Software-Inmobiliarias
pnpm install

# 2. Variables de entorno
cp .env.example .env
#   → completá DATABASE_URL y DIRECT_URL (Postgres/Neon; pedile las credenciales al equipo)
#   → dejá DEV_AUTH="true" para desarrollo
#   Además creá apps/web/.env.local con las MISMAS variables
#   (Next.js solo auto-carga el .env de apps/web, no el de la raíz)

# 3. Base de datos
pnpm db:generate      # genera el cliente Prisma
pnpm db:migrate       # aplica las migraciones
pnpm db:seed          # carga la inmobiliaria demo (usuarios, pipeline, leads)

# 4. Levantar la app
npx pnpm@9.12.3 --filter web exec next dev -p 3100
# → http://localhost:3100        (app)
# → http://localhost:3100/landing (landing de marketing)
```

## Auth en desarrollo

Clerk todavía no está cableado. Mientras tanto hay un **stub de desarrollo**: la identidad se resuelve
contra el tenant demo según el header `x-dev-role` (`OWNER` | `MANAGER` | `ADVISOR`).
En la UI podés cambiar de rol desde el menú del usuario (arriba a la derecha) → “Ver como”.

Usuarios del seed: `dueno@demo.com` · `gerente@demo.com` · `asesor@demo.com`.

> ⚠️ El stub **solo** funciona con `NODE_ENV != production` y sin `CLERK_SECRET_KEY` configurada.

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta todo con Turborepo |
| `pnpm typecheck` | Typecheck de todos los paquetes |
| `pnpm db:studio` | Prisma Studio (explorar la base) |
| `pnpm db:migrate` | Nueva migración en desarrollo |
| `node docs/serve-docs.js` | Visor de la documentación en `http://localhost:4321/viewer.html` |

## Documentación

Toda la documentación de producto y arquitectura (visión, benchmark, personas, arquitectura
funcional y técnica, modelo de datos, multi-tenancy/RBAC, APIs, módulos clave, roadmap, riesgos,
infraestructura, UX/UI y mejoras propuestas) está en [`docs/`](docs/README.md).

## Estado actual

- ✅ Documentación completa (14 documentos)
- ✅ Backend: fundaciones multi-tenant + Lead/Pipeline (tRPC, Prisma, RBAC, outbox, auditoría, Lead Score explicable)
- ✅ Frontend: Centro de Operaciones, Pipeline Kanban, Leads (lista/alta/ficha 360°), Oportunidades del día, landing de marketing
- ⏳ Próximo: Clerk real, Agenda/Tareas, webhook de WhatsApp, RLS en Postgres, tests
