import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import db from "../../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, admin, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  

  const registerShop = await fetch("http://localhost:3000/api/webhooks/orderCreated", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({payload}),
  });

  console.log(payload);
  console.log(payload.customer);

  const registerShopResponse = await registerShop.json();

  console.log("Order Webhook response: ", registerShopResponse);

  return new Response();
};
