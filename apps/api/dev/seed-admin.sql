-- 这个种子只用于本地联调，方便直接验证 admin 登录、刷新和登出三条接口。
INSERT OR IGNORE INTO users (id, status, display_name, primary_email_id, created_at_ms, updated_at_ms, last_login_at_ms)
VALUES
  ('019e0c99-85c9-7c13-a83c-2e0210f6fb9f', 'active', 'Local Admin', '019e0c99-85c9-7c13-a83c-2e035a7927c5', 1746816000000, 1746816000000, NULL),
  ('019e0c99-85c9-7c13-a83c-2e0681877bba', 'active', 'Local Staff', '019e0c99-85c9-7c13-a83c-2e08d746c47f', 1746816000000, 1746816000000, NULL);

INSERT OR IGNORE INTO user_emails (id, user_id, email, normalized_email, is_primary, is_verified, verified_at_ms, source, created_at_ms, updated_at_ms)
VALUES
  ('019e0c99-85c9-7c13-a83c-2e035a7927c5', '019e0c99-85c9-7c13-a83c-2e0210f6fb9f', 'admin@example.com', 'admin@example.com', 1, 1, 1746816000000, 'password', 1746816000000, 1746816000000),
  ('019e0c99-85c9-7c13-a83c-2e08d746c47f', '019e0c99-85c9-7c13-a83c-2e0681877bba', 'staff@example.com', 'staff@example.com', 1, 1, 1746816000000, 'password', 1746816000000, 1746816000000);

INSERT OR IGNORE INTO password_credentials (id, user_id, email_id, password_hash, password_algo, password_updated_at_ms, failed_attempts, locked_until_ms, must_reset_password, created_at_ms, updated_at_ms)
VALUES
  ('019e0c99-85c9-7c13-a83c-2e0411494743', '019e0c99-85c9-7c13-a83c-2e0210f6fb9f', '019e0c99-85c9-7c13-a83c-2e035a7927c5', '$2b$10$WZF9xjyodHnKM2ajdGC.6.C965rG4wNBkdK5aD9Y0WOFi3j8mCTum', 'bcrypt', 1746816000000, 0, NULL, 0, 1746816000000, 1746816000000),
  ('019e0c99-85c9-7c13-a83c-2e094da9a3db', '019e0c99-85c9-7c13-a83c-2e0681877bba', '019e0c99-85c9-7c13-a83c-2e08d746c47f', '$2b$10$WZF9xjyodHnKM2ajdGC.6.C965rG4wNBkdK5aD9Y0WOFi3j8mCTum', 'bcrypt', 1746816000000, 0, NULL, 0, 1746816000000, 1746816000000);

INSERT OR IGNORE INTO user_role_bindings (id, user_id, role_id, status, granted_at_ms, revoked_at_ms)
VALUES
  ('019e0c99-85c9-7c13-a83c-2e059dcee3f9', '019e0c99-85c9-7c13-a83c-2e0210f6fb9f', '019e0c99-85c9-7c13-a83c-2e00a09d54e3', 'active', 1746816000000, NULL);
