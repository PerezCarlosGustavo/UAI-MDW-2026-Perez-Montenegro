-- Pasa usuario.rol de TEXT a un enum.
--
-- Lo escribimos a mano porque lo que genera Prisma hace DROP COLUMN + ADD
-- COLUMN, y eso pisaría el rol de todos los usuarios con el default.
-- Con USING se convierten los valores que ya están cargados.

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR');

-- AlterTable
ALTER TABLE "usuario" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "usuario" ALTER COLUMN "rol" TYPE "Rol" USING ("rol"::"Rol");
ALTER TABLE "usuario" ALTER COLUMN "rol" SET DEFAULT 'VENDEDOR';
