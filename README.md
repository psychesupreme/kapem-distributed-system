# 🚜 KAPEM: Kenya Agricultural Produce Exchange Market

> A Distributed, Cloud-Native Database System for Agricultural Supply Chain Logistics.

![System Status](https://img.shields.io/badge/System-Distributed-blue) ![Docker](https://img.shields.io/badge/Container-Docker-2496ED) ![Node.js](https://img.shields.io/badge/Backend-Node.js-339933) ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)

## 📖 Project Overview
KAPEM is a **Distributed Database Management System (DDBMS)** designed to solve fragmentation in agricultural supply chains. It connects autonomous regional production hubs (e.g., Murang'a, Naivasha) into a unified national exchange.

Unlike monolithic systems, KAPEM uses a **Shared-Nothing Architecture** with **Topological Sharding**. Transactions are routed to specific physical nodes based on the geographic origin of the produce, ensuring high availability and partition tolerance.

## 🏗 System Architecture
The system is containerized using **Docker** and consists of four isolated microservices communicating over a bridge network:

1.  **API Gateway (Middleware):** A Node.js router that performs query decomposition and topological routing.
2.  **HQ Node (Nairobi):** Stores global metadata, RBAC (Role-Based Access Control) users, and audit logs.
3.  **Central Shard (Murang'a):** Handles high-value export crops (Avocado, Coffee) for the Central region.
4.  **Rift Shard (Naivasha):** Handles horticulture and dairy for the Rift Valley region.

## 🚀 Key Features
* **Topological Sharding:** Writes are automatically routed to `kapem_central` or `kapem_rift` based on town metadata.
* **ACID Transactions:** Implements Pessimistic Concurrency Control (`FOR UPDATE`) to prevent inventory race conditions.
* **Distributed Query Decomposition:** The Admin Dashboard aggregates data from multiple shards in real-time.
* **Hybrid Schema:** Utilizes SQL for financial integrity and `JSONB` for flexible, semi-structured receipt data.
* **FinTech Integration:** Features a simulated **M-Pesa STK Push** payment gateway.

## 🛠️ Tech Stack
* **Infrastructure:** Docker & Docker Compose
* **Database:** PostgreSQL 16 (Alpine Linux)
* **Backend:** Node.js (Raw HTTP/PG - No Frameworks)
* **Frontend:** Vanilla HTML/JS (Farmer Portal & Admin Console)

## 📦 Installation & Setup

### Prerequisites
* Docker Desktop installed and running.
* Node.js (v18+)

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/kapem-distributed-system.git](https://github.com/YOUR_USERNAME/kapem-distributed-system.git)
cd kapem-distributed-system