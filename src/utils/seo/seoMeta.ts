// lib/seoMeta.js

import { siteMetadata } from "./siteMetadata";

export const seoMeta = {
  home: siteMetadata({
    description:
      "JK Organics delivers high-quality, natural, and sustainable products that promote health and wellness, helping families live a chemical-free, organic lifestyle.",
    url: "/",
    keywords:
      "organic skincare Kenya, weight loss Kenya, natural beauty, vegan skincare, detox tea, slimming oil",
  }),

  products: siteMetadata({
    title: "Shop Organic Products",
    description:
      "Explore high-quality organic skincare and wellness products promoting a healthier, chemical-free lifestyle.",
    url: "/products/all",
    keywords:
      "organic products Kenya, skincare store, weight loss supplements, detox drinks, natural oils",
  }),

  about: siteMetadata({
    title: "About Us",
    description:
      "Learn about our commitment to delivering natural, sustainable products that promote health and wellness.",
    url: "/about",
    keywords:
      "about JK Organics, organic brand Kenya, natural wellness, cruelty-free skincare",
  }),

  blog: siteMetadata({
    title: "Blog",
    description:
      "Read professional tips and insights on organic living, wellness, and sustainability.",
    url: "/blogs",
    keywords:
      "skincare tips, weight loss advice, organic lifestyle, natural beauty blog, wellness Kenya",
  }),

  contact: siteMetadata({
    title: "Contact Us",
    description:
      "Reach out for inquiries about our organic products and services.",
    url: "/contact",
    keywords:
      "contact JK Organics, customer support, skincare help, weight loss support",
  }),

  signin: siteMetadata({
    title: "Sign In",
    description:
      "Access your account to track orders and manage your profile securely.",
    url: "/auth/signin",
    keywords: "account login, organic store account Kenya",
    robots: "noindex, nofollow",
  }),

  adminSignin: siteMetadata({
    title: "Admin Sign In",
    description: "Staff sign in for the JK Organics admin panel.",
    url: "/auth/admin/signin",
    keywords: "JK Organics admin login",
    robots: "noindex, nofollow",
  }),

  signup: siteMetadata({
    title: "Sign Up",
    description:
      "Create your account to shop organic skincare and wellness products.",
    url: "/auth/signup",
    keywords: "create account, organic store Kenya",
    robots: "noindex, nofollow",
  }),

  forgotPassword: siteMetadata({
    title: "Forgot Password",
    description:
      "Reset your account password securely and regain access to your JK Organics account.",
    url: "/auth/forgot-password",
    keywords: "password reset, recover account, organic store Kenya",
    robots: "noindex, nofollow",
  }),

  // 🧍 Account Pages (No Index)
  account: siteMetadata({
    title: "My Account",
    description:
      "View your orders, manage shipping addresses, and update personal details.",
    url: "/account",
    keywords: "account dashboard, order history, organic store Kenya",
    robots: "noindex, nofollow",
  }),

  orders: siteMetadata({
    title: "My Orders",
    description:
      "Track purchases, check delivery status, and manage your orders.",
    url: "/account/orders",
    keywords: "order tracking Kenya, skincare order status",
    robots: "noindex, nofollow",
  }),

  address: siteMetadata({
    title: "My Addresses",
    description:
      "Manage your shipping and billing details for a smooth shopping experience.",
    url: "/account/address",
    keywords: "shipping address management, billing details Kenya",
    robots: "noindex, nofollow",
  }),

  accountDetails: siteMetadata({
    title: "Account Details",
    description: "Securely update your profile information and password.",
    url: "/account/details",
    keywords: "update profile, account settings Kenya",
    robots: "noindex, nofollow",
  }),

  faqs: siteMetadata({
    title: "FAQs",
    description:
      "Find answers about ingredients, usage, delivery, payments, and returns.",
    url: "/privacy/FAQs",
    keywords:
      "organic skincare FAQs, weight loss product FAQs Kenya, delivery questions",
  }),

  notFound: siteMetadata({
    title: "404 Not Found",
    description:
      "The requested resource could not be found. Return to the homepage.",
    robots: "noindex, nofollow",
  }),

  cart: siteMetadata({
    title: "Cart",
    description:
      "Review items in your cart before proceeding to secure checkout.",
    robots: "noindex, nofollow",
  }),

  checkout: siteMetadata({
    title: "Secure Checkout",
    description:
      "Complete your purchase securely with trusted payment methods.",
    robots: "noindex, nofollow",
  }),

  order: (id: number) =>
    siteMetadata({
      title: `Order #${id}`,
      description:
        "View order details, payment status, and delivery information.",
      robots: "noindex, nofollow",
    }),
};
