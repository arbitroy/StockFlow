CREATE TABLE stock_items (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id),
    quantity INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    reference VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE sales (
    id UUID PRIMARY KEY,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total DECIMAL(10,2) NOT NULL,
    reference VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Indexes for better query performance
CREATE INDEX idx_stock_items_sku ON stock_items(sku);
CREATE INDEX idx_stock_items_status ON stock_items(status);
CREATE INDEX idx_stock_movements_item_date ON stock_movements(stock_item_id, created_at);
CREATE INDEX idx_sales_reference ON sales(reference);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

-- V2__add_audit_triggers.sql will be created when we implement audit logging