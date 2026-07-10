-- AlterTable
ALTER TABLE "users" ADD COLUMN "disabled_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);
