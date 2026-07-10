CREATE TABLE "delivery_rates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "fulfillment_type" TEXT NOT NULL,
    "counties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "towns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "fee" INTEGER NOT NULL,
    "free_above" INTEGER,
    "eta" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_rates_code_key" ON "delivery_rates"("code");
CREATE INDEX "delivery_rates_active_sort_idx" ON "delivery_rates"("active", "sort_order");
