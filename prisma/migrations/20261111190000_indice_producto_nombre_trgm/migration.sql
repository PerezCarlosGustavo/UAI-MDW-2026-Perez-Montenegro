-- Acelera las búsquedas por fragmentos de nombre, sin distinguir mayúsculas.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "ix_producto_nombre_trgm"
ON "producto" USING GIN ("nombre" gin_trgm_ops);
