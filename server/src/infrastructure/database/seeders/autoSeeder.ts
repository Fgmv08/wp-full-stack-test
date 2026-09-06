import { AppDataSource } from '../AppDataSource';
import { UserEntity } from '../entities/UserEntity';
import { ProductEntity } from '../entities/ProductEntity';

const DEFAULT_USER = {
  firstName: 'Frank',
  lastName: 'Muriel',
  email: 'frank.muriel@techshop.co',
  phone: '+573042030331',
  idType: 'CC',
  idNumber: '1011590183',
};

const DEFAULT_PRODUCTS = [
  {
    name: 'Sony WH-1000XM5 Auriculares Inalámbricos',
    description: 'Auriculares con cancelación de ruido líder de la industria, hasta 30 horas de batería y conectividad Bluetooth 5.2.',
    priceCents: 89900000, // $899.000 COP
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=500&auto=format&fit=crop',
    category: 'auriculares',
  },
  {
    name: 'Apple AirPods Pro 2da Gen',
    description: 'Auriculares in-ear con cancelación activa de ruido, modo transparencia y audio espacial personalizado.',
    priceCents: 110000000, // $1.100.000 COP
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=500&auto=format&fit=crop',
    category: 'auriculares',
  },
  {
    name: 'Cable USB-C a USB-C 2m PD 100W',
    description: 'Cable de carga rápida con Power Delivery de 100W, trenzado de nylon, compatible con todos los dispositivos USB-C.',
    priceCents: 4900000, // $49.000 COP
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',
    category: 'cables',
  },
  {
    name: 'Cable HDMI 2.1 8K 3m',
    description: 'Cable HDMI ultra alta velocidad 48Gbps para resolución 8K@60Hz y 4K@120Hz, ideal para gaming y streaming.',
    priceCents: 8900000, // $89.000 COP
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop',
    category: 'cables',
  },
  {
    name: 'Logitech MX Master 3S Mouse',
    description: 'Mouse ergonómico premium con rueda MagSpeed electromagnética, sensor de 8000 DPI y botón silencioso.',
    priceCents: 39900000, // $399.000 COP
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop',
    category: 'mouse',
  },
  {
    name: 'Razer DeathAdder V3 Mouse Gaming',
    description: 'Mouse gaming ultraligero de 59g con sensor Focus Pro de 30.000 DPI y switches ópticos de 90M clics.',
    priceCents: 44900000, // $449.000 COP
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1623820919239-0d0ff10797a1?w=500&auto=format&fit=crop',
    category: 'mouse',
  },
  {
    name: 'Samsung 980 Pro SSD NVMe 1TB',
    description: 'SSD PCIe Gen 4.0 con velocidades de lectura de hasta 7.000 MB/s. Ideal para gaming y cargas de trabajo profesionales.',
    priceCents: 59900000, // $599.000 COP
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop',
    category: 'almacenamiento',
  },
  {
    name: 'Kingston DDR5 32GB 5200MHz RAM',
    description: 'Módulo de memoria DDR5 de alto rendimiento, 32GB con latencia CL40, compatible con Intel 12th/13th Gen y AMD Ryzen 7000.',
    priceCents: 34900000, // $349.000 COP
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop',
    category: 'componentes',
  },
  {
    name: 'Webcam Logitech C922 Pro 1080p',
    description: 'Cámara web Full HD 1080p/30fps y 720p/60fps con enfoque automático y corrección de iluminación por IA.',
    priceCents: 29900000, // $299.000 COP
    stock: 28,
    imageUrl: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=500&auto=format&fit=crop',
    category: 'perifericos',
  },
  {
    name: 'Teclado Mecánico Keychron K2 v2',
    description: 'Teclado mecánico compacto 75% con switches Gateron Red, retroiluminación RGB y compatibilidad Mac/Windows.',
    priceCents: 54900000, // $549.000 COP
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop',
    category: 'perifericos',
  },  
  {
    name: 'Cargador Rápido Anker GaN 65W',
    description: 'Cargador de pared compacto con tecnología GaN, 2 puertos USB-C y 1 puerto USB-A. Carga rápida para laptop y smartphone.',
    priceCents: 16900000, // $169.000 COP
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop',
    category: 'accesorios',
  },
  {
    name: 'Base Refrigerante para Laptop Targus',
    description: 'Soporte ergonómico con doble ventilador silencioso, alimentación por USB y ajuste de inclinación de 4 posiciones.',
    priceCents: 12900000, // $129.000 COP
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop',
    category: 'accesorios',
  },
  {
    name: 'Micrófono USB Shure MV7 Podcast',
    description: 'Micrófono dinámico profesional con salidas USB y XLR, panel táctil de control y tecnología de aislamiento de voz.',
    priceCents: 125000000, // $1.250.000 COP
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop',
    category: 'perifericos',
  },
];

export async function runAutoSeed(): Promise<void> {
  try {
    const userRepo = AppDataSource.getRepository(UserEntity);
    const productRepo = AppDataSource.getRepository(ProductEntity);

    // 1. Seed user if not existing
    const existingUser = await userRepo.findOneBy({ email: DEFAULT_USER.email });
    if (!existingUser) {
      await userRepo.save(userRepo.create(DEFAULT_USER));
      console.log('✅ Default user seeded automatically');
    }

    // 2. Check product count
    const productCount = await productRepo.count();
    if (productCount === 0) {
      await productRepo.save(productRepo.create(DEFAULT_PRODUCTS as Partial<ProductEntity>[]));
      console.log(`✅ Seeded ${DEFAULT_PRODUCTS.length} initial products into empty database`);
    } else {
      console.log(`ℹ️  Database contains ${productCount} products. Skipping seed.`);
    }
  } catch (error) {
    console.error('⚠️ Auto-seed check failed:', error);
  }
}
