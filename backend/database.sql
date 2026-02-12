-- =============================================
-- SR Resolve - MySQL Database Schema
-- Execute este script no phpMyAdmin do CPanel
-- =============================================

CREATE DATABASE IF NOT EXISTS sr_resolve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sr_resolve;

-- Tabela de Usuários/Autenticação
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'technician') DEFAULT 'technician',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO users (username, password, role) VALUES 
('srresolve', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE username = username;

-- Tabela de Técnicos
CREATE TABLE IF NOT EXISTS technicians (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  specialty VARCHAR(100),
  rg VARCHAR(20),
  cpf VARCHAR(14),
  profile_photo LONGTEXT,
  document_photo LONGTEXT,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela de Ordens de Serviço
CREATE TABLE IF NOT EXISTS service_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(200) NOT NULL,
  client_phone VARCHAR(20),
  client_email VARCHAR(200),
  service_type ENUM('hydraulic', 'electrical', 'both') NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  observation TEXT,
  labor_cost DECIMAL(10, 2) DEFAULT 0,
  material_cost DECIMAL(10, 2) DEFAULT 0,
  material_description TEXT,
  status ENUM('open', 'executing', 'executed', 'closed') DEFAULT 'open',
  assigned_technician VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL
) ENGINE=InnoDB;

-- Tabela de Fotos das OS
CREATE TABLE IF NOT EXISTS order_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  phase ENUM('before', 'during', 'after') NOT NULL,
  photo_data LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES service_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabela de Chamados de Clientes
CREATE TABLE IF NOT EXISTS client_tickets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'in_progress', 'completed') DEFAULT 'pending',
  linked_order_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (linked_order_id) REFERENCES service_orders(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabela de Fotos dos Chamados
CREATE TABLE IF NOT EXISTS ticket_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(36) NOT NULL,
  photo_data LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES client_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;
