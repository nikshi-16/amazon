'use server';

import { Cart, OrderItem, ShippingAddress } from '@/types';
import { formatError, round2 } from '../utils';

import { auth } from '@/auth';
import { connectToDatabase } from '../db';
import Order, { IOrder } from '../db/models/order.model';
import { OrderInputSchema } from '../validator';
import { AVAILABLE_DELIVERY_DATES } from '../constants';
import { paypal } from '../paypal';
import { sendPurchaseReceipt } from '@/emails';
import { revalidatePath } from 'next/cache';

export const createOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase();
    const session = await auth();
    if (!session) throw new Error('User not authenticated');

    // Recalculate price and delivery date on the server
    const createdOrder = await createOrderFromCart(clientSideCart, session.user.id!);
    return {
      success: true,
      message: 'Order placed successfully',
      data: { orderId: createdOrder._id.toString() },
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
};

export async function getOrderById(orderId: string): Promise<IOrder> {
  await connectToDatabase();
  const order = await Order.findById(orderId);
  return JSON.parse(JSON.stringify(order));
}

export async function createPayPalOrder(orderId: string) {
  await connectToDatabase();
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    if (!order.totalPrice) throw new Error('Order total price is missing');

    // Create the PayPal order using the order's total price
    const paypalOrder = await paypal.createOrder(order.totalPrice);
    console.log("🚀 PayPal Order Created:", paypalOrder);

    if (!paypalOrder?.id) throw new Error('Failed to create PayPal order');

    // Save the PayPal order id to the order in the database
    order.paymentResult = {
      id: paypalOrder.id,
      email_address: '',
      status: '',
      pricePaid: '0',
    };
    await order.save();

    // Return the PayPal order ID to the client
    return {
      success: true,
      message: 'PayPal order created successfully',
      data: paypalOrder.id,
    };
  } catch (err) {
    console.error("🚨 Error in createPayPalOrder:", err);
    return { success: false, message: formatError(err) };
  }
}

export async function approvePayPalOrder(orderId: string, data: { orderID: string }) {
  await connectToDatabase();
  try {
    const order = await Order.findById(orderId).populate('user', 'email');
    if (!order) throw new Error('Order not found');

    const captureData = await paypal.capturePayment(data.orderID);
    if (
      !captureData ||
      captureData.id !== order.paymentResult?.id ||
      captureData.status !== 'COMPLETED'
    ) {
      throw new Error('Error in PayPal payment');
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
    };
    await order.save();
    await sendPurchaseReceipt({ order });
    revalidatePath(`/account/orders/${orderId}`);
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}

export const createOrderFromCart = async (clientSideCart: Cart, userId: string) => {
  const cart = {
    ...clientSideCart,
    ...calcDeliveryDateAndPrice({
      items: clientSideCart.items,
      shippingAddress: clientSideCart.shippingAddress,
      deliveryDateIndex: clientSideCart.deliveryDateIndex,
    }),
  };

  const order = OrderInputSchema.parse({
    user: userId,
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,
    expectedDeliveryDate: cart.expectedDeliveryDate,
  });
  return await Order.create(order);
};

export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
}) => {
  const itemsPrice = round2(items.reduce((acc, item) => acc + item.price * item.quantity, 0));

  const deliveryDate = AVAILABLE_DELIVERY_DATES[
    deliveryDateIndex === undefined ? AVAILABLE_DELIVERY_DATES.length - 1 : deliveryDateIndex
  ];

  // Compute shipping price with clear grouping
  const shippingPrice = (!shippingAddress || !deliveryDate)
    ? undefined
    : (deliveryDate.freeShippingMinPrice > 0 && itemsPrice >= deliveryDate.freeShippingMinPrice)
      ? 0
      : deliveryDate.shippingPrice;

  const taxPrice = round2(itemsPrice * 0.15);

  const totalPrice = round2(
    itemsPrice +
      (shippingPrice ? round2(shippingPrice) : 0) +
      (taxPrice ? round2(taxPrice) : 0)
  );
  return {
    AVAILABLE_DELIVERY_DATES,
    deliveryDateIndex: deliveryDateIndex === undefined ? AVAILABLE_DELIVERY_DATES.length - 1 : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  };
};
