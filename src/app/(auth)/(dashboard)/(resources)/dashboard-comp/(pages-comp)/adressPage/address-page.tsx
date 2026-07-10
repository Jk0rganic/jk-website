"use client";
import Link from "next/link";
import { useAccount } from "../../../dashboard-utils/account-context";
import k from "./styles.module.scss";

export default function AddressesPage() {
  const { orders } = useAccount();

  const billingAddress = orders[0]?.billing ?? null;
  const shippingAddress = orders[0]?.shipping ?? null;

  if (!billingAddress || !shippingAddress) {
    return <p>No address information available.</p>;
  }

  return (
    <div className={k.addresses_page}>
      <h3>Your Addresses</h3>
      <p>
        The following addresses will be used on the checkout page by default.
      </p>

      <div className={k.address_container}>
        {/* Billing Address */}
        <div className={k.address_section}>
          <h4>Billing address </h4>
          <Link href="/account/details" className={k.edit_link}>
            Edit Billing address
          </Link>
          <address>
            {billingAddress.first_name} {billingAddress.last_name} <br />
            {billingAddress.address_1} <br />
            {billingAddress.country} <br />
            {billingAddress.city} <br />
            {billingAddress.state}
            {billingAddress.postcode}
          </address>
        </div>

        {/* Shipping Address */}
        <div className={k.address_section}>
          <h4>Shipping address </h4>
          <Link href="/account/details" className={k.edit_link}>
            Edit Shipping address
          </Link>
          <address>
            {shippingAddress.first_name} {shippingAddress.last_name} <br />
            {shippingAddress.address_1} <br />
            {shippingAddress.country} <br />
            {shippingAddress.city} <br />
            {shippingAddress.state} {shippingAddress.postcode}
          </address>
        </div>
      </div>
    </div>
  );
}
