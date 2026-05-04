-- LAB2: Payments Deduplication
-- Remove duplicate payments by keeping only the earliest payment per order_id

CREATE TABLE IF NOT EXISTS unique_payments (
  order_id INT NOT NULL,
  product_id INT,
  customer_id INT,
  confirmation_code STRING,
  cc_number STRING,
  expiration STRING,
  amount DOUBLE,
  ts TIMESTAMP_LTZ(3),
  WATERMARK FOR ts AS ts - INTERVAL '30' SECOND
)
AS SELECT
  COALESCE(order_id, 0) AS order_id,
  product_id,
  customer_id,
  confirmation_code,
  cc_number,
  expiration,
  amount,
  ts
FROM (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY ts ASC) AS rownum
  FROM payments
)
WHERE rownum = 1;
