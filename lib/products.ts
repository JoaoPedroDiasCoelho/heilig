export type ProductCategory = "camisa" | "bone" | "moletom";
export type Product = {
  id: number;
  name: string;
  price: number;
  color: string;
  image: string;
  category: ProductCategory;
  featured: boolean;
};
export type ProductImage = { id: number | string; imageUrl: string };

export const PRODUCTS: Product[] = [
  {
    "id": 1,
    "name": "Forma 01 — White",
    "price": 189,
    "color": "Branco",
    "image": "/products/product-1.webp",
    "category": "camisa",
    "featured": true
  },
  {
    "id": 2,
    "name": "Forma 02 — Ink",
    "price": 189,
    "color": "Preto",
    "image": "/products/product-2.webp",
    "category": "camisa",
    "featured": true
  },
  {
    "id": 3,
    "name": "Forma 03 — Ash",
    "price": 199,
    "color": "Cinza",
    "image": "/products/product-3.webp",
    "category": "camisa",
    "featured": true
  },
  {
    "id": 4,
    "name": "Forma 04 — Field",
    "price": 199,
    "color": "Verde militar",
    "image": "/products/product-4.webp",
    "category": "camisa",
    "featured": true
  },
  {
    "id": 5,
    "name": "Forma 05 — Poster",
    "price": 219,
    "color": "Branco",
    "image": "/products/product-5.webp",
    "category": "camisa",
    "featured": true
  },
  {
    "id": 6,
    "name": "Forma 06 — Backprint",
    "price": 219,
    "color": "Preto",
    "image": "/products/product-6.webp",
    "category": "camisa",
    "featured": true
  }
];

export const SIZES = ['P','M','G','GG','EXG'] as const;
export type Size = typeof SIZES[number];
