-- Migration: Email Subscribers Table
-- Created: 2026-02-16
-- Purpose: Store email subscriptions from marketing website

CREATE TABLE IF NOT EXISTS email_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'website',
    unsubscribed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_subscribed_at ON email_subscribers(subscribed_at);

-- Comment
COMMENT ON TABLE email_subscribers IS 'Stores email subscriptions from marketing website and other sources';
COMMENT ON COLUMN email_subscribers.source IS 'Source of subscription: website, github, event, referral, etc.';
COMMENT ON COLUMN email_subscribers.metadata IS 'Additional data: UTM params, referrer, etc.';
