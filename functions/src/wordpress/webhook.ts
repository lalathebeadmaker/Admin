import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Order, OrderStatus } from '../../types';

admin.initializeApp();

export const handleWordPressOrder = functions.https.onRequest(async (req, res) => {
  // Validate the request
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Verify webhook secret if you have one
  const webhookSecret = req.headers['x-webhook-secret'];
  if (webhookSecret !== functions.config().wordpress.webhook_secret) {
    res.status(401).send('Unauthorized');
    return;
  }

  try {
    const orderData = req.body;
    
    // Transform WordPress order data to your Order type
    const order: Omit<Order, 'id'> = {
      customerName: orderData.customer_name,
      customerEmail: orderData.customer_email,
      customerPhone: orderData.customer_phone,
      items: orderData.items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: orderData.total_amount,
      status: OrderStatus.PENDING,
      orderDate: admin.firestore.Timestamp.fromDate(new Date()),
      notes: orderData.notes || '',
      shippingAddress: {
        street: orderData.shipping_address.street,
        city: orderData.shipping_address.city,
        state: orderData.shipping_address.state,
        country: orderData.shipping_address.country,
        postalCode: orderData.shipping_address.postal_code
      }
    };

    // Add the order to Firestore
    const orderRef = await admin.firestore().collection('orders').add(order);

    // Send response
    res.status(200).json({
      success: true,
      orderId: orderRef.id
    });
  } catch (error) {
    console.error('Error processing WordPress order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}); 