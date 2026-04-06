-- LAB1: Customer 360 Snapshot
-- Aggregate 30-day customer activity: total orders and revenue

CREATE TABLE IF NOT EXISTS thirty_day_customer_snapshot (
  customerid INT,
  customername STRING,
  total_amount INT,
  number_of_orders BIGINT,
  updated_at TIMESTAMP,
  PRIMARY KEY (customerid) NOT ENFORCED
)
AS
SELECT
  COALESCE(customerid, 0) AS customerid,
  MAX(customername) AS customername,
  COALESCE(SUM(total_amount), 0) AS total_amount,
  COUNT(DISTINCT orderid) AS number_of_orders,
  MAX(orderdate) AS updated_at
FROM product_sales
GROUP BY customerid;