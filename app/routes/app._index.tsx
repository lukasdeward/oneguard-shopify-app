import { useEffect, useRef } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  useBreakpoints,
  TextField,
  InlineGrid,
  Divider,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const shop = await admin.graphql(
    `#graphql
      query {
        shop {
          id
          primaryDomain {
            url
          }
          myshopifyDomain
        }
      }`);
    
  const shopJson = await shop.json();
  
  const accessKey = crypto.randomUUID()

  const registerShop = await fetch("http://localhost:3000/api/webhooks/registerShop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shop: shopJson.data?.shop.myshopifyDomain,
      key: accessKey,
      shopId: shopJson.data?.shop.id,
      primaryDomain: shopJson.data?.shop.primaryDomain.url
    }),
  })

  const registerShopResponse = await registerShop.json();

  if (registerShopResponse.connectionCreated) {
    await db.proxyAuthorizationKey.create({
      data: {
        key: accessKey,
        shop: shopJson.data?.shop.myshopifyDomain
      }
    });
  }

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  return true;
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();


  async function generateBlogPost() {
    // Handle generating
    const selected = await shopify.resourcePicker({type: 'collection'});
    fetcher.submit(
      { selected: JSON.stringify(selected) },
      {
        method: "post",
        action: "/app/generateBlogPost",
      }
    );

    return null;
  };

  // This example is for guidance purposes. Copying it will come with caveats.
  const { smUp } = useBreakpoints();
  return (
    <Page
      primaryAction={{ content: "View on your store", disabled: true }}
      secondaryActions={[
        {
          content: "Duplicate",
          accessibilityLabel: "Secondary action label",
          onAction: () => alert("Duplicate action"),
        },
      ]}
    >
      <BlockStack gap={{ xs: "800", sm: "400" }}>
      <Text variant="heading3xl" as="h2">
        Einstellungen
      </Text>

        <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
          <Box
            as="section"
            paddingInlineStart={{ xs: 400, sm: 0 }}
            paddingInlineEnd={{ xs: 400, sm: 0 }}
          >
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                InterJambs
              </Text>
              <Text as="p" variant="bodyMd">
                Interjambs are the rounded protruding bits of your puzzlie piece
              </Text>
            </BlockStack>
          </Box>
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <Button onClick={generateBlogPost}>Add product</Button>
              <TextField label="Interjamb ratio" />
            </BlockStack>
          </Card>
        </InlineGrid>
        {smUp ? <Divider /> : null}
        <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
          <Box
            as="section"
            paddingInlineStart={{ xs: 400, sm: 0 }}
            paddingInlineEnd={{ xs: 400, sm: 0 }}
          >
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Dimensions
              </Text>
              <Text as="p" variant="bodyMd">
                Interjambs are the rounded protruding bits of your puzzlie piece
              </Text>
            </BlockStack>
          </Box>
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <TextField label="Horizontal" />
              <TextField label="Interjamb ratio" />
            </BlockStack>
          </Card>
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
