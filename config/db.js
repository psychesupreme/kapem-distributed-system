const { Pool } = require('pg');

// We read the configuration from the Environment (Docker variables)
// This is the "Handshake" between Node and Docker
const dbConfig = {
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'securepass123',
    port: 5432, // Internal Docker Port
};

// 1. Connection to HQ
const hqPool = new Pool({
    ...dbConfig,
    host: process.env.DB_HOST_HQ || 'localhost', // Fallback to localhost for testing without Docker
    database: 'kapem_hq',
    port: process.env.DB_HOST_HQ ? 5432 : 5432 // If local, use 5432
});

// 2. Connection to Central (Murang'a)
const centralPool = new Pool({
    ...dbConfig,
    host: process.env.DB_HOST_CENTRAL || 'localhost',
    database: 'kapem_central',
    port: process.env.DB_HOST_CENTRAL ? 5432 : 5433 // If local, use 5433
});

// 3. Connection to Rift (Naivasha)
const riftPool = new Pool({
    ...dbConfig,
    host: process.env.DB_HOST_RIFT || 'localhost',
    database: 'kapem_rift',
    port: process.env.DB_HOST_RIFT ? 5432 : 5434 // If local, use 5434
});

console.log("🔌 Database Bridges Built: JSON <--> SQL");

module.exports = { hqPool, centralPool, riftPool };