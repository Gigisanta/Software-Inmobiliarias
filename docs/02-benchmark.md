# RealEstate OS — Benchmark Competitivo

> **Objetivo del documento:** entender honestamente contra quién competimos, dónde están las brechas reales del mercado, y qué pasa si el incumbente reacciona.

---

## 1. Panorama competitivo LATAM

El mercado no está vacío, pero está mal atendido: mucho software de **gestión de propiedades** y muy poco de **gestión de oportunidades y equipos**. Los jugadores se agrupan en tres capas.

### Capa 1 — Incumbentes verticales LATAM (los que hay que batir)

- **Tokko Broker (Argentina/LATAM):** el líder de facto en Argentina y buena parte de la región. CRM inmobiliario robusto, centrado en la **propiedad** y la **publicación multiportal**. Es el "sistema que ya tiene todo el mundo". Fuerte en carga de inmuebles, matching y difusión; débil en experiencia de uso, tiempo real y foco en el lead.
- **Wasi (Colombia/LATAM):** CRM inmobiliario cloud, popular en la región andina. Buen manejo de propiedades y sitio web incluido. Poco foco en velocidad de respuesta y automatización de leads.
- **InmoActive:** solución de gestión inmobiliaria orientada a administración y propiedades; interfaz clásica tipo CRM/ERP.

### Capa 2 — Portales con capa de CRM

- **Zonaprop / Navent CRM:** el portal domina la generación de demanda; su CRM asociado es una **capa liviana** para gestionar los leads que ellos mismos generan. El problema del portal: su interés es venderte visibilidad, no maximizar tu conversión interna. El CRM es un complemento, no el producto.
- **Properati:** más orientado a la generación de leads / marketplace que a la operación interna de la inmobiliaria. Data de mercado fuerte, gestión operativa débil.
- **Argenprop / MercadoLibre Inmuebles:** canales de demanda (fuentes de leads), no sistemas de gestión. Son **integraciones** para nosotros, no competidores directos de la capa operativa.

### Capa 3 — Globales genéricos o adaptados

- **Follow Up Boss (US):** referencia mundial en CRM inmobiliario **centrado en el lead** y la velocidad de respuesta. Es lo más cercano a nuestra filosofía, pero está pensado para el mercado US (MLS, IDX) y **no habla WhatsApp ni español rioplatense**. No está localizado para LATAM.
- **kvCORE / BoldTrail (US):** plataforma todo-en-uno (CRM + IDX + marketing). Potente pero pesada, cara y anclada al ecosistema US.
- **HubSpot adaptado:** CRM horizontal que algunas inmobiliarias fuerzan al rubro. Flexible pero genérico: no entiende el pipeline inmobiliario, requiere consultoría para configurarlo y termina siendo caro y sobredimensionado.

---

## 2. Matriz comparativa

Comparación por capacidad. **✅** = sólido y nativo · **🟡** = parcial / con fricción · **❌** = ausente o marginal.

| Capacidad | **RealEstate OS** | Tokko Broker | Zonaprop/Navent CRM | Properati | Wasi | InmoActive | Follow Up Boss | kvCORE | HubSpot adaptado |
|---|---|---|---|---|---|---|---|---|---|
| **Enfoque lead vs propiedad** | ✅ Lead | ❌ Propiedad | 🟡 Lead (del portal) | ❌ Propiedad | ❌ Propiedad | ❌ Propiedad | ✅ Lead | ✅ Lead | 🟡 Lead (genérico) |
| **WhatsApp nativo (por asesor)** | ✅ | 🟡 | 🟡 | ❌ | 🟡 | ❌ | ❌ | ❌ | 🟡 (add-on) |
| **Tiempo real (WebSockets)** | ✅ Torre de control | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 | 🟡 | 🟡 |
| **Motor de automatizaciones** | ✅ | 🟡 | ❌ | ❌ | 🟡 | ❌ | ✅ | ✅ | ✅ |
| **Lead scoring explicable** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 | ✅ | 🟡 |
| **Distribución + reasignación auto** | ✅ | 🟡 | 🟡 | ❌ | ❌ | ❌ | ✅ | ✅ | 🟡 |
| **Landing pages + chat inteligente** | ✅ | 🟡 | 🟡 | ❌ | 🟡 | ❌ | 🟡 | ✅ | 🟡 |
| **Multi-tenant / multisucursal** | ✅ | ✅ | ✅ | 🟡 | 🟡 | 🟡 | ✅ | ✅ | ✅ |
| **UX moderna (no tablas)** | ✅ | ❌ | 🟡 | 🟡 | 🟡 | ❌ | ✅ | 🟡 | 🟡 |
| **Localización LATAM / WhatsApp-first** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 |
| **Precio aprox. (referencia)** | Por asiento + piso sucursal (medio) | Medio, por plan/publicaciones | Atado a pauta del portal | Bajo/gratis (marketplace) | Bajo-medio | Medio | Alto (USD) | Muy alto (USD) | Alto (USD) |

