-- Add unique index on payment_records(order_id, channel) for idempotency
-- This ensures each order can only have one payment record per channel
ALTER TABLE `payment_records` ADD UNIQUE INDEX `payment_records_order_id_channel_key` (`order_id`, `channel`);

-- Add unique index on delivery_logs(card_secret_id) to prevent duplicate delivery
-- This ensures each card secret can only be delivered once
ALTER TABLE `delivery_logs` ADD UNIQUE INDEX `delivery_logs_card_secret_id_key` (`card_secret_id`);