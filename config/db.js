const { Pool } = require('pg');

const createPool = (host, port, database) => new Pool({
    user: 'admin',
    host: host,
    database: database,
    password: 'admin_secret',
    port: 5432 // Internal Docker Port
});

// Define Connections
const hqPool = createPool('kapem_hq', 5432, 'kapem_hq');
const centralPool = createPool('kapem_central', 5432, 'kapem_central');
const riftPool = createPool('kapem_rift', 5432, 'kapem_rift');

// NEW REGIONS
const westernPool = createPool('kapem_western', 5432, 'kapem_western');
const coastPool = createPool('kapem_coast', 5432, 'kapem_coast');
const northPool = createPool('kapem_north', 5432, 'kapem_north');

module.exports = { 
    hqPool, 
    centralPool, 
    riftPool,
    westernPool,
    coastPool,
    northPool
};