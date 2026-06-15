-- Fix numeric field overflow in health_records
-- height_cm e weight_kg precisam de precisao suficiente para valores como 170 e 65.5
ALTER TABLE health_records
  ALTER COLUMN height_cm TYPE NUMERIC(6,2),
  ALTER COLUMN weight_kg TYPE NUMERIC(6,2);
