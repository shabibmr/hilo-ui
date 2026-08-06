'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, Product, ProductVariant } from '../data/types';
import { commerceRepository } from '../data/providers';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  initializeCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isOpen: false,
      isLoading: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      initializeCart: async () => {
        const { cart } = get();
        if (cart?.id) {
          await commerceRepository.hydrateCart(cart);
          return;
        }
        const newCart = await commerceRepository.createCart();
        set({ cart: newCart });
      },

      addItem: async (product: Product, variant?: ProductVariant, quantity = 1) => {
        set({ isLoading: true });
        try {
          let { cart } = get();
          if (!cart?.id) {
            cart = await commerceRepository.createCart();
          } else {
            await commerceRepository.hydrateCart(cart);
          }

          const targetVariant = variant || product.variants[0];
          const updatedCart = await commerceRepository.addCartLine(
            cart.id,
            product.id,
            targetVariant.id,
            quantity
          );

          set({ cart: updatedCart, isOpen: true, isLoading: false });
        } catch (error) {
          console.error('Error adding item to cart:', error);
          set({ isLoading: false });
        }
      },

      updateQuantity: async (lineId: string, quantity: number) => {
        const { cart } = get();
        if (!cart?.id) return;

        set({ isLoading: true });
        try {
          await commerceRepository.hydrateCart(cart);
          const updatedCart = await commerceRepository.updateCartLine(cart.id, lineId, quantity);
          set({ cart: updatedCart, isLoading: false });
        } catch (error) {
          console.error('Error updating cart quantity:', error);
          set({ isLoading: false });
        }
      },

      removeItem: async (lineId: string) => {
        const { cart } = get();
        if (!cart?.id) return;

        set({ isLoading: true });
        try {
          await commerceRepository.hydrateCart(cart);
          const updatedCart = await commerceRepository.removeCartLine(cart.id, lineId);
          set({ cart: updatedCart, isLoading: false });
        } catch (error) {
          console.error('Error removing cart item:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'hilo-arte-cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
