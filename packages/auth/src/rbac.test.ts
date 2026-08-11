import { describe, it, expect } from "vitest";
import { UserRole } from "@reos/core";
import { Permission, hasPermission, canSeeAllLeads } from "./rbac";

describe("RBAC — hasPermission", () => {
  it("OWNER y ADMIN tienen acceso total", () => {
    for (const perm of Object.values(Permission)) {
      expect(hasPermission(UserRole.OWNER, perm)).toBe(true);
      expect(hasPermission(UserRole.ADMIN, perm)).toBe(true);
    }
  });

  it("MANAGER gestiona la operación pero no la configuración del tenant", () => {
    expect(hasPermission(UserRole.MANAGER, Permission.LEAD_DELETE)).toBe(true);
    expect(hasPermission(UserRole.MANAGER, Permission.LEAD_READ_ALL)).toBe(true);
    expect(hasPermission(UserRole.MANAGER, Permission.TENANT_MANAGE)).toBe(false);
    expect(hasPermission(UserRole.MANAGER, Permission.USER_MANAGE)).toBe(false);
  });

  it("ADVISOR solo puede lo básico de su trabajo", () => {
    expect(hasPermission(UserRole.ADVISOR, Permission.LEAD_READ)).toBe(true);
    expect(hasPermission(UserRole.ADVISOR, Permission.LEAD_CREATE)).toBe(true);
    expect(hasPermission(UserRole.ADVISOR, Permission.LEAD_DELETE)).toBe(false);
    expect(hasPermission(UserRole.ADVISOR, Permission.LEAD_READ_ALL)).toBe(false);
    expect(hasPermission(UserRole.ADVISOR, Permission.USER_READ)).toBe(false);
    expect(hasPermission(UserRole.ADVISOR, Permission.TENANT_MANAGE)).toBe(false);
  });
});

describe("RBAC — canSeeAllLeads", () => {
  it("dueño, admin y gerente ven todos los leads del tenant", () => {
    expect(canSeeAllLeads(UserRole.OWNER)).toBe(true);
    expect(canSeeAllLeads(UserRole.ADMIN)).toBe(true);
    expect(canSeeAllLeads(UserRole.MANAGER)).toBe(true);
  });

  it("el asesor solo ve los leads propios", () => {
    expect(canSeeAllLeads(UserRole.ADVISOR)).toBe(false);
  });
});
