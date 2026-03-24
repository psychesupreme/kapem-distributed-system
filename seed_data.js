const http = require('http');

const regions = [
    { name: 'Central', towns: ['MURANGA', 'NYERI', 'KIAMBU'], crops: ['Coffee', 'Tea', 'Avocado'], count: 12 },
    { name: 'Rift', towns: ['NAIVASHA', 'NAKURU', 'NAROK'], crops: ['Maize', 'Flowers', 'Wheat'], count: 12 },
    { name: 'Western', towns: ['KISUMU', 'KAKAMEGA'], crops: ['Maize', 'Sugar', 'Fish'], count: 6 },
    { name: 'Coast', towns: ['MOMBASA', 'KILIFI'], crops: ['Coconut', 'Cashew', 'Fish'], count: 6 },
    { name: 'North', towns: ['GARISSA', 'TURKANA'], crops: ['Meat', 'Livestock'], count: 6 }
];

const names = ["John K.", "Mary W.", "Peter O.", "Grace M.", "David K.", "Alice N.", "Mohammed A.", "Fatuma S.", "James R.", "Esther C."];

function postRequest(data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/warehouse',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    process.stdout.write("✅ "); // Success tick
                    resolve();
                } else {
                    process.stdout.write("❌ "); // Fail cross
                    console.log(`\nFailed: ${body}`);
                    resolve(); // Resolve anyway to keep going
                }
            });
        });

        req.on('error', (e) => {
            console.error(`\n⚠️ Network Error: ${e.message}`);
            resolve();
        });
        
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function runSeeder() {
    console.log("🚀 STARTING GENTLE DATA SEEDING...");
    
    for (const region of regions) {
        console.log(`\n🌱 Seeding ${region.name} Region (${region.count} items)...`);
        
        for (let i = 0; i < region.count; i++) {
            const town = region.towns[Math.floor(Math.random() * region.towns.length)];
            const crop = region.crops[Math.floor(Math.random() * region.crops.length)];
            const name = names[Math.floor(Math.random() * names.length)];
            const qty = Math.floor(Math.random() * 2000) + 100;

            const payload = {
                town: town,
                farmer_name: `${name} (${region.name})`,
                phone: "2547" + Math.floor(Math.random() * 100000000),
                produce: crop,
                qty: qty,
                storage_type: qty > 1000 ? "Large Scale" : "Small Scale"
            };

            // Wait 500ms between requests to be safe
            await postRequest(payload);
            await new Promise(r => setTimeout(r, 500)); 
        }
    }
    console.log("\n\n✨ DONE! Go to Admin Console to Approve.");
}

runSeeder();