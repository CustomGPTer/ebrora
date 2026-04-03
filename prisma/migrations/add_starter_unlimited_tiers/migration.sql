-- Migration: Add STARTER and UNLIMITED to SubscriptionTier enum
-- Run this BEFORE deploying the updated schema.prisma
-- Safe to run: adds new values only, does not touch existing data

ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'STARTER';
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'UNLIMITED';
