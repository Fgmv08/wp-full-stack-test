import 'reflect-metadata';
import { AppDataSource } from './AppDataSource';
import { UserEntity } from './entities/UserEntity';
import { ProductEntity } from './entities/ProductEntity';

const FIXED_USER = {
  firstName: 'Carlos',
  lastName: 'Mendoza',
  email: 'carlos.mendoza@techshop.co',
  phone: '+573001234567',
  idType: 'CC',
  idNumber: '1023456789',
};

const PRODUCTS = [
  {
    name: 'Sony WH-1000XM5 Auriculares Inalámbricos',
    description: 'Auriculares con cancelación de ruido líder de la industria, hasta 30 horas de batería y conectividad Bluetooth 5.2.',
    priceCents: 89900000,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400',
    category: 'auriculares',
  },
  {
    name: 'Apple AirPods Pro 2da Gen',
    description: 'Auriculares in-ear con cancelación activa de ruido, modo transparencia y audio espacial personalizado.',
    priceCents: 110000000,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=400',
    category: 'auriculares',
  },
  {
    name: 'Cable USB-C a USB-C 2m PD 100W',
    description: 'Cable de carga rápida con Power Delivery de 100W, trenzado de nylon, compatible con todos los dispositivos USB-C.',
    priceCents: 4900000,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    category: 'cables',
  },
  {
    name: 'Cable HDMI 2.1 8K 3m',
    description: 'Cable HDMI ultra alta velocidad 48Gbps para resolución 8K@60Hz y 4K@120Hz, ideal para gaming y streaming.',
    priceCents: 8900000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
    category: 'cables',
  },
  {
    name: 'Logitech MX Master 3S Mouse',
    description: 'Mouse ergonómico premium con rueda MagSpeed electromagnética, sensor de 8000 DPI y botón silencioso.',
    priceCents: 39900000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    category: 'mouse',
  },
  {
    name: 'Razer DeathAdder V3 Mouse Gaming',
    description: 'Mouse gaming ultraligero de 59g con sensor Focus Pro de 30.000 DPI y switches ópticos de 90M clics.',
    priceCents: 44900000,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1623820919239-0d0ff10797a1?w=400',
    category: 'mouse',
  },
  {
    name: 'Samsung 980 Pro SSD NVMe 1TB',
    description: 'SSD PCIe Gen 4.0 con velocidades de lectura de hasta 7.000 MB/s. Ideal para gaming y cargas de trabajo profesionales.',
    priceCents: 59900000,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
    category: 'almacenamiento',
  },
  {
    name: 'Kingston DDR5 32GB 5200MHz RAM',
    description: 'Módulo de memoria DDR5 de alto rendimiento, 32GB con latencia CL40, compatible con Intel 12th/13th Gen y AMD Ryzen 7000.',
    priceCents: 34900000,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400',
    category: 'componentes',
  },
  {
    name: 'Hub USB-C 7 en 1 Anker',
    description: 'Hub multipuerto con HDMI 4K, 2x USB-A 3.0, USB-C PD 100W, lector SD/microSD y puerto Ethernet Gigabit.',
    priceCents: 19900000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    category: 'accesorios',
  },
  {
    name: 'Webcam Logitech C922 Pro 1080p',
    description: 'Cámara web Full HD 1080p/30fps y 720p/60fps con enfoque automático y corrección de iluminación por IA.',
    priceCents: 29900000,
    stock: 28,
    imageUrl: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=400',
    category: 'perifericos',
  },
  {
    name: 'Teclado Mecánico Keychron K2 v2',
    description: 'Teclado mecánico compacto 75% con switches Gateron Red, retroiluminación RGB y compatibilidad Mac/Windows.',
    priceCents: 54900000,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400',
    category: 'perifericos',
  },
  {
    name: 'Monitor Portátil AOC 15.6" 144Hz',
    description: 'Monitor IPS portátil Full HD 144Hz con conexión USB-C, compatible con laptops, consolas y smartphones.',
    priceCents: 79900000,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a573d5f5f9?w=400',
    category: 'monitores',
  },
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const productRepo = AppDataSource.getRepository(ProductEntity);

  // Seed user (idempotent)
  const existingUser = await userRepo.findOneBy({ email: FIXED_USER.email });
  if (!existingUser) {
    await userRepo.save(userRepo.create(FIXED_USER));
    console.log('✅ User seeded');
  } else {
    console.log('ℹ️  User already exists, skipping');
  }

  // Seed products (idempotent)
  const existingCount = await productRepo.count();
  if (existingCount === 0) {
    await productRepo.save(productRepo.create(PRODUCTS as Partial<ProductEntity>[]));
    console.log(`✅ ${PRODUCTS.length} products seeded`);
  } else {
    console.log(`ℹ️  ${existingCount} products already exist, skipping`);
  }

  await AppDataSource.destroy();
  console.log('✅ Seed complete');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
