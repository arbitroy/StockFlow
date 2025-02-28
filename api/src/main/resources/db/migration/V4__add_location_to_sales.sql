-- Add location_id column to sales table if it doesn't exist
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_location ON sales(location_id);

-- Add constraints for data integrity
ALTER TABLE stock_locations
ADD CONSTRAINT unique_stock_location UNIQUE (stock_item_id, location_id);

-- Create a view for inventory by location
CREATE OR REPLACE VIEW inventory_by_location AS
SELECT
    l.id AS location_id,
    l.name AS location_name,
    l.type AS location_type,
    si.id AS stock_item_id,
    si.name AS item_name,
    si.sku,
    si.price,
    COALESCE(sl.quantity, 0) AS quantity,
    si.status
FROM
    locations l
CROSS JOIN
    stock_items si
LEFT JOIN
    stock_locations sl ON l.id = sl.location_id AND si.id = sl.stock_item_id
ORDER BY
    l.name, si.name;