export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  unitPricePiasters: number;
  compareAtPiasters: number | null;
  quantity: number;
  imageUrl: string;
  stock: number;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}
