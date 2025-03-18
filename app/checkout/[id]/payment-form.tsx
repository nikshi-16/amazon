'use client'
import { toast } from 'sonner'

import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { Card, CardContent } from '@/components/ui/card'
import { approvePayPalOrder, createPayPalOrder } from '@/lib/actions/order.actions'
import { IOrder } from '@/lib/db/models/order.model'
import { formatDateTime } from '@/lib/utils'
import CheckoutFooter from '../checkout-footer'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ProductPrice from '@/components/shared/product/product-price'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import StripeForm from './stripe-form'

export default function OrderPaymentForm({
  order,
  paypalClientId,
  clientSecret,
}:{
order: IOrder
paypalClientId:string
isAdmin:boolean
clientSecret: string | null
}){
  const router = useRouter()
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    expectedDeliveryDate,
    isPaid,
  } = order

  useEffect(() => {
    if (isPaid) {
      router.push(`/account/orders/${order._id}`)
    }
  }, [isPaid, router, order._id])

  function PrintLoadingState() {
    const [{ isPending, isRejected }] = usePayPalScriptReducer()
    let status = ''
    if (isPending) {
      status = 'Loading PayPal...'
    } else if (isRejected) {
      status = 'Error in loading PayPal.'
    }
    return status
  }

  const handleCreatePayPalOrder = async () => {
    try {
      const res = await createPayPalOrder(order._id)
      if (!res?.success) throw new Error(res?.message || 'Failed to create PayPal order.')
      return res.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Error creating PayPal order.')
      }
    }
  }

  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    try {
      const res = await approvePayPalOrder(order._id, data)
      if (res?.success) {
        toast.success(res.message)
      } else {
        throw new Error(res?.message || 'Approval failed.')
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Error approving PayPal order.')
      }
    }
  }

  const CheckoutSummary = () => (
    <Card>
      <CardContent className="p-4">
        <div>
          <div className="text-lg font-bold">Order Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items:</span>
              <span>
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping & Handling:</span>
              <span>
                {shippingPrice === undefined
                  ? '--'
                  : shippingPrice === 0
                  ? 'FREE'
                  : <ProductPrice price={shippingPrice} plain />}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>
                {taxPrice === undefined ? '--' : <ProductPrice price={taxPrice} plain />}
              </span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-lg">
              <span>Order Total:</span>
              <span>
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>

            {!isPaid && paymentMethod === 'PayPal' && (
              <div>
                <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                  <PrintLoadingState />
                  <PayPalButtons createOrder={handleCreatePayPalOrder} onApprove={handleApprovePayPalOrder} />
                </PayPalScriptProvider>
              </div>
            )}
             {!isPaid && paymentMethod === 'Stripe' && clientSecret && (
              <Elements
                options={{
                  clientSecret,
                }}
                stripe={stripePromise}
              >
                <StripeForm
                  priceInCents={Math.round(order.totalPrice * 100)}
                  orderId={order._id}
                />
              </Elements>
            )}
            {!isPaid && paymentMethod === 'Cash On Delivery' && (
              <Button className="w-full rounded-full" onClick={() => router.push(`/account/orders/${order._id}`)}>
                View Order
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
   const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
   )


  return (
    <main className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          {/* Shipping Address */}
          <div>
            <div className="grid md:grid-cols-3 my-3 pb-3">
              <div className="text-lg font-bold">Shipping Address</div>
              <div className="col-span-2">
                <p>
                  {shippingAddress.fullName}
                  <br />
                  {shippingAddress.street}
                  <br />
                  {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-y">
            <div className="grid md:grid-cols-3 my-3 pb-3">
              <div className="text-lg font-bold">Payment Method</div>
              <div className="col-span-2">
                <p>{paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Items and Shipping */}
          <div className="grid md:grid-cols-3 my-3 pb-3">
            <div className="flex text-lg font-bold">
              <span>Items and shipping</span>
            </div>
            <div className="col-span-2">
              <p>Delivery date: {formatDateTime(expectedDeliveryDate).dateOnly}</p>
              <ul>
                {items.map((item) => (
                  <li key={item.slug}>
                    {item.name} x {item.quantity} = {item.price}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="block md:hidden">
            <CheckoutSummary />
          </div>

          <CheckoutFooter />
        </div>

        <div className="hidden md:block">
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}