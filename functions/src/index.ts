/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import { WooMapper }  from "./helpers";
import { Order, LineItem, OrderStatus } from "./types";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

setGlobalOptions({ maxInstances: 10 });

export const syncWooOrder = onRequest(async (req, res) => {
    logger.info("Received WooCommerce order webhook");
  
    const body = req.body;
  
    if (!body?.id || !Array.isArray(body.line_items)) {
      logger.error("Invalid payload structure", body);
      res.status(400).send("Invalid payload");
      return;
    }

    // Validate required fields
    if (!body.billing?.email) {
      logger.error("Missing customer email", body);
      res.status(400).send("Missing customer email");
      return;
    }
  
    try {
      const order: Order = {
        id: String(body.id),
        customerName: `${body.billing?.first_name ?? ""} ${body.billing?.last_name ?? ""}`.trim() || "Unknown Customer",
        customerEmail: body.billing?.email ?? "",
        customerPhone: body.billing?.phone ?? "",
        items: body.line_items.map((item: LineItem) => ({
          productId: WooMapper.resolveProductId(item),
          quantity: item.quantity,
          price: parseFloat(item.price),
          additionalMaterials: [],
          additionalCosts: []
        })),
        totalAmount: parseFloat(body.total),
        currency: WooMapper.mapCurrency(body.currency),
        status: WooMapper.mapWooStatus(body.status),
        orderDate: new Date(body.date_created),
        notes: body.customer_note || undefined,
        dateCompleted: body.date_completed ? new Date(body.date_completed) : new Date(),
        extraExpenses: [],
        additionalPayments: [],
        totalExtraExpenses: 0,
        totalAdditionalPayments: 0,
        productCostInNGN: 0,
        shippingCostInNGN: 0,
        profitMargin: 0,
        hasInvalidProducts: false,
        shipping: {
          shippingAddress: {
            street: body.shipping?.address_1 ?? "",
            city: body.shipping?.city ?? "",
            state: body.shipping?.state ?? "",
            country: body.shipping?.country ?? "",
            postalCode: body.shipping?.postcode ?? ""
          },
          shippingInfo: {
            customerPaid: parseFloat(body.shipping_total ?? "0"),
            trackingNumber: WooMapper.getMetaValue(body.meta_data, "_tracking_number"),
            carrier: WooMapper.getMetaValue(body.meta_data, "_carrier"),
            estimatedDeliveryDate: WooMapper.estimateDelivery()
          },
          status: 'pending'
        }
      };

      logger.info(`Processing order ${order.id} for customer ${order.customerName}`);
      logger.info(`Order total: ${order.currency} ${order.totalAmount}`);
      logger.info(`Items count: ${order.items.length}`);
      
      // Check if order already exists
      const existingOrder = await db.collection("orders").doc(order.id).get();
      
      if (existingOrder.exists) {
        // Update existing order - preserve financial calculations and additional data
        const existingData = existingOrder.data() as Order;
        const updatedOrder = {
          ...order,
          // Preserve financial calculations and additional data
          extraExpenses: existingData.extraExpenses || [],
          additionalPayments: existingData.additionalPayments || [],
          totalExtraExpenses: existingData.totalExtraExpenses || 0,
          totalAdditionalPayments: existingData.totalAdditionalPayments || 0,
          productCostInNGN: existingData.productCostInNGN || 0,
          shippingCostInNGN: existingData.shippingCostInNGN || 0,
          profitMargin: existingData.profitMargin || 0,
          hasInvalidProducts: existingData.hasInvalidProducts || false,
          // Preserve shipping info if it exists
          shipping: {
            ...order.shipping,
            shippingInfo: {
              ...order.shipping.shippingInfo,
              ...(existingData.shipping?.shippingInfo?.actualCost && { actualCost: existingData.shipping.shippingInfo.actualCost }),
              ...(existingData.shipping?.shippingInfo?.dateShipped && { dateShipped: existingData.shipping.shippingInfo.dateShipped }),
              ...(existingData.shipping?.shippingInfo?.actualDeliveryDate && { actualDeliveryDate: existingData.shipping.shippingInfo.actualDeliveryDate }),
              ...(existingData.shipping?.shippingInfo?.shippingCompany && { shippingCompany: existingData.shipping.shippingInfo.shippingCompany })
            },
            status: existingData.shipping?.status || 'pending'
          }
        };
        
        await db.collection("orders").doc(order.id).set(updatedOrder);
        logger.info(`Order ${order.id} updated in Firestore successfully`);
      } else {
        // Create new order
        await db.collection("orders").doc(order.id).set(order);
        logger.info(`Order ${order.id} created in Firestore successfully`);
      }
      
      res.status(200).send("Order processed successfully");
    } catch (err) {
      logger.error("Failed to process order", err);
      res.status(500).send("Failed to process order");
    }
  });

export const updateWooOrderStatus = onRequest(async (req, res) => {
    logger.info("Received WooCommerce order status update webhook");
  
    const body = req.body;
  
    if (!body?.id || !body?.status) {
      logger.error("Invalid status update payload structure", body);
      res.status(400).send("Invalid payload");
      return;
    }
  
    try {
      const orderId = String(body.id);
      const newStatus = WooMapper.mapWooStatus(body.status);
      
      logger.info(`Updating order ${orderId} status to ${newStatus}`);
      
      // Get existing order
      const orderRef = db.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        logger.error(`Order ${orderId} not found`);
        res.status(404).send("Order not found");
        return;
      }
      
      // Update only the status and dateCompleted if status is completed
      const updateData: any = {
        status: newStatus
      };
      
      if (newStatus === OrderStatus.COMPLETED || newStatus === OrderStatus.DELIVERED) {
        updateData.dateCompleted = new Date();
      }
      
      await orderRef.update(updateData);
      logger.info(`Order ${orderId} status updated to ${newStatus} successfully`);
      
      res.status(200).send("Order status updated successfully");
    } catch (err) {
      logger.error("Failed to update order status", err);
      res.status(500).send("Failed to update order status");
    }
  });