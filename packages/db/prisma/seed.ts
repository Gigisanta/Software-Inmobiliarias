/**
 * Seed de desarrollo: inmobiliaria demo con equipo, pipeline y leads de ejemplo.
 * Idempotente por `slug` de tenant y `(tenantId, key)` de etapas / `(tenantId, email)` de usuarios.
 *
 * Ejecutar: pnpm db:seed
 */
import { randomBytes, scryptSync } from "node:crypto";
import { prisma, Prisma } from "../src/index";
import {
  DEFAULT_PIPELINE,
  PipelineStageKey,
  UserRole,
  LeadChannel,
  OperationType,
  PropertyType,
  FinancingType,
  computeLeadScore,
  type LeadScoreInput,
} from "@reos/core";

const TENANT_SLUG = "inmobiliaria-demo";

/**
 * Hash scrypt idéntico al de @reos/auth (`scrypt$salt$hash`). Se replica acá para
 * que el seed no dependa del paquete de auth en tiempo de ejecución.
 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

async function main() {
  console.log("🌱 Sembrando datos de RealEstate OS…");

  // 1) Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: {},
    create: {
      name: "Inmobiliaria Demo",
      slug: TENANT_SLUG,
      status: "ACTIVE",
      plan: "PRO",
    },
  });

  // 2) Sucursal
  const branch = await prisma.branch.upsert({
    where: { id: `${tenant.id}-central` },
    update: {},
    create: {
      id: `${tenant.id}-central`,
      tenantId: tenant.id,
      name: "Casa Central",
      address: "Av. Corrientes 1234, CABA",
    },
  });

  // 3) Usuarios
  const [owner, manager, advisor] = await Promise.all([
    upsertUser(tenant.id, branch.id, "dueno@demo.com", "Roberto", "Álvarez", UserRole.OWNER, "demo1234"),
    upsertUser(tenant.id, branch.id, "gerente@demo.com", "Carla", "Méndez", UserRole.MANAGER, "demo1234"),
    upsertUser(tenant.id, branch.id, "asesor@demo.com", "Nicolás", "Ferrari", UserRole.ADVISOR, "demo1234"),
  ]);

  // 4) Pipeline por defecto
  const stages = new Map<PipelineStageKey, string>();
  for (const def of DEFAULT_PIPELINE) {
    const stage = await prisma.pipelineStage.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: def.key } },
      update: { name: def.name, order: def.order, probability: def.defaultProbability, isWon: def.isWon, isLost: def.isLost },
      create: {
        tenantId: tenant.id,
        key: def.key,
        name: def.name,
        order: def.order,
        probability: def.defaultProbability,
        isWon: def.isWon,
        isLost: def.isLost,
      },
    });
    stages.set(def.key, stage.id);
  }

  // 5) Propiedades (limpio las previas del tenant para no duplicar en cada corrida)
  await prisma.property.deleteMany({ where: { tenantId: tenant.id } });
  const prop1 = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      title: "Depto 2 amb. con balcón · Palermo",
      operationType: OperationType.VENTA,
      propertyType: PropertyType.DEPARTAMENTO,
      status: "PUBLICADA",
      price: new Prisma.Decimal(145000),
      currency: "USD",
      neighborhood: "Palermo",
      city: "CABA",
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      areaM2: 48,
    },
  });
  const prop2 = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      title: "Casa 4 amb. con patio · Caballito",
      operationType: OperationType.VENTA,
      propertyType: PropertyType.CASA,
      status: "PUBLICADA",
      price: new Prisma.Decimal(320000),
      currency: "USD",
      neighborhood: "Caballito",
      city: "CABA",
      rooms: 4,
      bedrooms: 3,
      bathrooms: 2,
      areaM2: 120,
    },
  });

  const prop3 = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      title: "Casa 3 amb. · Calle Belgrano",
      operationType: OperationType.VENTA,
      propertyType: PropertyType.CASA,
      status: "PUBLICADA",
      price: new Prisma.Decimal(210000),
      currency: "USD",
      neighborhood: "Belgrano R",
      city: "CABA",
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      areaM2: 95,
    },
  });
  const prop4 = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      title: "Departamento 2 amb. · Centro",
      operationType: OperationType.VENTA,
      propertyType: PropertyType.DEPARTAMENTO,
      status: "PUBLICADA",
      price: new Prisma.Decimal(98000),
      currency: "USD",
      neighborhood: "San Nicolás",
      city: "CABA",
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      areaM2: 42,
    },
  });

  // 6) Leads de ejemplo (limpio los previos del tenant para reproducibilidad)
  await prisma.appointment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.task.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.lead.deleteMany({ where: { tenantId: tenant.id } });

  const maria = await createLead({
    tenantId: tenant.id,
    stageId: stages.get(PipelineStageKey.VISITA_REALIZADA)!,
    stageKey: PipelineStageKey.VISITA_REALIZADA,
    assignedToId: advisor.id,
    branchId: branch.id,
    firstName: "María",
    lastName: "Gómez",
    phone: "+5491133334444",
    channel: LeadChannel.WHATSAPP,
    operationType: OperationType.COMPRA,
    budgetMin: 120000,
    budgetMax: 160000,
    neighborhoods: ["Palermo", "Villa Crespo"],
    propertyType: PropertyType.DEPARTAMENTO,
    financing: FinancingType.CREDITO_HIPOTECARIO,
    propertyIds: [prop1.id],
    scoreInput: {
      daysSinceFirstContact: 6,
      daysSinceLastActivity: 0,
      conversationCount: 7,
      propertiesViewed: 3,
      visitsCompleted: 1,
      hasBudget: true,
      hasDocuments: true,
      stageProbability: 55,
      avgResponseMinutes: 12,
    },
  });

  await createLead({
    tenantId: tenant.id,
    stageId: stages.get(PipelineStageKey.PRIMER_CONTACTO)!,
    stageKey: PipelineStageKey.PRIMER_CONTACTO,
    assignedToId: advisor.id,
    branchId: branch.id,
    firstName: "Jorge",
    lastName: "Ledesma",
    phone: "+5491155556666",
    channel: LeadChannel.LANDING,
    operationType: OperationType.ALQUILER,
    budgetMin: 300,
    budgetMax: 500,
    neighborhoods: ["Caballito"],
    propertyType: PropertyType.CASA,
    financing: FinancingType.CONTADO,
    propertyIds: [prop2.id],
    scoreInput: {
      daysSinceFirstContact: 2,
      daysSinceLastActivity: 1,
      conversationCount: 2,
      propertiesViewed: 1,
      visitsCompleted: 0,
      hasBudget: true,
      hasDocuments: false,
      stageProbability: 10,
      avgResponseMinutes: 40,
    },
  });

  await createLead({
    tenantId: tenant.id,
    stageId: stages.get(PipelineStageKey.NUEVO_LEAD)!,
    stageKey: PipelineStageKey.NUEVO_LEAD,
    assignedToId: null,
    branchId: branch.id,
    firstName: "Lucía",
    lastName: "Paz",
    phone: "+5491177778888",
    channel: LeadChannel.WHATSAPP,
    operationType: OperationType.COMPRA,
    neighborhoods: ["Belgrano"],
    propertyType: PropertyType.DEPARTAMENTO,
    financing: FinancingType.A_DEFINIR,
    propertyIds: [],
    scoreInput: {
      daysSinceFirstContact: 0,
      daysSinceLastActivity: 0,
      conversationCount: 1,
      propertiesViewed: 0,
      visitsCompleted: 0,
      hasBudget: false,
      hasDocuments: false,
      stageProbability: 5,
      avgResponseMinutes: null,
    },
  });

  // Leads con historia: sin seguimiento hace días (para "Seguimientos pendientes")
  // y operaciones avanzadas (para "Operaciones activas").
  const juan = await createLead({
    tenantId: tenant.id,
    stageId: stages.get(PipelineStageKey.INTERESADO)!,
    stageKey: PipelineStageKey.INTERESADO,
    assignedToId: advisor.id,
    branchId: branch.id,
    firstName: "Juan",
    lastName: "Pérez",
    phone: "+5491144445555",
    channel: LeadChannel.PORTAL,
    operationType: OperationType.COMPRA,
    budgetMin: 80000,
    budgetMax: 110000,
    neighborhoods: ["San Nicolás", "Monserrat"],
    propertyType: PropertyType.DEPARTAMENTO,
    financing: FinancingType.CONTADO,
    propertyIds: [prop4.id],
    daysWithoutActivity: 5,
    scoreInput: {
      daysSinceFirstContact: 12,
      daysSinceLastActivity: 5,
      conversationCount: 4,
      propertiesViewed: 2,
      visitsCompleted: 0,
      hasBudget: true,
      hasDocuments: false,
      stageProbability: 25,
      avgResponseMinutes: 60,
    },
  });

  const valentina = await createLead({
    tenantId: tenant.id,
    stageId: stages.get(PipelineStageKey.NEGOCIACION)!,
    stageKey: PipelineStageKey.NEGOCIACION,
    assignedToId: manager.id,
    branchId: branch.id,
    firstName: "Valentina",
    lastName: "Ríos",
    phone: "+5491166667777",
    channel: LeadChannel.REFERIDO,
    operationType: OperationType.COMPRA,
    budgetMin: 90000,
    budgetMax: 100000,
    neighborhoods: ["San Nicolás"],
    propertyType: PropertyType.DEPARTAMENTO,
    financing: FinancingType.CREDITO_HIPOTECARIO,
    propertyIds: [prop4.id],
    scoreInput: {
      daysSinceFirstContact: 20,
      daysSinceLastActivity: 1,
      conversationCount: 12,
      propertiesViewed: 4,
      visitsCompleted: 2,
      hasBudget: true,
      hasDocuments: true,
      stageProbability: 60,
      avgResponseMinutes: 15,
    },
  });

  const fernando = await createLead({
    tenantId: tenant.id,
    stageId: stages.get(PipelineStageKey.RESERVA)!,
    stageKey: PipelineStageKey.RESERVA,
    assignedToId: advisor.id,
    branchId: branch.id,
    firstName: "Fernando",
    lastName: "Acosta",
    phone: "+5491188889999",
    channel: LeadChannel.WHATSAPP,
    operationType: OperationType.COMPRA,
    budgetMin: 190000,
    budgetMax: 215000,
    neighborhoods: ["Belgrano R", "Coghlan"],
    propertyType: PropertyType.CASA,
    financing: FinancingType.CONTADO,
    propertyIds: [prop3.id],
    scoreInput: {
      daysSinceFirstContact: 35,
      daysSinceLastActivity: 0,
      conversationCount: 18,
      propertiesViewed: 5,
      visitsCompleted: 3,
      hasBudget: true,
      hasDocuments: true,
      stageProbability: 80,
      avgResponseMinutes: 10,
    },
  });

  // 7) Agenda: visitas y llamadas próximas (hoy y mañana).
  const today1530 = new Date();
  today1530.setHours(15, 30, 0, 0);
  const tomorrow1100 = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow1100.setHours(11, 0, 0, 0);
  const tomorrow1730 = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow1730.setHours(17, 30, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        tenantId: tenant.id,
        leadId: maria.id,
        propertyId: prop1.id,
        type: "VISITA",
        status: "CONFIRMADA",
        scheduledAt: today1530,
        durationMinutes: 45,
        assignedToId: advisor.id,
        notes: "Segunda visita: quiere ver el balcón de tarde.",
      },
      {
        tenantId: tenant.id,
        leadId: fernando.id,
        propertyId: prop3.id,
        type: "REUNION",
        status: "AGENDADA",
        scheduledAt: tomorrow1100,
        durationMinutes: 60,
        assignedToId: advisor.id,
        notes: "Firma de reserva en la oficina.",
      },
      {
        tenantId: tenant.id,
        leadId: valentina.id,
        propertyId: prop4.id,
        type: "LLAMADA",
        status: "AGENDADA",
        scheduledAt: tomorrow1730,
        durationMinutes: 30,
        assignedToId: manager.id,
        notes: "Revisión de contraoferta con el propietario.",
      },
    ],
  });

  // 8) Tareas de ejemplo.
  await prisma.task.createMany({
    data: [
      {
        tenantId: tenant.id,
        leadId: juan.id,
        title: "Llamar a Juan Pérez — retomar seguimiento",
        status: "PENDIENTE",
        priority: "ALTA",
        dueAt: new Date(),
        assignedToId: advisor.id,
        createdById: manager.id,
      },
      {
        tenantId: tenant.id,
        leadId: fernando.id,
        title: "Enviar documentación de reserva — Casa Belgrano",
        status: "EN_PROGRESO",
        priority: "URGENTE",
        dueAt: tomorrow1100,
        assignedToId: advisor.id,
        createdById: advisor.id,
      },
    ],
  });

  // 9) Workspace real de prueba para el cliente (Ceci).
  await seedClientWorkspace();

  const counts = {
    usuarios: await prisma.user.count({ where: { tenantId: tenant.id } }),
    etapas: await prisma.pipelineStage.count({ where: { tenantId: tenant.id } }),
    propiedades: await prisma.property.count({ where: { tenantId: tenant.id } }),
    leads: await prisma.lead.count({ where: { tenantId: tenant.id } }),
    citas: await prisma.appointment.count({ where: { tenantId: tenant.id } }),
    tareas: await prisma.task.count({ where: { tenantId: tenant.id } }),
  };

  console.log("✅ Seed completo:", counts);
  console.log(`   Tenant demo: ${tenant.name} (${tenant.slug}) · id=${tenant.id}`);
  console.log(`   Login demo: dueno@demo.com / gerente@demo.com / asesor@demo.com  (contraseña: demo1234)`);
}

/**
 * Crea el espacio de trabajo real para el cliente que va a probar el plan Básico.
 * Tenant propio, login con credenciales, pipeline y unos pocos leads de ejemplo
 * (que puede borrar y reemplazar por los suyos).
 */
