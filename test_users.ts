const http = require('http');

// The Ultimate Enterprise Roster
const testUsers = [
    // 1. MASTER COMMAND
    { role: 'HQ_ADMIN', username: 'hq_boss', password: 'password123', phone: '254700000001', business_name: 'National Directorate', region: 'ALL' },
    
    // 2. REGIONAL MANAGEMENT
    { role: 'REGION_ADMIN', username: 'central_boss', password: 'password123', phone: '254700000002', business_name: 'Central Region HQ', region: 'CENTRAL' },
    { role: 'WAREHOUSE_ADMIN', username: 'rift_warehouse', password: 'password123', phone: '254700000003', business_name: 'Naivasha Silos', region: 'RIFT' },
    
    // 3. LOGISTICS & IT
    { role: 'LOGISTICS_ADMIN', username: 'fleet_master', password: 'password123', phone: '254700000004', business_name: 'KAPEM Fleet Ops', region: 'ALL' },
    { role: 'DRIVER', username: 'driver_john', password: 'password123', phone: '254700000005', business_name: 'Transit Vehicle KCD 123', region: 'NONE' },
    { role: 'TECH_STAFF', username: 'sys_admin', password: 'password123', phone: '254700000006', business_name: 'Network Infrastructure', region: 'ALL' },
    
    // 4. EXTERNAL CLIENTS
    { role: 'WHOLESALE_BUYER', username: 'nairobi_wholesale', password: 'password123', phone: '254700000007', business_name: 'Nairobi Fresh Produce', region: 'NONE' },
    { role: 'RETAIL_BUYER', username: 'limuru_retail', password: 'password123', phone: '254700000008', business_name: 'Limuru Grocers', region: 'NONE' },
    { role: 'FARMER', username: 'aberdares_farm', password: 'password123', phone: '254700000009', business_name: 'Aberdares Orchards', region: 'CENTRAL' },
    { role: 'PARTNER', username: 'coast_transit', password: 'password123', phone: '254700000010', business_name: 'Pwani Trucking', region: 'COAST' }
];

function registerUser(userData) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    console.log(`✅ Success: [${userData.role}] ${userData.username}`);
                } else {
                    console.log(`❌ Failed:  [${userData.role}] ${userData.username} -> ${JSON.parse(body).message}`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`⚠️ Network Error: ${e.message}`);
            resolve();
        });
        
        req.write(JSON.stringify(userData));
        req.end();
    });
}

async function runSeeder() {
    console.log("🚀 STARTING ENTERPRISE USER GENERATION...\n");
    
    for (const user of testUsers) {
        await registerUser(user);
        await new Promise(r => setTimeout(r, 200)); // Slight delay to prevent DB locking
    }
    
    console.log("\n✨ DONE! All test personnel have been provisioned.");
}

runSeeder();