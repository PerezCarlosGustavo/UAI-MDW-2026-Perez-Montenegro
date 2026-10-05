-- CreateTable
CREATE TABLE "categoria" (
    "id" BIGINT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_categoria" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" BIGINT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "documento" VARCHAR(30),
    "telefono" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_cliente" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentacorriente" (
    "id" BIGINT NOT NULL,
    "clienteid" BIGINT NOT NULL,

    CONSTRAINT "pk_cuentacorriente" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentacorrientemovimiento" (
    "id" BIGINT NOT NULL,
    "cuentacorrienteid" BIGINT NOT NULL,
    "ventaid" BIGINT,
    "productoid" BIGINT,
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3),
    "importe" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "pk_cuentacorrientemovimiento" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalleventa" (
    "id" BIGINT NOT NULL,
    "ventaid" BIGINT NOT NULL,
    "productoid" BIGINT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "preciounitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "pk_detalleventa" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto" (
    "id" BIGINT NOT NULL,
    "categoriaid" BIGINT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "codigobarra" VARCHAR(50),
    "preciolista" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "permitestock" BOOLEAN NOT NULL DEFAULT true,
    "stockactual" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_producto" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" BIGINT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "usuario" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pk_usuario" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta" (
    "id" BIGINT NOT NULL,
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteid" BIGINT,
    "usuarioid" BIGINT NOT NULL,
    "tipopago" INTEGER NOT NULL,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "pk_venta" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_categoria_nombre" ON "categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cliente_documento" ON "cliente"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cuentacorriente_cliente" ON "cuentacorriente"("clienteid");

-- CreateIndex
CREATE INDEX "ix_ccm_cuentacorrienteid" ON "cuentacorrientemovimiento"("cuentacorrienteid");

-- CreateIndex
CREATE INDEX "ix_ccm_fecha" ON "cuentacorrientemovimiento"("fecha");

-- CreateIndex
CREATE INDEX "ix_ccm_productoid" ON "cuentacorrientemovimiento"("productoid");

-- CreateIndex
CREATE INDEX "ix_ccm_ventaid" ON "cuentacorrientemovimiento"("ventaid");

-- CreateIndex
CREATE INDEX "ix_detalleventa_productoid" ON "detalleventa"("productoid");

-- CreateIndex
CREATE INDEX "ix_detalleventa_ventaid" ON "detalleventa"("ventaid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_producto_codigobarra" ON "producto"("codigobarra");

-- CreateIndex
CREATE INDEX "ix_producto_categoriaid" ON "producto"("categoriaid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuario_usuario" ON "usuario"("usuario");

-- CreateIndex
CREATE INDEX "ix_venta_clienteid" ON "venta"("clienteid");

-- CreateIndex
CREATE INDEX "ix_venta_fecha" ON "venta"("fecha");

-- CreateIndex
CREATE INDEX "ix_venta_usuarioid" ON "venta"("usuarioid");

-- AddForeignKey
ALTER TABLE "cuentacorriente" ADD CONSTRAINT "fk_cuentacorriente_cliente" FOREIGN KEY ("clienteid") REFERENCES "cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuentacorrientemovimiento" ADD CONSTRAINT "fk_ccm_cuentacorriente" FOREIGN KEY ("cuentacorrienteid") REFERENCES "cuentacorriente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuentacorrientemovimiento" ADD CONSTRAINT "fk_ccm_producto" FOREIGN KEY ("productoid") REFERENCES "producto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cuentacorrientemovimiento" ADD CONSTRAINT "fk_ccm_venta" FOREIGN KEY ("ventaid") REFERENCES "venta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalleventa" ADD CONSTRAINT "fk_detalleventa_producto" FOREIGN KEY ("productoid") REFERENCES "producto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalleventa" ADD CONSTRAINT "fk_detalleventa_venta" FOREIGN KEY ("ventaid") REFERENCES "venta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "fk_producto_categoria" FOREIGN KEY ("categoriaid") REFERENCES "categoria"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "fk_venta_cliente" FOREIGN KEY ("clienteid") REFERENCES "cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "fk_venta_usuario" FOREIGN KEY ("usuarioid") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
