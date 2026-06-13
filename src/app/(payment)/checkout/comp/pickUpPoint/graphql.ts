import { gql } from "@apollo/client";

export const GET_SHIPPING_ZONES = gql`
  query GetShippingZones {
    shippingZones {
      id
      name
      shippingMethods {
      methodId
        cost
      }
    }
  }
`;
