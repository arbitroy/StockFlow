-- Add check constraints for data integrity
ALTER TABLE stock_items
    ADD CONSTRAINT chk_stock_items_price_positive 
    CHECK (price >= 0);

ALTER TABLE stock_items
    ADD CONSTRAINT chk_stock_items_quantity_non_negative 
    CHECK (quantity >= 0);

ALTER TABLE stock_movements
    ADD CONSTRAINT chk_stock_movements_quantity_positive 
    CHECK (quantity > 0);

ALTER TABLE sale_items
    ADD CONSTRAINT chk_sale_items_quantity_positive 
    CHECK (quantity > 0),
    ADD CONSTRAINT chk_sale_items_price_positive 
    CHECK (price >= 0),
    ADD CONSTRAINT chk_sale_items_total_positive 
    CHECK (total >= 0);

ALTER TABLE sales
    ADD CONSTRAINT chk_sales_total_non_negative 
    CHECK (total >= 0);