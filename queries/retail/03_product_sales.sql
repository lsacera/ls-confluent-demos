-- LAB1: Product Sales Data Product
-- Join orders, order items, products, and enriched customers to create detailed product sales view

CREATE TABLE IF NOT EXISTS product_sales (
     orderitemid INT,
     orderdate TIMESTAMP_LTZ(3),
     orderid INT,
     productid INT,
     brand STRING,
     productname STRING,
     price DECIMAL(10, 2),
     customerid INT NOT NULL,
     customername STRING,
     shipping_address_city STRING,
     shipping_address_state STRING,
     billing_address_state STRING,
     quantity INT,
     total_amount DECIMAL(10, 2),
     WATERMARK FOR orderdate AS orderdate - INTERVAL '5' SECOND,
     PRIMARY KEY (orderitemid) NOT ENFORCED
)
AS
SELECT
    oi.orderitemid,
    o.orderdate,
    o.orderid,
    p.productid,
    p.brand,
    p.productname,
    p.price,
    c.customerid,
    c.customername,
    c.shipping_address.city as shipping_address_city,
    c.shipping_address.`state` as shipping_address_state,
    c.billing_address.`state` as billing_address_state,
    oi.quantity,
    oi.quantity * p.price AS total_amount
FROM
    `ls-demo.public.orders` o
JOIN
    `ls-demo.public.order_items` oi ON oi.orderid = o.orderid
LEFT JOIN
    `products_with_pk` p ON p.productid = oi.productid
JOIN
    `enriched_customers` c ON c.customerid = o.customerid
WHERE
    p.productname <> ''
    AND p.price > 0;