> **Lectura de la matriz:** ningún jugador combina **foco en el lead + WhatsApp nativo + tiempo real + localización LATAM**. Los que tienen la filosofía correcta (Follow Up Boss, kvCORE) no están localizados ni hablan WhatsApp. Los que están localizados (Tokko, Wasi) están anclados a la propiedad y a UX vieja. **Ese cruce vacío es nuestra franja.**

---

## 3. Análisis específico de Tokko (el incumbente a batir)

Tokko es la referencia. Cualquier inmobiliaria argentina lo conoce o lo usa. Ganarles no es cuestión de features; es cuestión de **cambiar la pregunta que el software responde**.

### Fortalezas (reales, no las subestimemos)

- **Instalado y confiable.** Años en el mercado, marca conocida, el "nadie fue despedido por elegir Tokko" del rubro.
- **Gestión de propiedades y multiportal madura.** Cargás una vez y publicás en todos lados. Es su núcleo y lo hacen bien.
- **Ecosistema y red.** Integraciones con portales, comunidad de usuarios, soporte establecido.
- **Cobertura funcional amplia.** Cubre el ciclo de gestión inmobiliaria clásico de punta a punta.

### Debilidades (nuestra oportunidad)

- **Centrado en la propiedad, no en el lead.** El modelo mental es "administrar stock", no "convertir oportunidades". No responde la pregunta "¿a quién atiendo ahora?".
- **UX heredada, densa en tablas.** Pantallas cargadas, curva de aprendizaje alta, nada que un asesor quiera abrir a la mañana para saber qué hacer.
- **Sin tiempo real de verdad.** No hay torre de control viva; el dueño sigue dependiendo de reportes y reuniones.
- **WhatsApp y automatizaciones como agregados, no como columna vertebral.** El canal donde vive el cliente LATAM no es first-class.
- **Sin lead scoring explicable ni "oportunidades del día".** El asesor prioriza a ojo.

### Por qué es el incumbente a batir

Porque tiene **la distribución** (todos lo conocen) pero **no tiene la filosofía**. Su fortaleza — ser un sistema completo de gestión de propiedades — es exactamente lo que lo ata al paradigma viejo. Reposicionarse hacia el lead implicaría **canibalizar su propio producto y reescribir su UX**, cosa que los incumbentes casi nunca hacen a tiempo.

---

## 4. Brechas de mercado que RealEstate OS explota

1. **La brecha de la velocidad.** Nadie en LATAM está construido alrededor del "primer contacto en < 5 minutos" con reasignación automática. Es el punto donde más plata se pierde y donde menos software hay.
2. **La brecha del tiempo real.** El dueño no tiene forma de ver su negocio latir en vivo. Torre de control por WebSockets = categoría que hoy no ocupa nadie localmente.
3. **La brecha del WhatsApp-first.** Los globales con la filosofía correcta (Follow Up Boss, kvCORE) ignoran WhatsApp. Los locales lo tratan como agregado. El cliente LATAM **vive en WhatsApp**.
4. **La brecha de la UX.** El asesor odia abrir el CRM. Un panel diario simple con 🔥 Oportunidades del día es una diferencia de producto, no de marketing.
5. **La brecha de la priorización.** Lead scoring **explicable** (no caja negra) es raro incluso en los globales. Convierte data en acción.
6. **La brecha del modelo de datos.** Ser lead-céntrico de raíz (la propiedad como atributo del recorrido) no se puede parchear sobre un sistema propiedad-céntrico. Es una ventaja arquitectónica, no cosmética.

