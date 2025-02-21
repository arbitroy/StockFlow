-- Create locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Create stock_locations table referenced by StockLocation entity
CREATE TABLE stock_locations (
    id UUID PRIMARY KEY,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    opening_quantity INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_stock_locations_item ON stock_locations(stock_item_id);
CREATE INDEX idx_stock_locations_location ON stock_locations(location_id);

-- Add location_id column to stock_movements table (referenced in StockMovement entity)
ALTER TABLE stock_movements 
ADD COLUMN location_id UUID REFERENCES locations(id);