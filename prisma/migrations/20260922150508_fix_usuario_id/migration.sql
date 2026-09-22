/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
CREATE SEQUENCE usuario_id_seq;
ALTER TABLE "usuario" RENAME CONSTRAINT "pk_usuario" TO "usuario_pkey",
ADD COLUMN     "email" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT nextval('usuario_id_seq');
ALTER SEQUENCE usuario_id_seq OWNED BY "usuario"."id";

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- RenameIndex
ALTER INDEX "uq_usuario_usuario" RENAME TO "usuario_usuario_key";
