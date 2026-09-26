import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  const categorias = [
    { id: 1n, nombre: 'BEBIDAS SIN ALCOHOL', activa: true },
    { id: 2n, nombre: 'ALMACEN', activa: true },
    { id: 3n, nombre: 'LIMPIEZA', activa: true },
    { id: 4n, nombre: 'OTROS', activa: true },
    { id: 5n, nombre: 'LACTEOS Y FIAMBRES', activa: true },
    { id: 6n, nombre: 'BEBIDAS CON ALCOHOL', activa: true },
    { id: 7n, nombre: 'GALLETITAS', activa: true },
    { id: 8n, nombre: 'GOLOSINAS', activa: true },
    { id: 9n, nombre: 'PERFUMERIA', activa: true },
    { id: 10n, nombre: 'PANADERIA', activa: true },
  ];

  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: { id: categoria.id },
      update: {
        nombre: categoria.nombre,
        activa: categoria.activa,
      },
      create: categoria,
    });
  }

  const usuarioAdmin = await prisma.usuario.upsert({
    where: { id: 1n },
    update: {
      nombre: 'Administrador',
      usuario: 'admin',
      email: 'admin@local.test',
      activo: true,
    },
    create: {
      id: 1n,
      nombre: 'Administrador',
      usuario: 'admin',
      email: 'admin@local.test',
      activo: true,
    },
  });

  await prisma.cliente.upsert({
    where: { id: 1n },
    update: {
      nombre: 'Consumidor Final',
      documento: '0',
      telefono: '0000000000',
      activo: true,
    },
    create: {
      id: 1n,
      nombre: 'Consumidor Final',
      documento: '0',
      telefono: '0000000000',
      activo: true,
    },
  });

  const productos = [
    {
      id: 1n,
      categoriaid: 1n,
      nombre: 'JUGO PRONTO NARANJA X 200ML',
      codigobarra: '7790036000565',
      preciolista: new Prisma.Decimal('700.00'),
      permitestock: true,
      stockactual: new Prisma.Decimal('10'),
      activo: true,
    },
    {
      id: 2n,
      categoriaid: 1n,
      nombre: 'GASEOSA MANAOS LIMA',
      codigobarra: '7798113300027',
      preciolista: new Prisma.Decimal('2500.00'),
      permitestock: true,
      stockactual: new Prisma.Decimal('15'),
      activo: true,
    },
    {
      id: 3n,
      categoriaid: 2n,
      nombre: 'CALDOS PARA SABORIZAR LA VIRGINIA ALBAHACA Y AJO',
      codigobarra: '7790150437728',
      preciolista: new Prisma.Decimal('350.00'),
      permitestock: true,
      stockactual: new Prisma.Decimal('30'),
      activo: true,
    },
    {
      id: 4n,
      categoriaid: 5n,
      nombre: 'LECHE CHOCOLATADA ILOLAY',
      codigobarra: '7790787949670',
      preciolista: new Prisma.Decimal('2500.00'),
      permitestock: true,
      stockactual: new Prisma.Decimal('12'),
      activo: true,
    },
    {
      id: 5n,
      categoriaid: 3n,
      nombre: 'LIMPIADOR PROCENEX LAVANDA',
      codigobarra: '7791130683524',
      preciolista: new Prisma.Decimal('280.00'),
      permitestock: true,
      stockactual: new Prisma.Decimal('20'),
      activo: true,
    },
  ];

  for (const producto of productos) {
    await prisma.producto.upsert({
      where: { id: producto.id },
      update: {
        categoriaid: producto.categoriaid,
        nombre: producto.nombre,
        codigobarra: producto.codigobarra,
        preciolista: producto.preciolista,
        permitestock: producto.permitestock,
        stockactual: producto.stockactual,
        activo: producto.activo,
      },
      create: producto,
    });
  }

  console.log('Seed finalizado correctamente');
  console.log('Usuario creado:', usuarioAdmin.usuario);
}

main()
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
