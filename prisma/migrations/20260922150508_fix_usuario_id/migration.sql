/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `usuario` will be added.
*/

-- Create sequence
CREATE SEQUENCE usuario_id_seq;

-- Rename primary key constraint
ALTER TABLE "usuario"
RENAME CONSTRAINT "pk_usuario" TO "usuario_pkey";

-- Add email as nullable because schema.prisma uses String?
ALTER TABLE "usuario"
ADD COLUMN "email" TEXT;

-- Configure id sequence
ALTER TABLE "usuario"
ALTER COLUMN "id" SET DEFAULT nextval('usuario_id_seq');

ALTER SEQUENCE usuario_id_seq OWNED BY "usuario"."id";

-- Create unique index
CREATE UNIQUE INDEX "usuario_email_key"
ON "usuario"("email");

-- Rename existing index
ALTER INDEX "uq_usuario_usuario"
RENAME TO "usuario_usuario_key";