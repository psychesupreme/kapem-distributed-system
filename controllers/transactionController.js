// CONTROLLER: Handles the Business Logic
const { hqPool, centralPool, riftPool } = require('../config/db');
const mpesa = require('../mpesa'); // We will move mpesa.js later, keep it in root for now

exports.processTransaction = async (req, res) => {
    let client;
    try {
        const { town, total_amount, cart_data, cashier_id } = req.body;

        console.log(`🌍 [Docker] Incoming Transaction from: ${town}`);

        // 1. TOPOLOGICAL SHARDING (Using Docker Pools)
        const regionMap = {
            'MURANGA': centralPool, 
            'NYERI': centralPool,
            'KIAMBU': centralPool,
            'MERU': centralPool,
            'NAIVASHA': riftPool,
            'NAKURU': riftPool,
            'NAROK': riftPool
        };

        const targetDB = regionMap[town ? town.toUpperCase() : 'UNKNOWN'];
        if (!targetDB) throw new Error(`❌ Routing Error: Town '${town}' unknown.`);

        // 2. SECURITY GATEKEEPER (Check HQ Node)
        // Note: We use hqPool here!
        const authRes = await hqPool.query('SELECT role FROM system_users WHERE user_id = $1', [cashier_id]);
        if (authRes.rows.length === 0) throw new Error("⛔ SECURITY ALERT: Unauthorized.");

        // 3. COMMERCE (M-PESA)
        // Use a test phone number for docker demo
        const mpesaRes = await mpesa.triggerSTKPush("254700000000", total_amount, town);
        if (mpesaRes.ResponseCode && mpesaRes.ResponseCode !== "0") {
            throw new Error("Payment Failed: " + mpesaRes.errorMessage);
        }
        const mpesaRef = mpesaRes.CheckoutRequestID || ("DOCKER-MOCK-" + Date.now());

        // 4. ACID TRANSACTION
        client = await targetDB.connect();
        await client.query('BEGIN');

        // Inventory Check
        const product_id = cart_data[0].product_id || (town.toUpperCase() === 'NAIVASHA' ? 300 : 200);
        const qty = cart_data[0].qty;

        const stockRes = await client.query('SELECT quantity_on_hand FROM inventory WHERE product_id = $1 FOR UPDATE', [product_id]);
        if (stockRes.rows.length === 0) throw new Error(`Product ${product_id} not found.`);
        if (stockRes.rows[0].quantity_on_hand < qty) throw new Error(`Insufficient Stock.`);

        await client.query('UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1 WHERE product_id = $2', [qty, product_id]);

        const insertRes = await client.query(
            `INSERT INTO transactions (cashier_id, total_amount, cart_data, mpesa_reference, payment_status, created_at)
             VALUES ($1, $2, $3, $4, 'COMPLETED', NOW()) RETURNING txn_id`,
            [cashier_id, total_amount, JSON.stringify(cart_data), mpesaRef]
        );

        await client.query('COMMIT');

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'success', 
            txn_id: insertRes.rows[0].txn_id,
            payment_ref: mpesaRef
        }));

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error(`❌ Error: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
    } finally {
        if (client) client.release();
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        console.log("📊 [Docker] Generating National Report...");
        const [resCentral, resRift] = await Promise.all([
            centralPool.query('SELECT total_amount FROM transactions'),
            riftPool.query('SELECT total_amount FROM transactions')
        ]);

        const totalCentral = resCentral.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
        const totalRift = resRift.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            national_total: totalCentral + totalRift,
            breakdown: {
                central_region: { revenue: totalCentral },
                rift_region: { revenue: totalRift }
            }
        }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
};


exports.requestWarehousing = async (req, res) => {
    let client;
    try {
        console.log("🚜 [Docker] Incoming Warehouse Request...");
        const { town, farmer_name, phone, produce, qty, storage_type } = req.body;

        // 1. TOPOLOGICAL ROUTING (Same Sharding Logic)
        const regionMap = {
            'MURANGA': centralPool, 'NYERI': centralPool, 'KIAMBU': centralPool,
            'NAIVASHA': riftPool, 'NAKURU': riftPool, 'NAROK': riftPool
        };
        const targetDB = regionMap[town ? town.toUpperCase() : 'UNKNOWN'];
        if (!targetDB) throw new Error(`❌ Routing Error: Town '${town}' unknown.`);

        // 2. CALCULATE STORAGE FEE (Business Logic)
        // e.g., 10 KES per KG for storage
        const storageFee = qty * 10; 

        // 3. M-PESA PAYMENT (Storage Fee)
        // Trigger STK Push to Farmer's Phone
        const mpesaRes = await mpesa.triggerSTKPush(phone, storageFee, "StorageFee");
        const mpesaRef = mpesaRes.CheckoutRequestID || ("STORE-" + Date.now());

        // 4. SAVE TO DATABASE
        client = await targetDB.connect();
        const insertRes = await client.query(
            `INSERT INTO warehouse_requests 
            (farmer_name, farmer_phone, produce_type, quantity_kg, storage_type, storage_fee, mpesa_reference, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING request_id`,
            [farmer_name, phone, produce, qty, storage_type, storageFee, mpesaRef]
        );

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'success', 
            request_id: insertRes.rows[0].request_id,
            fee_paid: storageFee,
            message: `Warehouse Request Sent to ${town} Depot`
        }));

    } catch (err) {
        console.error(`❌ Warehouse Error: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
    } finally {
        if (client) client.release();
    }
};

exports.getAdminWarehouseData = async (req, res) => {
    try {
        console.log("👮 [Admin] Fetching Distributed Warehouse Data...");
        
        // Parallel Query: Ask BOTH Central and Rift shards for their data
        const query = 'SELECT request_id, farmer_name, farmer_phone, produce_type, quantity_kg, storage_fee, request_status FROM warehouse_requests ORDER BY created_at DESC';
        
        const [resCentral, resRift] = await Promise.all([
            centralPool.query(query),
            riftPool.query(query)
        ]);

        // Tag the data with its Origin Region (Since the DB doesn't always store it)
        const centralData = resCentral.rows.map(row => ({ ...row, region: 'CENTRAL (Murang\'a)' }));
        const riftData = resRift.rows.map(row => ({ ...row, region: 'RIFT (Naivasha)' }));

        // Merge and Send
        const allData = [...centralData, ...riftData];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(allData));

    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
};