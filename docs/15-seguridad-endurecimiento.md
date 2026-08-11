# 15 · Endurecimiento de seguridad (hardening)

Estado y cambios aplicados para que el sistema pueda manejar datos reales de
clientes. Complementa a [07-multi-tenant-seguridad-rbac.md](07-multi-tenant-seguridad-rbac.md).

## Resumen

La base ya era sólida: sesiones firmadas con HMAC-SHA256, contraseñas con scrypt
y comparación de tiempo constante, RBAC, aislamiento por `tenantId` en cada
servicio, auditoría y Prisma (parametrizado, sin inyección SQL). Se agregaron las
capas de defensa que faltaban para producción.

## Cambios aplicados

### Autenticación y sesiones
- **Bloqueo del backdoor de demo en producción.** El contexto tRPC (`DEV_AUTH`)
  ya no puede resolver un usuario sin sesión cuando `NODE_ENV=production`, sin
  importar cómo estén las demás variables. (`packages/api/src/context.ts`)
- **Rate limiting de login por IP** (10 intentos/60 s, en memoria) como primera
  línea. (`apps/web/src/lib/rate-limit.ts`)
- **Bloqueo de cuenta** tras 5 fallos consecutivos por 15 minutos, persistido en
  la base (consistente entre instancias). (`apps/web/app/api/auth/login/route.ts`)
- **Anti-DoS de scrypt:** se rechaza cualquier contraseña de más de 200
  caracteres antes de hashear.
- **Auditoría de inicio de sesión** (`AuditAction.LOGIN`, con IP).
- **Sesiones más cortas:** TTL de 30 → 7 días.
- **Revocación por cambio de contraseña:** el token lleva la "época" de la
  contraseña (`passwordChangedAt`); si cambia, las sesiones previas se invalidan.
- **Política de contraseña:** mínimo 8 caracteres, con letras y números.
- **Anti-escalada de privilegios:** solo un `OWNER` puede crear usuarios `OWNER`
  o `ADMIN`.

### Infraestructura y cabeceras
- **Cabeceras de seguridad** en todas las respuestas: `Content-Security-Policy`
  (con `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  `Cross-Origin-Opener-Policy`. Se oculta `X-Powered-By`.
  (`apps/web/next.config.mjs`)
- **Validación de entorno al arrancar** ("fail closed"): la app no levanta si
  `SESSION_SECRET` falta, es corto (< 16) o es un valor inseguro conocido.
  (`apps/web/src/lib/env.ts`)

### Datos y entradas
- **Validación del logo:** solo se acepta un data URL de imagen o una URL https.
- **Blindaje del prompt de IA:** el texto del contacto se pasa como dato entre
  delimitadores y el sistema instruye a ignorar instrucciones inyectadas
  (defensa ante prompt injection). (`packages/api/src/services/ai-service.ts`)

## Migración de base de datos

Se agregaron a `users` los campos `failedLoginAttempts`, `lockedUntil` y
`passwordChangedAt` (`packages/db/prisma/migrations/20260811120000_security_hardening`).

La migración se aplica **automáticamente en el deploy**: el `buildCommand` de
`vercel.json` ahora corre `pnpm db:migrate:deploy` antes del build. Requiere que
`DIRECT_URL` esté configurada en el entorno de Vercel (ya lo está para Neon).

> ⚠️ Si se despliega el código sin aplicar la migración, el login fallará porque
> el cliente Prisma consultará columnas que aún no existen.

## Checklist de deploy (obligatorio)

1. **Rotar `SESSION_SECRET`** en Vercel a un valor fuerte y único:
   `openssl rand -base64 48`. (Invalida todas las sesiones actuales — esperado.)
2. **Quitar `DEV_AUTH`** del entorno de producción (o dejarlo en `false`).
3. Confirmar `NODE_ENV=production` en producción.
4. Verificar que `DIRECT_URL` esté presente (para la migración).
5. Deploy: la migración de seguridad se aplica sola.

## Pendiente recomendado: RLS de Postgres (defensa en profundidad)

Hoy el aislamiento entre inmobiliarias depende de que cada consulta filtre por
`tenantId` (está bien implementado en todos los servicios). Row-Level Security
agrega una red de contención a nivel base: aunque una consulta olvide el filtro,
Postgres no devuelve filas de otro tenant.

**No se activó automáticamente** porque encender RLS sin fijar la variable de
sesión del tenant en cada transacción rompería todas las consultas. Requiere:

1. Aplicar el `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + políticas por tabla
   (SQL de referencia abajo).
2. Fijar `app.current_tenant` en cada transacción desde Prisma (vía
   `$extends`/middleware que ejecute `SET LOCAL app.current_tenant = ...`).
3. Probar exhaustivamente contra la base antes de producción.

SQL de referencia (una tabla; replicar para cada tabla con `tenantId`):

```sql
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "leads"
  USING ("tenantId" = current_setting('app.current_tenant', true));
```

## Mejoras futuras sugeridas

- Rate limiting distribuido (Redis/Upstash) si crece el tráfico multi-instancia.
- Segundo factor (2FA/TOTP) para roles `OWNER`/`ADMIN`.
- Endpoint de cambio de contraseña (la revocación de sesión ya está lista).
- Rotación de `SESSION_SECRET` con soporte de claves múltiples (sin desloguear a todos).
- Monitoreo/alertas de anomalías de acceso sobre `AuditLog`.
