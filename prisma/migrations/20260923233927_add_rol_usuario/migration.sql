/*
  Warnings:

  - Made the column `email` on table `usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
CREATE SEQUENCE categoria_id_seq;
ALTER TABLE "categoria" ALTER COLUMN "id" SET DEFAULT nextval('categoria_id_seq');
ALTER SEQUENCE categoria_id_seq OWNED BY "categoria"."id";

-- AlterTable
CREATE SEQUENCE cliente_id_seq;
ALTER TABLE "cliente" ALTER COLUMN "id" SET DEFAULT nextval('cliente_id_seq');
ALTER SEQUENCE cliente_id_seq OWNED BY "cliente"."id";

-- AlterTable
CREATE SEQUENCE cuentacorriente_id_seq;
ALTER TABLE "cuentacorriente" ALTER COLUMN "id" SET DEFAULT nextval('cuentacorriente_id_seq');
ALTER SEQUENCE cuentacorriente_id_seq OWNED BY "cuentacorriente"."id";

-- AlterTable
CREATE SEQUENCE cuentacorrientemovimiento_id_seq;
ALTER TABLE "cuentacorrientemovimiento" ALTER COLUMN "id" SET DEFAULT nextval('cuentacorrientemovimiento_id_seq');
ALTER SEQUENCE cuentacorrientemovimiento_id_seq OWNED BY "cuentacorrientemovimiento"."id";

-- AlterTable
CREATE SEQUENCE detalleventa_id_seq;
ALTER TABLE "detalleventa" ALTER COLUMN "id" SET DEFAULT nextval('detalleventa_id_seq');
ALTER SEQUENCE detalleventa_id_seq OWNED BY "detalleventa"."id";

-- AlterTable
CREATE SEQUENCE producto_id_seq;
ALTER TABLE "producto" ALTER COLUMN "id" SET DEFAULT nextval('producto_id_seq');
ALTER SEQUENCE producto_id_seq OWNED BY "producto"."id";

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'VENDEDOR',
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
CREATE SEQUENCE venta_id_seq;
ALTER TABLE "venta" ADD COLUMN     "idComprobante" VARCHAR(50),
ALTER COLUMN "id" SET DEFAULT nextval('venta_id_seq');
ALTER SEQUENCE venta_id_seq OWNED BY "venta"."id";
