const { hqPool, centralPool, riftPool, westernPool, coastPool, northPool } = require('../config/db');
const url = require('url');

async function logEvent(eventType, description) {
    try { await hqPool.query("INSERT INTO audit_logs (event_type, description) VALUES ($1, $2)", [eventType, description]); } 
    catch (err) { console.error("Audit Log Failed:", err.message); }
}

function getTargetDB(townOrRegion) {
    if (!townOrRegion) return null;
    const t = townOrRegion.toUpperCase();
    if (['MURANGA', 'NYERI', 'KIAMBU', 'CENTRAL'].includes(t)) return centralPool;
    if (['NAIVASHA', 'NAKURU', 'NAROK', 'RIFT'].includes(t)) return riftPool;
    if (['KISUMU', 'KAKAMEGA', 'BUNGOMA', 'WESTERN'].includes(t)) return westernPool;
    if (['MOMBASA', 'KILIFI', 'LAMU', 'COAST'].includes(t)) return coastPool;
    if (['GARISSA', 'TURKANA', 'ISIOLO', 'NORTH', 'NORTHERN'].includes(t)) return northPool;
    return null;
}

async function fetchFromShard(pool, query, regionName, defaultDepot) {
    try {
        const res = await pool.query(query);
        return res.rows.map(row => ({ ...row, region: regionName, depot: defaultDepot }));
    } catch (err) { return []; }
}

// 1. AUTHENTICATION
exports.registerUser = async (req, res) => {
    try {
        const { username, password, role, phone, business_name, region } = req.body;
        const check = await hqPool.query("SELECT * FROM system_users WHERE username = $1", [username]);
        if(check.rows.length > 0) throw new Error("Username already taken");
        await hqPool.query("INSERT INTO system_users (username, password_hash, role, phone, business_name, region_access) VALUES ($1, $2, $3, $4, $5, $6)", [username, password, role, phone, business_name, region || 'NONE']);
        await logEvent('USER_REGISTER', `New ${role} registered: ${username}`);
        res.writeHead(201, {'Content-Type': 'application/json'}); res.end(JSON.stringify({ status: 'success' }));
    } catch (err) {
        res.writeHead(400, {'Content-Type': 'application/json'}); res.end(JSON.stringify({ status: 'error', message: err.message }));
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await hqPool.query("SELECT * FROM system_users WHERE username = $1", [username]);
        if (result.rows.length === 0 || result.rows[0].password_hash !== password) throw new Error("Invalid Credentials");
        const user = result.rows[0];
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ status: 'success', user: { id: user.user_id, username: user.username, role: user.role, business_name: user.business_name, phone: user.phone, region_access: user.region_access } }));
    } catch (err) {
        res.writeHead(401, {'Content-Type': 'application/json'}); res.end(JSON.stringify({ status: 'error', message: err.message }));
    }
};

// 2. WAREHOUSE & LOGISTICS OPERATIONS
exports.getWarehouseInventory = async (req, res) => {
    try {
        const reqUrl = url.parse(req.url, true);
        const { region_access } = reqUrl.query;
        const query = "SELECT request_id, farmer_name, produce_type, quantity_kg, request_status, storage_bin, quality_status FROM warehouse_requests WHERE request_status IN ('APPROVED', 'SOLD') ORDER BY created_at DESC";
        
        let results = [];
        if (region_access === 'ALL') {
            const all = await Promise.all([
                fetchFromShard(centralPool, query, 'CENTRAL', 'CENTRAL'), fetchFromShard(riftPool, query, 'RIFT', 'RIFT'),
                fetchFromShard(westernPool, query, 'WESTERN', 'WESTERN'), fetchFromShard(coastPool, query, 'COAST', 'COAST'),
                fetchFromShard(northPool, query, 'NORTHERN', 'NORTHERN')
            ]);
            results = all.flat();
        } else {
            const pool = getTargetDB(region_access);
            if(pool) results = await fetchFromShard(pool, query, region_access, region_access);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(results));
    } catch(err) {
        res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message }));
    }
};

exports.updateWarehouseBin = async (req, res) => {
    try {
        const { request_id, town, storage_bin, quality_status } = req.body;
        const targetDB = getTargetDB(town);
        if(!targetDB) throw new Error(`Gateway Error: Target Shard '${town}' is offline or invalid.`);
        await targetDB.query("UPDATE warehouse_requests SET storage_bin = $1, quality_status = $2 WHERE request_id = $3", [storage_bin, quality_status, request_id]);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ status: 'success' }));
    } catch(err) {
        res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message }));
    }
};