async function seedClientWorkspace() {
  const CLIENT_SLUG = "inmobiliaria-ceci";
  const CLIENT_EMAIL = "ceci@crm.com";
  const CLIENT_PASSWORD = "ceci1234";
  const CLIENT_NAME = "Antelo Negocios Inmobiliarios";
  const CLIENT_BRAND = "#5C7D5C"; // verde forest de la marca Antelo

  const clientTenant = await prisma.tenant.upsert({
    where: { slug: CLIENT_SLUG },
    update: { name: CLIENT_NAME, brandColor: CLIENT_BRAND, status: "ACTIVE", plan: "STARTER" },
    create: {
      name: CLIENT_NAME,
      slug: CLIENT_SLUG,
      status: "ACTIVE",
      plan: "STARTER",
      brandColor: CLIENT_BRAND,
    },
  });

  const clientBranch = await prisma.branch.upsert({
    where: { id: `${clientTenant.id}-central` },
    update: {},
    create: {
      id: `${clientTenant.id}-central`,
      tenantId: clientTenant.id,
      name: "Oficina Neuquén",
    },
  });

  const ceci = await upsertUser(
    clientTenant.id,
    clientBranch.id,
    CLIENT_EMAIL,
    "Ceci",
    "Antelo",
    UserRole.OWNER,
    CLIENT_PASSWORD,
  );

  // Pipeline por defecto.
  const stages = new Map<PipelineStageKey, string>();
  for (const def of DEFAULT_PIPELINE) {
    const stage = await prisma.pipelineStage.upsert({
      where: { tenantId_key: { tenantId: clientTenant.id, key: def.key } },
      update: { name: def.name, order: def.order, probability: def.defaultProbability, isWon: def.isWon, isLost: def.isLost },
      create: {
        tenantId: clientTenant.id,
        key: def.key,
        name: def.name,
        order: def.order,
        probability: def.defaultProbability,
        isWon: def.isWon,
        isLost: def.isLost,
      },
    });
    stages.set(def.key, stage.id);
  }

  // Propiedad + leads de ejemplo (idempotente: limpio los previos).
  await prisma.appointment.deleteMany({ where: { tenantId: clientTenant.id } });
  await prisma.task.deleteMany({ where: { tenantId: clientTenant.id } });
  await prisma.lead.deleteMany({ where: { tenantId: clientTenant.id } });
  await prisma.property.deleteMany({ where: { tenantId: clientTenant.id } });

  const prop = await prisma.property.create({
    data: {
      tenantId: clientTenant.id,
      title: "Departamento 2 amb. apto profesional · Centro de Neuquén",
      operationType: OperationType.VENTA,
      propertyType: PropertyType.DEPARTAMENTO,
      status: "PUBLICADA",
      price: new Prisma.Decimal(89000),
      currency: "USD",
      neighborhood: "Área Centro Este",
      city: "Neuquén",
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      areaM2: 52,
    },
  });

  const propLote = await prisma.property.create({
    data: {
      tenantId: clientTenant.id,
      title: "Lote 360 m² escriturado · Primaterra",
      operationType: OperationType.VENTA,
      propertyType: PropertyType.TERRENO,
      status: "PUBLICADA",
      price: new Prisma.Decimal(32000),
      currency: "USD",
      neighborhood: "Primaterra",
      city: "Neuquén",
      areaM2: 360,
    },
  });

  const sofia = await createLead({
    tenantId: clientTenant.id,
    stageId: stages.get(PipelineStageKey.INTERESADO)!,
    stageKey: PipelineStageKey.INTERESADO,
    assignedToId: ceci.id,
    branchId: clientBranch.id,
    firstName: "Sofía",
    lastName: "Herrera",
    phone: "+5492991122334",
    channel: LeadChannel.WHATSAPP,
    operationType: OperationType.COMPRA,
    budgetMin: 80000,
    budgetMax: 95000,
    neighborhoods: ["Área Centro Este", "Área Centro Sur"],
    propertyType: PropertyType.DEPARTAMENTO,
    financing: FinancingType.CREDITO_HIPOTECARIO,
    propertyIds: [prop.id],
    scoreInput: {
      daysSinceFirstContact: 3,
      daysSinceLastActivity: 0,
      conversationCount: 5,
      propertiesViewed: 2,
      visitsCompleted: 0,
      hasBudget: true,
      hasDocuments: false,
      stageProbability: 25,
      avgResponseMinutes: 18,
    },
  });

  await createLead({
    tenantId: clientTenant.id,
    stageId: stages.get(PipelineStageKey.NUEVO_LEAD)!,
    stageKey: PipelineStageKey.NUEVO_LEAD,
    assignedToId: null,
    branchId: clientBranch.id,
    firstName: "Martín",
    lastName: "Quiroga",
    phone: "+5492994455667",
    channel: LeadChannel.PORTAL,
    operationType: OperationType.ALQUILER,
    budgetMin: 250,
    budgetMax: 400,
    neighborhoods: ["Confluencia", "Barrio Nordeste"],
    propertyType: PropertyType.DEPARTAMENTO,
    financing: FinancingType.CONTADO,
    propertyIds: [],
    scoreInput: {
      daysSinceFirstContact: 0,
      daysSinceLastActivity: 0,
      conversationCount: 1,
      propertiesViewed: 0,
      visitsCompleted: 0,
      hasBudget: true,
      hasDocuments: false,
      stageProbability: 5,
      avgResponseMinutes: null,
    },
  });

  const lucas = await createLead({
    tenantId: clientTenant.id,
    stageId: stages.get(PipelineStageKey.NEGOCIACION)!,
    stageKey: PipelineStageKey.NEGOCIACION,
    assignedToId: ceci.id,
    branchId: clientBranch.id,
    firstName: "Lucas",
    lastName: "Bravo",
    phone: "+5492997788990",
    channel: LeadChannel.REFERIDO,
    operationType: OperationType.COMPRA,
    budgetMin: 28000,
    budgetMax: 35000,
    neighborhoods: ["Primaterra"],
    propertyType: PropertyType.TERRENO,
    financing: FinancingType.CONTADO,
    propertyIds: [propLote.id],
    daysWithoutActivity: 4,
    scoreInput: {
      daysSinceFirstContact: 15,
      daysSinceLastActivity: 4,
      conversationCount: 9,
      propertiesViewed: 3,
      visitsCompleted: 1,
      hasBudget: true,
      hasDocuments: true,
      stageProbability: 60,
      avgResponseMinutes: 14,
    },
  });

  const soon = new Date();
  soon.setHours(soon.getHours() + 3, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      tenantId: clientTenant.id,
      leadId: sofia.id,
      propertyId: prop.id,
      type: "VISITA",
      status: "AGENDADA",
      scheduledAt: soon,
      durationMinutes: 45,
      assignedToId: ceci.id,
      notes: "Primera visita al depto del centro de Neuquén.",
    },
  });

  await prisma.task.create({
    data: {
      tenantId: clientTenant.id,
      leadId: lucas.id,
      title: "Llamar a Lucas Bravo para cerrar la contraoferta",
      status: "PENDIENTE",
      priority: "ALTA",
      dueAt: new Date(),
      assignedToId: ceci.id,
      createdById: ceci.id,
    },
  });

  console.log(`   Tenant cliente: ${clientTenant.name} (${clientTenant.slug}) · marca ${CLIENT_BRAND}`);
  console.log(`   Login cliente: ${CLIENT_EMAIL}  (contraseña: ${CLIENT_PASSWORD})`);
}

