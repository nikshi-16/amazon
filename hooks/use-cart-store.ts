import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cart, OrderItem } from '@/types'
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  deliveryDateIndex: undefined,
}

interface CartState {
  cart: Cart
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => void
  removeItem: (item: OrderItem) => void
  init: () => void
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,

      addItem: async (item: OrderItem, quantity: number) => {
        const { items } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (existItem) {
          if (existItem.countInStock < quantity + existItem.quantity) {
            throw new Error('Not enough items in stock')
          }
        } else {
          if (item.countInStock < item.quantity) {
            throw new Error('Not enough items in stock')
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
              x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
                ? { ...existItem, quantity: existItem.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
            })),
          },
        })

        return updatedCartItems.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )?.clientId!
      },

      // ✅ Added updateItem function
      updateItem: (item: OrderItem, quantity: number) => {
        set((state) => {
          const updatedItems = state.cart.items.map((cartItem) =>
            cartItem.clientId === item.clientId
              ? { ...cartItem, quantity }
              : cartItem
          )

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
              itemsPrice: updatedItems.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0
              ),
            },
          }
        })
      },

      removeItem: (item: OrderItem) => {
        set((state) => {
          const updatedItems = state.cart.items.filter(
            (cartItem) => cartItem.clientId !== item.clientId
          )

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
              itemsPrice: updatedItems.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0
              ),
            },
          }
        })
      },

      init: () => set({ cart: initialState }),
    }),
    {
      name: 'cart-store',
    }
  )
)

export default useCartStore
