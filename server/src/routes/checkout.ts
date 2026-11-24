import { Router } from 'express';
import { rateLimit, sendError, wrap } from '../http.js';
import { supabase } from '../supabase.js';
import { normalizeCheckoutItems, validateCheckoutCustomer } from '../commerce/validation.js';

const router = Router();
const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

router.get('/checkout/orders/:orderId/status', rateLimit(60, 60_000), wrap(async (req, res) => {
  const orderId = str(req.params.orderId);
  if (!orderId) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Order id is required.');
    return;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, razorpay_payment_id, refund_id, created_at')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    sendError(res, 500, 'DB_ERROR', 'Unable to retrieve payment status.');
    return;
  }
  if (!order) {
    sendError(res, 404, 'NOT_FOUND', 'Order not found.');
    return;
  }

  const paymentStatus = order.status === 'refunded'
    ? 'refunded'
    : order.refund_id
      ? 'refund_pending'
      : Boolean(order.razorpay_payment_id) || ['paid', 'shipped', 'delivered'].includes(order.status)
        ? 'captured'
        : order.status === 'cancelled' ? 'failed' : 'pending';

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    orderId: order.id,
    orderStatus: order.status,
    paymentStatus,
    updatedAt: order.created_at,
  });
}));

/** Prices and stock are calculated and reserved in the database, never from client values. */
router.post(
  '/checkout/orders',
  rateLimit(10, 60_000),
  wrap(async (req, res) => {
    const { customer, items } = req.body ?? {};
    const customerResult = validateCheckoutCustomer(customer);
    if (!customerResult.ok) {
      sendError(res, 400, 'VALIDATION_ERROR', customerResult.error);
      return;
    }
    const itemsResult = normalizeCheckoutItems(items);
    if (!itemsResult.ok) {
      sendError(res, 400, 'VALIDATION_ERROR', itemsResult.error);
      return;
    }
    const normalizedCustomer = customerResult.value;
    const normalizedItems = itemsResult.value;

    const { data: pricedProducts, error: productLookupError } = await supabase
      .from('products')
      .select('id, currency_code')
      .in('id', normalizedItems.map((item) => item.product_id));
    if (productLookupError) {
      sendError(res, 500, 'DB_ERROR', 'Unable to validate product currency.');
      return;
    }
    if ((pricedProducts ?? []).some((product) => String(product.currency_code || 'INR').toUpperCase() !== 'INR')) {
      sendError(res, 409, 'CURRENCY_NOT_SUPPORTED', 'Checkout currently supports INR orders only.');
      return;
    }
    const razorpayKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const razorpayKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!razorpayKeyId || !razorpayKeySecret) {
      sendError(res, 503, 'PAYMENTS_UNAVAILABLE', 'Online payments are currently unavailable. Your order was not placed and no payment was charged.');
      return;
    }

    const { data: result, error: dbError } = await supabase.rpc('create_order_atomic', {
      p_customer: {
        name: normalizedCustomer.name,
        email: normalizedCustomer.email,
        phone: normalizedCustomer.phone,
        shipping_address: normalizedCustomer.shippingAddress,
      },
      p_items: normalizedItems,
      p_razorpay_order_id: null,
    });
    if (dbError) {
      sendError(res, 409, 'ORDER_REJECTED', dbError.message || 'Unable to place order.');
      return;
    }

    const orderId: string = result.order_id;
    const amount = Math.round(Number(result.subtotal) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      await supabase.rpc('set_order_status', { p_order: orderId, p_status: 'cancelled' });
      sendError(res, 409, 'INVALID_ORDER_AMOUNT', 'The order amount could not be validated.');
      return;
    }

    let razorpayOrderId: string;
    try {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: `rcpt_${orderId.slice(0, 10)}`,
          notes: { hilo_order_id: orderId, customer_email: normalizedCustomer.email },
        }),
      });
      if (!response.ok) {
        console.error('Razorpay order creation failed:', await response.text());
        await supabase.rpc('set_order_status', { p_order: orderId, p_status: 'cancelled' });
        sendError(res, 502, 'PAYMENT_GATEWAY_ERROR', 'Failed to initiate gateway payment session.');
        return;
      }
      const gatewayOrder = await response.json() as { id?: string };
      if (!gatewayOrder.id) throw new Error('Razorpay did not return an order id.');
      razorpayOrderId = gatewayOrder.id;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      await supabase.rpc('set_order_status', { p_order: orderId, p_status: 'cancelled' });
      sendError(res, 502, 'PAYMENT_GATEWAY_ERROR', 'Failed to initiate gateway payment session.');
      return;
    }

    const { error: saveGatewayIdError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrderId })
      .eq('id', orderId);
    if (saveGatewayIdError) {
      console.error('Could not save Razorpay order id:', saveGatewayIdError.message);
      // The gateway order exists, but without this link its webhook cannot reconcile it.
      await supabase.rpc('set_order_status', { p_order: orderId, p_status: 'cancelled' });
      sendError(res, 500, 'ORDER_PERSISTENCE_ERROR', 'Unable to prepare payment. Please retry checkout.');
      return;
    }

    res.status(201).json({
      success: true,
      orderId,
      razorpayOrderId,
      amount,
      currency: 'INR',
      keyId: razorpayKeyId,
      customer: { name: normalizedCustomer.name, email: normalizedCustomer.email, phone: normalizedCustomer.phone },
    });
  })
);

export default router;
