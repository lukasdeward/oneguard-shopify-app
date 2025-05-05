import { useCallback, useEffect, useRef, useState } from "react";
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
  Badge,
  Select,
  Checkbox,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const shop = await admin.graphql(
    `#graphql
      query {
        shop {
          id
          name
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
    const access_object = await db.appConfiguration.findFirst({
      where: {
        shop: shopJson.data?.shop.myshopifyDomain,
      }
    })
    if (!access_object) {
      await db.appConfiguration.create({
        data: {
          proxyAccessKey: accessKey,
          shop: shopJson.data?.shop.myshopifyDomain,
          displayName: shopJson.data?.shop.name,
          verificationAdressMatchesOrder: false,
          verificationAge: "16"
        }
      });
    }
  }

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const shop = await admin.graphql(
    `#graphql
      query {
        shop {
          myshopifyDomain
        }
      }`);
    
  const shopJson = await shop.json();

  
  prisma.appConfiguration.update({
    where: {
      shop: shopJson.data?.shop.myshopifyDomain,
    },
    data: {
      restrictedProductsCollection: selected?.toString(),
    }
  })

  return true;
};

export default function Index() {
  const shopify = useAppBridge();

  const [selected, setSelected] = useState('newestUpdate');

  const handleSelectChange = useCallback(
    (value: string) => setSelected(value),
    [],
  );

  const options = [
    {label: '16', value: '16'},
    {label: '17', value: '17'},
    {label: '18', value: '18'},
    {label: '19', value: '19'},
    {label: '20', value: '20'},
    {label: '21', value: '21'},
  ];

  const [checked, setChecked] = useState(false);
  const handleChange = useCallback(
    (newChecked: boolean) => setChecked(newChecked),
    [],
  );

  async function selectCollection() {
    // Handle generating
    const selected = await shopify.resourcePicker({type: 'collection'});

    // Send request to action and save selected collection
    

    return null;
  };

  // This example is for guidance purposes. Copying it will come with caveats.
  const { smUp } = useBreakpoints();
  return (
    <Page
    >
      <BlockStack gap={{ xs: "800", sm: "400" }}>
      <Text variant="heading3xl" as="h2">
        OneGuard - Ausweiskontrolle
      </Text>

        <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
          <Box
            as="section"
            paddingInlineStart={{ xs: "400", sm: "0" }}
            paddingInlineEnd={{ xs: "400", sm: "0" }}
          >
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Einstellungen    
              </Text>
            </BlockStack>
          </Box>
          <Card roundedAbove="sm">
            <BlockStack gap="400">
              <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <Text as="h3" variant="headingMd">
                    Status:
                  </Text>
                  <Badge progress="incomplete" tone="attention">
                    Inaktiv
                  </Badge>
                </div>
                <Button variant="primary">Aktivieren</Button>
              </div>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
                <Text as="h3" variant="headingMd">
                  Altersbeschränkte Produkte:
                </Text>
                <Button onClick={selectCollection}>Kollektion auswählen</Button>
              </div>
              <TextField label="Anzeigename des Shops" />
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
                Ausweis Konfiguration
              </Text>
            </BlockStack>
          </Box>
          <Card roundedAbove="sm">
            <BlockStack gap="400">
            <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
                <Text as="h3" variant="headingMd">
                  Adresse:
                </Text>
                <Checkbox
                  label="Lieferadresse des Kunden muss mit Ausweisadresse übereinstimmen"
                  checked={checked}
                  onChange={handleChange}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
                <Text as="h3" variant="headingMd">
                  Notwendiges Alter:
                </Text>
                <Select
                  label="Alter auf dem Ausweis"
                  labelInline
                  options={options}
                  onChange={handleSelectChange}
                  value={selected}
                />
              </div>

            </BlockStack>
          </Card>
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
