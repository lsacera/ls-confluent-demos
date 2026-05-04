-- LAB2: Completed Orders
-- Filter orders with valid payment received within 96 hours using interval joins

CREATE TABLE IF NOT EXISTS completed_orders (
   order_id INT,
   amount DOUBLE,
   confirmation_code STRING,
   ts TIMESTAMP_LTZ(3),
   WATERMARK FOR ts AS ts - INTERVAL '30' SECOND,
   PRIMARY KEY (order_id) NOT ENFORCED
) AS
SELECT
   pymt.order_id,
   pymt.amount,
   pymt.confirmation_code,
   pymt.ts
FROM unique_payments pymt, `ls-demo.public.orders` ord
WHERE pymt.order_id = ord.orderid
AND orderdate BETWEEN pymt.ts - INTERVAL '96' HOUR AND pymt.ts;
