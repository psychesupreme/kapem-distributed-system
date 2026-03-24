const http = require('http');

const DEFAULT_PASSWORD = 'password123';

// ==========================================
// 1. ENTERPRISE ADMINS & FLEET (20 USERS)
// ==========================================
const admins = [
    // HQ Executives
    { role: 'HQ_ADMIN', username: 'hq_director', phone: '254700100001', business_name: 'National Secretariat', region: 'ALL' },
    { role: 'FINANCE_ADMIN', username: 'finance_head', phone: '254700100002', business_name: 'National Treasury', region: 'ALL' },
    { role: 'LOGISTICS_ADMIN', username: 'fleet_commander', phone: '254700100003', business_name: 'National Logistics', region: 'ALL' },
    { role: 'TECH_STAFF', username: 'sys_admin_ke', phone: '254700100004', business_name: 'IT Infrastructure', region: 'ALL' },

    // Regional Command & Warehouse Operations
    { role: 'REGION_ADMIN', username: 'central_manager', phone: '254711000001', business_name: 'Central Region HQ', region: 'CENTRAL' },
    { role: 'WAREHOUSE_ADMIN', username: 'nyeri_warehouse', phone: '254711000002', business_name: 'Nyeri Silos', region: 'CENTRAL' },
    
    { role: 'REGION_ADMIN', username: 'rift_manager', phone: '254722000001', business_name: 'Rift Valley HQ', region: 'RIFT' },
    { role: 'WAREHOUSE_ADMIN', username: 'naivasha_warehouse', phone: '254722000002', business_name: 'Naivasha Depots', region: 'RIFT' },
    
    { role: 'REGION_ADMIN', username: 'western_manager', phone: '254733000001', business_name: 'Western Region HQ', region: 'WESTERN' },
    { role: 'WAREHOUSE_ADMIN', username: 'kisumu_warehouse', phone: '254733000002', business_name: 'Kisumu Granaries', region: 'WESTERN' },
    
    { role: 'REGION_ADMIN', username: 'coast_manager', phone: '254744000001', business_name: 'Coast Region HQ', region: 'COAST' },
    { role: 'WAREHOUSE_ADMIN', username: 'mombasa_warehouse', phone: '254744000002', business_name: 'Mombasa Port Silos', region: 'COAST' },
    
    { role: 'REGION_ADMIN', username: 'northern_manager', phone: '254755000001', business_name: 'Northern Region HQ', region: 'NORTHERN' },
    { role: 'WAREHOUSE_ADMIN', username: 'garissa_warehouse', phone: '254755000002', business_name: 'Garissa Store', region: 'NORTHERN' },

    // Fleet Drivers & Logistics Partners
    { role: 'DRIVER', username: 'driver_kamau', phone: '254790000001', business_name: 'Truck KCA 123A', region: 'NONE' },
    { role: 'DRIVER', username: 'driver_ochieng', phone: '254790000002', business_name: 'Truck KCB 456B', region: 'NONE' },
    { role: 'DRIVER', username: 'driver_mutua', phone: '254790000003', business_name: 'Truck KCC 789C', region: 'NONE' },
    { role: 'DRIVER', username: 'driver_hassan', phone: '254790000004', business_name: 'Truck KCD 012D', region: 'NONE' },
    { role: 'DRIVER', username: 'driver_kiprotich', phone: '254790000005', business_name: 'Truck KCE 345E', region: 'NONE' },
    { role: 'PARTNER', username: 'pwani_freight', phone: '254790000006', business_name: 'Pwani Heavy Freight Ltd', region: 'NONE' }
];

