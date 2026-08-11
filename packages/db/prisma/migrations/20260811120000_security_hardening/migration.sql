-- Endurecimiento de seguridad: bloqueo de cuenta e invalidación de sesión.
-- Añade a la tabla de usuarios los campos para defenderse de fuerza bruta
-- y para revocar sesiones al cambiar la contraseña.

ALTER TABLE "users"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
