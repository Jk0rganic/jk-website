# JK Organics

JK Organics is a modern e-commerce platform focused on providing high-quality organic health and wellness products. The application is built with Next.js and integrates with WordPress + WooCommerce as a headless backend, delivering a fast, scalable, and SEO-friendly shopping experience.

## Features

* Product catalog with categories and filtering
* Product detail pages with variations and pricing
* Shopping cart functionality
* Secure checkout process
* IntaSend online payments (M-Pesa, card, bank)
* Customer account management
* Order history and tracking
* Blog management through WordPress
* SEO optimization with metadata and structured data
* Responsive design for mobile, tablet, and desktop
* Headless WooCommerce integration
* GraphQL-powered content and product fetching

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* SCSS Modules
* React Hook Form
* Zod Validation
* Zustand State Management
* Apollo Client / GraphQL

### Backend

* WordPress (Headless CMS)
* WooCommerce
* WPGraphQL
* Custom API integrations

### Payments

* IntaSend Checkout (M-Pesa, card, PesaLink bank transfer)
* Cash on Delivery (COD)

### Infrastructure

* Vercel Deployment
* Cloudinary Image Hosting
* SMTP Email Services

---

## Getting Started

### Prerequisites

Make sure you have installed:

* Node.js 20+
* npm, pnpm, yarn, or bun
* WordPress with WooCommerce
* WPGraphQL plugin

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Sabolahh/jk-organics-main-repo.git
cd jk-organics
```

Install dependencies:

```bash
npm install
```

or

```bash
pnpm install
```

or

```bash
yarn install
```

---

## Environment Variables

Create a `.env.local` file in the root directory and configure the following variables:

```env
NEXT_PUBLIC_WORDPRESS_API_URL=
NEXT_PUBLIC_GRAPHQL_ENDPOINT=

WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=

INTASEND_PUBLIC_KEY=
INTASEND_SECRET_KEY=
INTASEND_TEST=true
INTASEND_WEBHOOK_CHALLENGE=
NEXT_PUBLIC_APP_URL=

# IntaSend dashboard: set webhook URL to {NEXT_PUBLIC_APP_URL}/api/intasend/webhook

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

Adjust the variables according to your deployment environment.

---

## Development

Run the development server:

```bash
npm run dev
```

or

```bash
pnpm dev
```

or

```bash
yarn dev
```

Open:

```text
http://localhost:3000
```

in your browser.

---

## Project Structure

```text
src/
├── app/
├── comp/
├── graphql/
├── hooks/
├── lib/
├── store/
├── styles/
├── types/
├── utils/
└── middleware.ts
```

### Main Directories

| Directory | Purpose                       |
| --------- | ----------------------------- |
| app       | Next.js App Router pages      |
| comp      | Reusable UI components        |
| graphql   | GraphQL queries and mutations |
| hooks     | Custom React hooks            |
| lib       | API clients and utilities     |
| store     | Zustand state management      |
| types     | Global TypeScript types       |
| utils     | Helpers, validation, and SEO  |
| styles    | SCSS modules                  |

---

## SEO

JK Organics includes:

* Dynamic Metadata
* Open Graph Tags
* Twitter Cards
* JSON-LD Structured Data
* Dynamic Sitemap Generation
* Robots.txt Configuration
* Canonical URLs

---

## Performance Optimizations

* Server Components
* Dynamic Imports
* Optimized Images
* Lazy Loading
* Incremental Data Fetching
* Static and Dynamic Rendering
* GraphQL Query Optimization

---

## Deployment

Build the application:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

The application can be deployed to:

* Vercel
* VPS Servers
* Docker Containers
* Cloud Platforms

---

## Contributing

Contributions, improvements, and bug fixes are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

## License

This project is proprietary software developed for JK Organics.

All rights reserved.

---

## Author

Developed by Sabolahh(lazy developer).

Website: https://dmetadata.com
# jk-website
