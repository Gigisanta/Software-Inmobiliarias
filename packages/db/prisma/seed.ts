/**
 * Seed de desarrollo: inmobiliaria demo con equipo, pipeline y leads de ejemplo.
 * Idempotente por `slug` de tenant y `(tenantId, key)` de etapas / `(tenantId, email)` de usuarios.
 *
 * Ejecutar: pnpm db:seed
 */
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
    upsertUser(tenant.id, branch.id, "dueno@demo.com", "Roberto", "Álvarez", UserRole.OWNER),
    upsertUser(tenant.id, branch.id, "gerente@demo.com", "Carla", "Méndez", UserRole.MANAGER),
    upsertUser(tenant.id, branch.id, "asesor@demo.com", "Nicolás", "Ferrari", UserRole.ADVISOR),
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

  // 5) Propiedades
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

  // 6) Leads de ejemplo (limpio los previos del tenant para reproducibilidad)
  await prisma.lead.deleteMany({ where: { tenantId: tenant.id } });

  await createLead({
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

  const counts = {
    usuarios: await prisma.user.count({ where: { tenantId: tenant.id } }),
    etapas: await prisma.pipelineStage.count({ where: { tenantId: tenant.id } }),
    propiedades: await prisma.property.count({ where: { tenantId: tenant.id } }),
    leads: await prisma.lead.count({ where: { tenantId: tenant.id } }),
  };

  console.log("✅ Seed completo:", counts);
  console.log(`   Tenant: ${tenant.name} (${tenant.slug}) · id=${tenant.id}`);
  console.log(`   Usuarios: dueno@demo.com / gerente@demo.com / asesor@demo.com`);
}

function upsertUser(
  tenantId: string,
  branchId: string,
  email: string,
  firstName: string,
  lastName: string,
  role: UserRole,
) {
  return prisma.user.upsert({
    where: { tenantId_email: { tenantId, email } },
    update: { firstName, lastName, role, branchId },
    create: { tenantId, branchId, email, firstName, lastName, role },
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
}

async function createLead(a: CreateLeadArgs) {
  const scored = computeLeadScore(a.scoreInput);
  const lead = await prisma.lead.create({
    data: {
      tenantId: a.tenantId,
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
