# RealEstate OS — Documentación de Producto y Arquitectura

> **El Sistema Operativo para Inmobiliarias.** Una plataforma multi-tenant centrada en el **lead**, no en la propiedad, diseñada para responder más rápido, no perder clientes, automatizar seguimientos y darle al dueño visibilidad total del negocio en tiempo real.

---

## Resumen ejecutivo (1 página)

**Qué es.** RealEstate OS no es otro CRM inmobiliario. Es un *sistema operativo comercial*: el lugar donde ocurre toda la operación de una inmobiliaria — conversaciones, oportunidades, equipos y decisiones — con la propiedad tratada como un simple atributo del recorrido del cliente.

**El problema.** Las inmobiliarias pierden ventas por lentitud de respuesta, seguimientos que nunca ocurren, leads que se enfrían sin que nadie lo note y dueños que no tienen idea de qué pasa en su negocio hasta fin de mes. Los CRMs tradicionales (Tokko y similares) están centrados en la propiedad y en tablas: administran inventario, no conversaciones.

**La tesis.** Quien gane el mercado inmobiliario de LATAM en los próximos 10 años no será el mejor administrador de propiedades, sino el mejor administrador de **conversaciones, oportunidades y equipos comerciales**. RealEstate OS se construye entero alrededor del ciclo de vida del lead y del tiempo de respuesta.

**Los cinco diferenciales:**

1. **Centro de Operaciones** — una torre de control en tiempo real (WebSockets), no un dashboard. La pantalla que el dueño deja abierta todo el día.
2. **Lead Score explicable + 🔥 Oportunidades del día** — priorización automática que siempre explica *por qué* y sugiere la próxima acción.
3. **Motor de automatizaciones y seguimientos** — el sistema detecta cuándo hay que hacer seguimiento y lo hace (o lo propone) solo.
4. **Distribución inteligente de leads** — asignación por reglas (carga, zona, rendimiento, horario) con reasignación automática si nadie responde a tiempo.
5. **WhatsApp Business + Landing Pages con chat inteligente** — cada asesor conecta su número; la IA responde, clasifica, crea el lead y agenda visitas.

**Cómo está construido.** Next.js + TypeScript + PostgreSQL + Prisma + tRPC + WebSockets. Multi-tenant, event-driven y modular desde el día 1. RBAC, auditoría y arquitectura hexagonal preparada para integrar Tokko, portales, calendarios y firma electrónica sin reescribir el núcleo.

**Qué NO es.** No es un clon de Tokko, no es una interfaz llena de tablas, no usa IA para retocar fotos ni hacer home staging. La IA es exclusivamente operativa: responde, clasifica, resume, prioriza y ahorra tiempo.

---

## Índice de documentos

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Visión y Propuesta de Valor](01-vision-y-propuesta-de-valor.md) | Visión, propuesta de valor, posicionamiento, tesis "OS vs CRM" |
| 02 | [Benchmark](02-benchmark.md) | Comparativa contra Tokko, Zonaprop CRM y CRMs globales |
| 03 | [Personas y Casos de Uso](03-personas-y-casos-de-uso.md) | Personas, jobs-to-be-done y casos de uso por rol |
| 04 | [Arquitectura Funcional](04-arquitectura-funcional.md) | Módulos, mapa funcional, flujos de negocio, diagrama general |
| 05 | [Arquitectura Técnica](05-arquitectura-tecnica.md) | Stack, backend, frontend, event-driven, integraciones |
| 06 | [Modelo de Datos](06-modelo-de-datos.md) | Entidades, relaciones (ERD), esquema Prisma conceptual |
| 07 | [Multi-Tenant, Seguridad y RBAC](07-multi-tenant-seguridad-rbac.md) | Aislamiento de tenants, RBAC, auditoría, seguridad |
| 08 | [APIs](08-apis.md) | Routers tRPC, webhooks, eventos WebSocket, versionado |
| 09 | [Módulos Clave](09-modulos-clave.md) | Los 5 módulos diferenciales en profundidad |
| 10 | [Roadmap MVP / V2 / V3](10-roadmap.md) | Alcance por fase y criterios de corte |
| 11 | [Riesgos](11-riesgos.md) | Riesgos técnicos y comerciales con mitigaciones |
| 12 | [Infraestructura y Escalabilidad](12-infraestructura-y-escalabilidad.md) | Despliegue, CI/CD, observabilidad, escalabilidad |
| 13 | [UX/UI y App Móvil](13-ux-ui-y-movil.md) | Recomendaciones UX/UI por rol y estrategia móvil |
| 14 | [Mejoras Propuestas](14-mejoras-propuestas.md) | Mejoras detectadas durante el diseño, justificadas |

---

## Cómo leer esta documentación

- **Si sos el dueño/decisor de negocio:** empezá por 01, 02, 03 y 10.
- **Si sos inversor o evaluás el producto:** 01, 02, 09 y 11.
- **Si sos técnico/arquitecto:** 05, 06, 07, 08 y 12.
- **Si sos diseñador/producto:** 03, 04, 09 y 13.

Todos los documentos están en español, con diagramas Mermaid embebidos. Para verlos renderizados, abrí el visor local (`npm run docs` o el visor incluido en la raíz del proyecto).
