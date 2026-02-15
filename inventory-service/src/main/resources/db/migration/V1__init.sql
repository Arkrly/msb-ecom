CREATE TABLE t_inventory (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sku_code VARCHAR(255),
    quantity INT,
    PRIMARY KEY (id)
);

-- Seed data for testing
INSERT INTO t_inventory (sku_code, quantity) VALUES ('iphone_15', 100);
INSERT INTO t_inventory (sku_code, quantity) VALUES ('samsung_s24', 50);
INSERT INTO t_inventory (sku_code, quantity) VALUES ('pixel_9', 0);
