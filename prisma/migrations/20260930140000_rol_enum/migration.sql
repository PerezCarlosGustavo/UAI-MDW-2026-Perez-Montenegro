-- Pasa usuario.rol de TEXT a un enum, y el default a PENDIENTE.
--
-- Lo escribimos a mano porque lo que genera Prisma hace DROP COLUMN + ADD
-- COLUMN, y eso pisaría el rol de todos los usuarios con el default.
-- Con USING se convierten los valores que ya están cargados (los usuarios
-- existentes siguen siendo VENDEDOR).

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR', 'PENDIENTE');

-- AlterTable
ALTER TABLE "usuario" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "usuario" ALTER COLUMN "rol" TYPE "Rol" USING ("rol"::"Rol");
ALTER TABLE "usuario" ALTER COLUMN "rol" SET DEFAULT 'PENDIENTE';