// ==========================================
// 2. COMMERCIAL BUYERS (5 USERS)
// ==========================================
const buyers = [
    { role: 'WHOLESALE_BUYER', username: 'nairobi_millers', phone: '254780000001', business_name: 'Nairobi Millers Ltd', region: 'NONE' },
    { role: 'WHOLESALE_BUYER', username: 'tuskys_hq', phone: '254780000002', business_name: 'Supermarket Chain HQ', region: 'NONE' },
    { role: 'RETAIL_BUYER', username: 'mama_mboga_thika', phone: '254780000003', business_name: 'Thika Fresh Produce', region: 'NONE' },
    { role: 'RETAIL_BUYER', username: 'kisumu_fish_mkt', phone: '254780000004', business_name: 'Lake Basin Grocers', region: 'NONE' },
    { role: 'WHOLESALE_BUYER', username: 'mombasa_exporters', phone: '254780000005', business_name: 'Mombasa Exporters LLC', region: 'NONE' }
];

// ==========================================
// 3. GENERATE 45 FARMERS (9 Per Region)
// ==========================================
const regions = [
    { id: 'CENTRAL', towns: ['Nyeri', 'Muranga', 'Kiambu', 'Karatina', 'Othaya'], names: ['Kamau', 'Wanjiku', 'Mwangi', 'Njeri', 'Njoroge', 'Muthoni', 'Kariuki', 'Nyambura', 'Maina'] },
    { id: 'RIFT', towns: ['Naivasha', 'Nakuru', 'Eldoret', 'Kericho', 'Bomet'], names: ['Kipkemboi', 'Chebet', 'Kiprotich', 'Jepkogei', 'Koech', 'Cheruiyot', 'Kiptoo', 'Jelagat', 'Ruto'] },
    { id: 'WESTERN', towns: ['Kisumu', 'Kakamega', 'Bungoma', 'Siaya', 'Busia'], names: ['Ochieng', 'Anyango', 'Odhiambo', 'Akinyi', 'Otieno', 'Aoko', 'Ouma', 'Awino', 'Wekesa'] },
    { id: 'COAST', towns: ['Mombasa', 'Kilifi', 'Malindi', 'Lamu', 'Kwale'], names: ['Ali', 'Fatuma', 'Hassan', 'Halima', 'Omar', 'Amina', 'Bakari', 'Zainab', 'Salim'] },
    { id: 'NORTHERN', towns: ['Garissa', 'Wajir', 'Mandera', 'Isiolo', 'Lodwar'], names: ['Mohamed', 'Khadija', 'Abdi', 'Asha', 'Ibrahim', 'Nur', 'Yusuf', 'Amina', 'Ekal'] }
];

const farmers = [];
let phoneCounter = 254760000001;

regions.forEach(reg => {
    reg.names.forEach((name, index) => {
        const town = reg.towns[index % reg.towns.length];
        farmers.push({
            role: 'FARMER',
            username: `farmer_${name.toLowerCase()}`,
            phone: (phoneCounter++).toString(),
            business_name: `${name}'s ${town} Farm`,
            region: reg.id
        });
    });
});

const allUsers = [...admins, ...buyers, ...farmers];

// ==========================================
// 4. NETWORK INJECTION SCRIPT
// ==========================================
function registerUser(userData) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({ ...userData, password: DEFAULT_PASSWORD });
        const options = {
            hostname: 'localhost', port: 3000, path: '/api/register', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) console.log(`✅ [${userData.role}] ${userData.username} (${userData.region})`);
                else console.log(`❌ [FAILED] ${userData.username} -> ${JSON.parse(body).message}`);
                resolve();
            });
        });
        req.on('error', (e) => { console.error(`⚠️ Error: ${e.message}`); resolve(); });
        req.write(payload); req.end();
    });
}

async function runSeeder() {
    console.log("🚀 BOOTING KAPEM NETWORK SEEDER...\n");
    console.log(`Generating ${allUsers.length} total personnel across all 5 Kenyan shards...\n`);
    
    for (const user of allUsers) {
        await registerUser(user);
        await new Promise(r => setTimeout(r, 50)); // Tiny delay to prevent DB deadlocks
    }
    
    console.log("\n✨ DONE! KAPEM National Network is fully populated.");
    console.log("\n🔑 MASTER PASSWORD FOR ALL USERS: password123");
}

runSeeder();