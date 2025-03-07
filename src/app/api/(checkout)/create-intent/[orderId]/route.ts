import { prisma } from "@/utils/connect";
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (order) {

    /* const amount = new Decimal(order.price).toNumber() * 100; */
    const amount = (order.price as Decimal).toNumber() * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      /* amount: order.price * 100, */
      amount: amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: { intent_id: paymentIntent.id },
    });

    return new NextResponse(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { status: 200 }
    );
  }
  return new NextResponse(
    JSON.stringify({ message:"Order not found!" }),
    { status: 404 }
  );
}