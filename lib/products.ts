export type ProductCategory = "camisa" | "bone" | "moletom";
export type Product = {
  id: number;
  name: string;
  price: number;
  color: string;
  image: string;
  category: ProductCategory;
  featured: boolean;
  stock: Record<Size, number>;
};
export type ProductImage = { id: number | string; imageUrl: string };

const EMPTY_STOCK: Record<Size, number> = { P: 0, M: 0, G: 0, GG: 0, EXG: 0 };

export const PRODUCTS: Product[] = [
  {
    "id": 1,
    "name": "Forma 01 — White",
    "price": 189,
    "color": "Branco",
    "image": "/products/product-1.webp",
    "category": "camisa",
    "featured": true,
    "stock": { ...EMPTY_STOCK }
  },
  {
    "id": 2,
    "name": "Forma 02 — Ink",
    "price": 189,
    "color": "Preto",
    "image": "/products/product-2.webp",
    "category": "camisa",
    "featured": true,
    "stock": { ...EMPTY_STOCK }
  },
  {
    "id": 3,
    "name": "Forma 03 — Ash",
    "price": 199,
    "color": "Cinza",
    "image": "/products/product-3.webp",
    "category": "camisa",
    "featured": true,
    "stock": { ...EMPTY_STOCK }
  },
  {
    "id": 4,
    "name": "Forma 04 — Field",
    "price": 199,
    "color": "Verde militar",
    "image": "/products/product-4.webp",
    "category": "camisa",
    "featured": true,
    "stock": { ...EMPTY_STOCK }
  },
  {
    "id": 5,
    "name": "Forma 05 — Poster",
    "price": 219,
    "color": "Branco",
    "image": "/products/product-5.webp",
    "category": "camisa",
    "featured": true,
    "stock": { ...EMPTY_STOCK }
  },
  {
    "id": 6,
    "name": "Forma 06 — Backprint",
    "price": 219,
    "color": "Preto",
    "image": "/products/product-6.webp",
    "category": "camisa",
    "featured": true,
    "stock": { ...EMPTY_STOCK }
  }
];

export const SIZES = ['P','M','G','GG','EXG'] as const;
export type Size = typeof SIZES[number];
