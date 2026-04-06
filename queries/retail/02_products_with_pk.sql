-- LAB1: Create products table with PRIMARY KEY constraint
-- This is required for temporal joins

CREATE TABLE IF NOT EXISTS `products_with_pk` (
    `productid` INT NOT NULL,
    `brand` STRING NOT NULL,
    `productname` STRING NOT NULL,
    `category` STRING NOT NULL,
    `description` STRING,
    `color` STRING,
    `size` STRING,
    `price` INT NOT NULL,
    PRIMARY KEY (`productid`) NOT ENFORCED
)
AS
SELECT  `productid`,
    `brand`,
    `productname`,
    `category`,
    `description`,
    `color`,
    `size`,
    CAST(price AS INT) AS price
FROM `ls-demo.public.products`;