function upsertUser(
  tenantId: string,
  branchId: string,
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole,
  password?: string,
) {
  const passwordHash = password ? hashPassword(password) : undefined;
  return prisma.user.upsert({
    where: { tenantId_email: { tenantId, email } },
    update: { firstName, lastName, role, branchId, ...(passwordHash ? { passwordHash } : {}) },
    create: { tenantId, branchId, email, firstName, lastName, role, passwordHash },
  });
}

interface CreateLeadArgs {
  tenantId: string;
  stageId: string;
  stageKey: PipelineStageKey;
  assignedToId: string | null;
  branchId: string;
  firstName: string;
  lastName: string;
  phone: string;
  channel: LeadChannel;
  operationType: OperationType;
  budgetMin?: number;
  budgetMax?: number;
  neighborhoods: string[];
  propertyType: PropertyType;
  financing: FinancingType;
  propertyIds: string[];
  scoreInput: LeadScoreInput;
  /** Retro-fecha lastActivityAt para simular leads olvidados (seguimientos). */
  daysWithoutActivity?: number;
}

async function createLead(a: CreateLeadArgs) {
  const scored = computeLeadScore(a.scoreInput);
  const lastActivityAt =
    a.daysWithoutActivity != null
      ? new Date(Date.now() - a.daysWithoutActivity * 24 * 60 * 60 * 1000)
      : new Date();
  const lead = await prisma.lead.create({
    data: {
      tenantId: a.tenantId,
      lastActivityAt,
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone,
      channel: a.channel,
      operationType: a.operationType,
      budgetMin: a.budgetMin != null ? new Prisma.Decimal(a.budgetMin) : null,
      budgetMax: a.budgetMax != null ? new Prisma.Decimal(a.budgetMax) : null,
      preferredNeighborhoods: a.neighborhoods,
      propertyType: a.propertyType,
      financing: a.financing,
      currentStageId: a.stageId,
      assignedToId: a.assignedToId,
      assignedAt: a.assignedToId ? new Date() : null,
      branchId: a.branchId,
      firstContactAt: a.channel === LeadChannel.MANUAL ? null : new Date(),
      score: scored.score,
      scoreBand: scored.band,
      scoreFactors: scored.factors as unknown as Prisma.InputJsonValue,
      scoreUpdatedAt: new Date(),
      stageHistory: {
        create: {
          tenantId: a.tenantId,
          toStageId: a.stageId,
          toStageKey: a.stageKey,
          changedById: a.assignedToId,
        },
      },
      propertyInterests: {
        create: a.propertyIds.map((propertyId) => ({ tenantId: a.tenantId, propertyId })),
      },
    },
  });
  return lead;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error en el seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
