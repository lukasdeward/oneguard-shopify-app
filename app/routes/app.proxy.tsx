import { ActionFunction } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
import { OrderVerifyedRequest } from "types/orderVerifyedRequest";
import { ProxyTypes } from "types/proxyTypes";
import { PrismaClient } from "@prisma/client";

export const action: ActionFunction = async ({ request }) => {

    const { session, admin } = await authenticate.public.appProxy(request);
    const prisma = new PrismaClient();

    if (session) {
        const parsedRequest = await request.json();
        const type = parsedRequest.type as ProxyTypes;

        const access_object = await prisma.proxyAuthorizationKey.findFirst({
            where: {
                shop: session.shop,
            }
        })

        if (!access_object) {
            return { success: false, status: 401, data: { message: "Unauthorized - id: 47813643892" } };
        }
        if (access_object.key !== parsedRequest.key) {
            return { success: false, status: 401, data: { message: "Unauthorized - id: 38923719329" } };
        }


        if (type === "ORDER-VERIFYED") {
            const { data } = parsedRequest as OrderVerifyedRequest;
            console.log("Order ID: ", data.orderId);
        }

        return { success: false, data: { message: "Bad Request" } };
    }

    return { success: false, status: 401, data: { message: "Unauthorized" } };
}