---

## 5. Posicionamiento diferencial

> **RealEstate OS es el sistema operativo lead-céntrico, WhatsApp-first y en tiempo real para inmobiliarias de LATAM. Donde Tokko administra propiedades, nosotros convertimos oportunidades.**

Ejes de posicionamiento frente a cada frente:

- **Vs. Tokko / Wasi (locales):** "No es otro CRM de propiedades. Es la torre de control de tu equipo y tus leads."
- **Vs. Zonaprop/Portales:** "El portal te trae el lead; nosotros hacemos que no lo pierdas."
- **Vs. Follow Up Boss / kvCORE (globales):** "La filosofía correcta, pero hecha para LATAM: en español, con WhatsApp nativo y precio local."
- **Vs. HubSpot adaptado:** "Ya entiende el negocio inmobiliario. No necesitás un consultor para configurarlo."

**Arquitectura como argumento comercial:** multi-tenant + event-driven + RBAC desde el día 1, y **arquitectura hexagonal** para integrar Tokko, Zonaprop, Argenprop, MercadoLibre Inmuebles, calendarios (Google/Outlook), Drive/Dropbox, firma electrónica, contabilidad, VoIP y WhatsApp Business API sin reescribir el core. Podemos **coexistir con Tokko** (importar desde él) mientras migramos al cliente — no lo forzamos a un corte de raíz.

---

## 6. Riesgos competitivos

Un benchmark honesto asume que el incumbente puede reaccionar.

### Riesgo 1 — Tokko copia los diferenciales

**Qué haría:** agregar un módulo de WhatsApp, un "dashboard en vivo" y automatizaciones sobre su producto actual.
**Por qué no nos mata:** son features pegadas sobre un modelo de datos propiedad-céntrico y una UX heredada. Copiar una feature es fácil; **reescribir la filosofía y la interfaz es caro y lento**. El dilema del innovador juega a nuestro favor. Nuestra defensa: velocidad de iteración y coherencia de producto de punta a punta.

### Riesgo 2 — Portales bundlean CRM gratis

**Qué harían:** Zonaprop/Navent regala su CRM con la pauta para retener al cliente en su ecosistema.
**Por qué no nos mata:** su incentivo es venderte visibilidad, no maximizar tu conversión interna. Un CRM "gratis y liviano" no reemplaza un OS operativo. Nuestra defensa: profundidad operativa y ROI medible (leads salvados), no competir por precio.

### Riesgo 3 — Un global se localiza

**Qué harían:** Follow Up Boss o kvCORE localizan a LATAM con WhatsApp y español.
**Por qué es el riesgo más serio:** ya tienen la filosofía correcta y músculo de producto. **Es el que más hay que vigilar.** Nuestra defensa: ventaja de tiempo (head start local), integraciones nativas con el ecosistema argentino (Tokko import, portales locales, firma electrónica local) y conocimiento de mercado que un jugador US tarda años en construir.

### Riesgo 4 — Fragmentación / "lo armo con Notion + WhatsApp + Excel"

**Qué harían:** inmobiliarias chicas resisten pagar y siguen con herramientas sueltas.
**Por qué no nos mata a largo plazo:** funciona hasta que el equipo crece o se pierde una operación grande. Nuestra defensa: **time-to-value bajo** y tier Starter accesible para entrar temprano y crecer con el cliente.

---

## 7. Conclusión

El mercado inmobiliario LATAM tiene un incumbente fuerte en distribución (Tokko) pero **débil en filosofía**, globales fuertes en filosofía pero **ausentes en localización**, y portales que **no quieren** resolver la conversión interna. Ese triángulo deja abierta exactamente la categoría que RealEstate OS ocupa: **el OS lead-céntrico, WhatsApp-first y en tiempo real para LATAM.**

La pelea no se gana con más features. Se gana **cambiando la pregunta** — de "¿qué stock tengo?" a "¿a quién atiendo ahora?" — y moviéndonos más rápido de lo que el incumbente puede reescribir su ADN.