exports.getLogisticsData = async (req, res) => {
    try {
        const result = await hqPool.query("SELECT * FROM logistics_fleet ORDER BY dispatched_at DESC");
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result.rows));
    } catch(err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
};

// 3. E-COMMERCE & BUYER OPERATIONS
exports.checkoutCart = async (req, res) => {
    const { buyer_id, buyer_name, cart } = req.body;
    let successCount = 0; let totalCartValue = 0;

    try {
        for (const item of cart) {
            const targetDB = getTargetDB(item.depot);
            if (targetDB) {
                const client = await targetDB.connect();
                try {
                    await client.query('BEGIN');
                    const check = await client.query("SELECT request_status FROM warehouse_requests WHERE request_id = $1 FOR UPDATE", [item.request_id]);
                    if (check.rows.length > 0 && check.rows[0].request_status === 'APPROVED') {
                        await client.query("UPDATE warehouse_requests SET request_status = 'SOLD' WHERE request_id = $1", [item.request_id]);
                        await client.query("INSERT INTO sales_transactions (request_id, buyer_name, amount_paid) VALUES ($1, $2, $3)", [item.request_id, buyer_name, item.price]);
                        await client.query('COMMIT');
                        successCount++; totalCartValue += item.price;
                    } else { await client.query('ROLLBACK'); }
                } catch(e) { await client.query('ROLLBACK'); } 
                finally { client.release(); }
            }
        }
        
        if (successCount > 0) {
            const mockMpesa = "PK" + Math.floor(10000000 + Math.random() * 90000000) + "XYZ"; 
            const saleRes = await hqPool.query(
                "INSERT INTO sales_ledger (buyer_id, total_amount, items_json, mpesa_receipt, payment_status) VALUES ($1, $2, $3, $4, 'COMPLETED') RETURNING sale_id", 
                [buyer_id, totalCartValue, JSON.stringify(cart), mockMpesa]
            );
            
            const saleId = saleRes.rows[0].sale_id;
            
            const uniqueDepots = [...new Set(cart.map(i => i.depot))];
            for(const depot of uniqueDepots) {
                await hqPool.query(
                    "INSERT INTO logistics_fleet (sale_id, driver_name, vehicle_plate, origin_depot, destination, status) VALUES ($1, $2, $3, $4, $5, 'PENDING_DISPATCH')",
                    [saleId, 'Unassigned', 'TBD', depot, buyer_name]
                );
            }
        }

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ status: 'success', bought: successCount, total: totalCartValue }));
    } catch (err) {
        res.writeHead(500, {'Content-Type': 'application/json'}); res.end(JSON.stringify({ error: err.message }));
    }
};

exports.getMarketplaceInventory = async (req, res) => {
    try {
        const query = "SELECT request_id, produce_type, quantity_kg, storage_fee, farmer_name FROM warehouse_requests WHERE request_status = 'APPROVED'";
        const results = await Promise.all([
            fetchFromShard(centralPool, query, "CENTRAL", "CENTRAL"), fetchFromShard(riftPool, query, "RIFT", "RIFT"),
            fetchFromShard(westernPool, query, "WESTERN", "WESTERN"), fetchFromShard(coastPool, query, "COAST", "COAST"),
            fetchFromShard(northPool, query, "NORTHERN", "NORTHERN")
        ]);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(results.flat()));
    } catch(err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
};

// NEW: Fetch Buyer History
exports.getBuyerHistory = async (req, res) => {
    try {
        const { buyer_id } = req.body;
        const result = await hqPool.query("SELECT sale_id, total_amount, sale_date, payment_status, items_json FROM sales_ledger WHERE buyer_id = $1 ORDER BY sale_date DESC", [buyer_id]);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result.rows));
    } catch(err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ error: err.message }));
    }
};

