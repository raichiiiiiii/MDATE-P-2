INSERT INTO roles (name, description)
VALUES ('patient', 'Default role for MDATE patients')
ON CONFLICT (name) DO NOTHING;
