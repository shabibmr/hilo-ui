'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, Product, ProductVariant } from '../data/types';
import { commerceRepository } from '../data/providers';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  initializeCart: () => Promise<void>;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isOpen: false,
      isLoading: false,
      error: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      clearCart: () => set({ cart: null, error: null }),

      initializeCart: async () => {
        const { cart } = get();
        if (cart?.id) {
          try {
            const hydrated = await commerceRepository.hydrateCart(cart);
            set({ cart: hydrated });
          } catch (error) {
            console.error('Could not refresh basket:', error);
          }
          return;
        }
        const newCart = await commerceRepository.createCart();
        set({ cart: newCart });
      },

      addItem: async (product: Product, variant?: ProductVariant, quantity = 1) => {
        set({ isLoading: true, error: null });
        try {
          let { cart } = get();
          if (!cart?.id) {
            cart = await commerceRepository.createCart();
          } else {
            cart = await commerceRepository.hydrateCart(cart);
          }

          const targetVariant = variant || product.variants[0];
          const updatedCart = await commerceRepository.addCartLine(
            cart.id,
            product.id,
            targetVariant.id,
            quantity,
            cart
          );

          set({ cart: updatedCart, isOpen: true, isLoading: false });
        } catch (error) {
          console.error('Error adding item to cart:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Could not add this item.',
          });
        }
      },

      updateQuantity: async (lineId: string, quantity: number) => {
        const { cart } = get();
        if (!cart?.id) return;

        set({ isLoading: true, error: null });
        try {
          const originalLine = cart.lines.find((line) => line.id === lineId);
          const hydrated = await commerceRepository.hydrateCart(cart);
          const line = hydrated.lines.find((entry) => entry.id === lineId) ??
            (originalLine && hydrated.lines.find((entry) =>
              entry.product.id === originalLine.product.id &&
              entry.variant.id === originalLine.variant.id
            ));
          if (!line) {
            set({ cart: hydrated, isLoading: false });
            return;
          }
          const updatedCart = await commerceRepository.updateCartLine(hydrated.id, line.id, quantity);
          set({ cart: updatedCart, isLoading: false });
        } catch (error) {
          console.error('Error updating cart quantity:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Could not update the basket.',
          });
        }
      },

      removeItem: async (lineId: string) => {
        const { cart } = get();
        if (!cart?.id) return;

        set({ isLoading: true, error: null });
        try {
          const originalLine = cart.lines.find((line) => line.id === lineId);
          const hydrated = await commerceRepository.hydrateCart(cart);
          const line = hydrated.lines.find((entry) => entry.id === lineId) ??
            (originalLine && hydrated.lines.find((entry) =>
              entry.product.id === originalLine.product.id &&
              entry.variant.id === originalLine.variant.id
            ));
          if (!line) {
            set({ cart: hydrated, isLoading: false });
            return;
          }
          const updatedCart = await commerceRepository.removeCartLine(hydrated.id, line.id);
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