// 4. ADMIN & FINANCE
exports.getAdminWarehouseData = async (req, res) => {
    try {
        const reqUrl = url.parse(req.url, true);
        const { role, region_access } = reqUrl.query;
        if (['DRIVER', 'TECH_STAFF', 'FINANCE_ADMIN'].includes(role)) throw new Error("403 Forbidden");

        const query = 'SELECT request_id, farmer_name, farmer_phone, produce_type, quantity_kg, storage_fee, request_status FROM warehouse_requests ORDER BY created_at DESC';
        let queries = [];

        if (role === 'HQ_ADMIN' || region_access === 'ALL') {
            queries = [
                fetchFromShard(centralPool, query, "CENTRAL", "CENTRAL"), fetchFromShard(riftPool, query, "RIFT", "RIFT"),
                fetchFromShard(westernPool, query, "WESTERN", "WESTERN"), fetchFromShard(coastPool, query, "COAST", "COAST"),
                fetchFromShard(northPool, query, "NORTHERN", "NORTHERN")
            ];
        } else {
            const pool = getTargetDB(region_access);
            if(pool) queries = [fetchFromShard(pool, query, region_access, region_access)];
        }
        const results = await Promise.all(queries);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(results.flat()));
    } catch(err) { res.writeHead(err.message.includes('403') ? 403 : 500); res.end(JSON.stringify({ error: err.message })); }
};

exports.updateWarehouseStatus = async (req, res) => {
    try {
        const { request_id, town, status, role } = req.body;
        if (['DRIVER', 'TECH_STAFF', 'LOGISTICS_ADMIN', 'FINANCE_ADMIN'].includes(role)) throw new Error("403 Forbidden");
        const targetDB = getTargetDB(town); 
        await targetDB.query('UPDATE warehouse_requests SET request_status = $1 WHERE request_id = $2', [status, request_id]);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: "Status Updated" }));
    } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
};

exports.getSystemLogs = async (req, res) => {
    try {
        const reqUrl = url.parse(req.url, true);
        if (reqUrl.query.role !== 'HQ_ADMIN' && reqUrl.query.role !== 'TECH_STAFF') throw new Error("403 Forbidden");
        const result = await hqPool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50");
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result.rows));
    } catch (err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
};

exports.getSystemHealth = async (req, res) => {
    const checkShard = async (pool, name) => {
        const start = Date.now();
        try { await pool.query('SELECT 1'); return { name, status: 'ONLINE', latency: Date.now() - start }; } 
        catch (err) { return { name, status: 'OFFLINE', latency: 0 }; }
    };
    const health = await Promise.all([
        checkShard(hqPool, 'HQ Core'), checkShard(centralPool, 'Central Shard'),
        checkShard(riftPool, 'Rift Shard'), checkShard(westernPool, 'Western Shard'),
        checkShard(coastPool, 'Coast Shard'), checkShard(northPool, 'North Shard')
    ]);
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(health));
};

exports.getFinanceAnalytics = async (req, res) => {
    try {
        const result = await hqPool.query(`SELECT sl.sale_id, sl.total_amount, sl.sale_date, sl.mpesa_receipt, sl.payment_status, u.business_name as buyer_name FROM sales_ledger sl LEFT JOIN system_users u ON sl.buyer_id = u.user_id ORDER BY sl.sale_date DESC`);
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result.rows));
    } catch(err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
};

exports.requestWarehousing = async (req, res) => {
    try {
        const { town, farmer_name, phone, produce, qty, storage_type } = req.body;
        const targetDB = getTargetDB(town);
        await targetDB.query(`INSERT INTO warehouse_requests (farmer_name, farmer_phone, produce_type, quantity_kg, storage_type, request_status, created_at) VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())`, [farmer_name, phone, produce, qty, storage_type]);
        res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ status: 'success' }));
    } catch (err) { res.writeHead(500); res.end(JSON.stringify({ status: 'error', error: err.message })); }
};

exports.getFarmerHistory = async (req, res) => {
    try {
        const { phone } = req.body;
        const query = "SELECT produce_type, quantity_kg, request_status, created_at FROM warehouse_requests WHERE farmer_phone = $1 ORDER BY created_at DESC";
        const fetchSafe = async (pool, depotName) => { try { const r = await pool.query(query, [phone]); return r.rows.map(row => ({...row, depot: depotName})); } catch(e) { return []; } };
        const results = await Promise.all([ fetchSafe(centralPool, 'CENTRAL'), fetchSafe(riftPool, 'RIFT'), fetchSafe(westernPool, 'WESTERN'), fetchSafe(coastPool, 'COAST'), fetchSafe(northPool, 'NORTHERN') ]);
        res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify(results.flat()));
    } catch(err) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
};