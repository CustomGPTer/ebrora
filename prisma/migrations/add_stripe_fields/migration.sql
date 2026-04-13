-- Migration: add_stripe_fields
-- Adds Stripe payment support alongside existing PayPal

-- 1. Add new columns to subscriptions table
ALTER TABLE "subscriptions" ADD COLUMN "payment_provider" TEXT NOT NULL DEFAULT 'PAYPAL';
ALTER TABLE "subscriptions" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" TEXT;

-- 2. Add unique constraints for Stripe fields
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripe_customer_id_key" UNIQUE ("stripe_customer_id");
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");

-- 3. Add index on payment_provider for query performance
CREATE INDEX "subscriptions_payment_provider_idx" ON "subscriptions"("payment_provider");

-- 4. Add source column to webhook_events for Stripe/PayPal dedup separation
ALTER TABLE "webhook_events" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'PAYPAL';
