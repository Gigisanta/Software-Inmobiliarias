# PLAN DE EJECUCIÓN — RealEstate OS (Documento de Diseño de Producto y Arquitectura)

> Estado: **PREPARADO — A LA ESPERA DE LA ORDEN DE EJECUCIÓN**
> Cuando el usuario dé la orden ("ejecutá", "dale", "generá el documento"), se ejecuta este plan tal cual está escrito, sin volver a preguntar.
> Alcance de esta fase: **solo documentación**. No se escribe código de la aplicación.

---

## 1. Objetivo del entregable

Generar la documentación profesional completa de diseño de **RealEstate OS**: un SaaS multi-tenant para inmobiliarias de LATAM, centrado en el **lead** (no en la propiedad), cuyo núcleo es el pipeline comercial, WhatsApp Business, automatizaciones y un Centro de Operaciones en tiempo real.

Principios rectores que atraviesan TODOS los documentos:

1. **Lead-céntrico**: la propiedad es un atributo del recorrido del cliente, nunca el centro.
2. **Tiempo de respuesta como métrica reina**: todo el diseño optimiza velocidad de respuesta y conversión.
3. **Simplicidad por rol**: el asesor ve solo lo necesario para trabajar hoy; el dueño ve el negocio completo.
4. **Explicabilidad**: toda automatización (score, asignación, alertas) debe poder explicar su porqué.
5. **IA solo operativa**: clasificar, responder, resumir, priorizar. Nunca generación/edición de imágenes.
6. **Multi-tenant, event-driven y modular desde el día 1**.

---

## 2. Estructura de archivos a generar

Todo se genera bajo `docs/`, en español, formato Markdown con diagramas Mermaid embebidos.

| # | Archivo | Contenido |
|---|---------|-----------|
| 0 | `docs/README.md` | Índice general navegable + resumen ejecutivo de 1 página |
| 1 | `docs/01-vision-y-propuesta-de-valor.md` | Visión del producto, propuesta de valor, posicionamiento, tesis "OS vs CRM" |
| 2 | `docs/02-benchmark.md` | Benchmark contra Tokko Broker, Zonaprop CRM, Properati/otros CRMs LATAM y players globales (Follow Up Boss, kvCORE) — matriz comparativa y brechas que RealEstate OS explota |
| 3 | `docs/03-personas-y-casos-de-uso.md` | Personas (Dueño, Gerente, Asesor + secundarias: cliente final, administrativo), jobs-to-be-done, casos de uso completos por rol |
| 4 | `docs/04-arquitectura-funcional.md` | Módulos del sistema, mapa funcional, flujos completos del negocio (lead → cierre), diagrama general de funcionamiento |
| 5 | `docs/05-arquitectura-tecnica.md` | Stack (Next.js, TS, PostgreSQL, Prisma, tRPC, WebSockets), arquitectura backend/frontend, event-driven, colas, capa de integraciones (puertos/adaptadores) |
| 6 | `docs/06-modelo-de-datos.md` | Entidades principales, relaciones (ERD Mermaid), esquema Prisma conceptual, estrategia de índices y particionado por tenant |
| 7 | `docs/07-multi-tenant-seguridad-rbac.md` | Estrategia multi-tenant (shared DB + tenantId + RLS), RBAC con matriz rol×permiso, auditoría, seguridad (OWASP, secretos, rate limiting) |
| 8 | `docs/08-apis.md` | Diseño de API: routers tRPC por módulo, contratos, webhooks entrantes (WhatsApp, portales), eventos WebSocket, versionado |
| 9 | `docs/09-modulos-clave.md` | Especificación profunda de los 5 módulos diferenciales: Centro de Operaciones, Lead Score explicable, Motor de automatizaciones/seguimientos, Distribución inteligente de leads, WhatsApp + Landing Pages con chat |
| 10 | `docs/10-roadmap.md` | Roadmap MVP (con criterio de corte estricto), V2, V3 — cada fase con alcance, criterios de éxito y qué queda explícitamente afuera |
| 11 | `docs/11-riesgos.md` | Riesgos técnicos (WhatsApp API, tiempo real, multi-tenancy) y comerciales (adopción, churn, competencia), con mitigaciones |
| 12 | `docs/12-infraestructura-y-escalabilidad.md` | Despliegue (Vercel + Postgres gestionado + workers), entornos, CI/CD, observabilidad, estrategia de escalabilidad |
| 13 | `docs/13-ux-ui-y-movil.md` | Recomendaciones UX/UI por rol, sistema de diseño (shadcn/ui), principios anti-sobrecarga, estrategia de app móvil futura |
| 14 | `docs/14-mejoras-propuestas.md` | Mejoras detectadas durante el diseño no pedidas en el brief, cada una con justificación de valor |

---

## 3. Decisiones de arquitectura ya tomadas (se desarrollarán en los docs)

Estas decisiones quedan fijadas para que la documentación sea coherente:

- **Multi-tenancy**: base de datos compartida con `tenantId` en cada tabla + Row Level Security de PostgreSQL como segunda línea de defensa. Aislamiento por schema/DB dedicada solo como opción enterprise futura.
- **API**: tRPC como capa principal (type-safety end-to-end). Webhooks REST solo para integraciones externas entrantes (WhatsApp Cloud API, portales).
- **Tiempo real**: WebSockets vía servicio dedicado (p. ej. Pusher/Ably o servidor WS propio en Node) publicando eventos del bus; el Centro de Operaciones es un consumidor de ese stream.
- **Event-driven**: patrón *transactional outbox* sobre PostgreSQL + workers para automatizaciones (seguimientos, reasignaciones, alertas, score). Sin Kafka en MVP.
- **WhatsApp**: WhatsApp Business Cloud API oficial (Meta) como camino principal; arquitectura de canal abstracta (`Channel` port) para soportar otros proveedores/BSPs.
- **Lead Score**: motor de reglas ponderadas configurable y 100% explicable (cada punto trazable a un factor). Sin ML opaco en MVP; el diseño deja el puerto para modelos futuros.
- **Auth**: Clerk (organizaciones nativas → mapean a tenants) con abstracción para migrar a Auth.js si hiciera falta.
- **Integraciones futuras**: arquitectura hexagonal (puertos y adaptadores) — cada integración (Tokko, Zonaprop, Google Calendar, firma electrónica…) es un adapter contra un puerto estable.
- **Frontend**: Next.js App Router, React Query + tRPC, shadcn/ui + Tailwind; una app con vistas por rol (no tres apps).

---

## 4. Fases de ejecución (cuando se dé la orden)

**Fase A — Producto** (docs 0–3): visión, benchmark, personas, casos de uso.
**Fase B — Arquitectura** (docs 4–8): funcional, técnica, datos, multi-tenant/seguridad, APIs.
**Fase C — Profundidad y plan** (docs 9–13): módulos clave, roadmap, riesgos, infra, UX/móvil.
**Fase D — Mejoras y consistencia** (doc 14 + pasada final): revisión cruzada de coherencia entre todos los documentos (entidades citadas = entidades del modelo, módulos del roadmap = módulos definidos, etc.) y actualización del índice.

Las fases se ejecutan en una sola corrida, en orden, usando agentes en paralelo donde los documentos son independientes.

---

## 5. Qué NO incluye esta ejecución

- Código de la aplicación (ni scaffolding, ni Prisma schema real, ni componentes).
- Integraciones reales ni claves de servicios.
- IA para imágenes/home staging (excluido por definición de producto).

El paso siguiente natural, después de aprobar la documentación, sería una segunda orden: *scaffolding del monorepo + schema Prisma + módulo Lead/Pipeline del MVP*.
