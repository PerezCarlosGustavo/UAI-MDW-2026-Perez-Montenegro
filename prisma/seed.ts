import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sin ids puestos a mano: cada registro se identifica por su campo único
// (nombre, documento, código de barras, email) y los ids los pone la base.
// Así el seed se puede correr las veces que haga falta sin pisar secuencias.

const categorias = [
  'BEBIDAS SIN ALCOHOL',
  'ALMACEN',
  'LIMPIEZA',
  'OTROS',
  'LACTEOS Y FIAMBRES',
  'BEBIDAS CON ALCOHOL',
  'GALLETITAS',
  'GOLOSINAS',
  'PERFUMERIA',
  'PANADERIA',
];

const productos = [
  {
    categoria: 'BEBIDAS SIN ALCOHOL',
    nombre: 'JUGO PRONTO NARANJA X 200ML',
    codigobarra: '7790036000565',
    preciolista: '700.00',
    stockactual: '10',
  },
  {
    categoria: 'BEBIDAS SIN ALCOHOL',
    nombre: 'GASEOSA MANAOS LIMA',
    codigobarra: '7798113300027',
    preciolista: '2500.00',
    stockactual: '15',
  },
  {
    categoria: 'ALMACEN',
    nombre: 'CALDOS PARA SABORIZAR LA VIRGINIA ALBAHACA Y AJO',
    codigobarra: '7790150437728',
    preciolista: '350.00',
    stockactual: '30',
  },
  {
    categoria: 'LACTEOS Y FIAMBRES',
    nombre: 'LECHE CHOCOLATADA ILOLAY',
    codigobarra: '7790787949670',
    preciolista: '2500.00',
    stockactual: '12',
  },
  {
    categoria: 'LIMPIEZA',
    nombre: 'LIMPIADOR PROCENEX LAVANDA',
    codigobarra: '7791130683524',
    preciolista: '280.00',
    stockactual: '20',
  },
];

async function main() {
  console.log('Iniciando seed...');

  const idPorCategoria = new Map<string, bigint>();

  for (const nombre of categorias) {
    const categoria = await prisma.categoria.upsert({
      where: { nombre },
      update: { activa: true },
      create: { nombre, activa: true },
    });
    idPorCategoria.set(nombre, categoria.id);
  }

  await prisma.cliente.upsert({
    where: { documento: '0' },
    update: { nombre: 'Consumidor Final', activo: true },
    create: {
      nombre: 'Consumidor Final',
      documento: '0',
      telefono: '0000000000',
      activo: true,
    },
  });

  await prisma.cliente.upsert({
    where: { documento: '30123456789' },
    update: { nombre: 'Cliente Demo', activo: true },
    create: {
      nombre: 'Cliente Demo',
      documento: '30123456789',
      telefono: '3415551234',
      activo: true,
    },
  });

  for (const producto of productos) {
    const categoriaid = idPorCategoria.get(producto.categoria);
    if (!categoriaid) throw new Error(`Falta la categoría ${producto.categoria}`);

    const datos = {
      categoriaid,
      nombre: producto.nombre,
      preciolista: new Prisma.Decimal(producto.preciolista),
      permitestock: true,
      stockactual: new Prisma.Decimal(producto.stockactual),
      activo: true,
    };

    await prisma.producto.upsert({
      where: { codigobarra: producto.codigobarra },
      update: datos,
      create: { ...datos, codigobarra: producto.codigobarra },
    });
  }

  // El ADMIN es una persona real que entra con Google. El mail va por
  // variable de entorno para no dejar un mail personal commiteado.
  // El resto de los usuarios se crean solos como PENDIENTE al loguearse y los aprueba un ADMIN.
  const emailAdmin = process.env.ADMIN_EMAIL;

  if (emailAdmin) {
    const admin = await prisma.usuario.upsert({
      where: { email: emailAdmin },
      update: { rol: 'ADMIN', activo: true },
      create: {
        email: emailAdmin,
        nombre: 'Administrador',
        usuario: emailAdmin,
        rol: 'ADMIN',
      },
    });
    console.log('Usuario ADMIN:', admin.email);
  } else {
    console.log('ADMIN_EMAIL no está definida: no se asignó ningún ADMIN.');
  }

  console.log('Seed finalizado correctamente');
}

main()
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
