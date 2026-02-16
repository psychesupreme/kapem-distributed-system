/**
 * KAPEM CLIENT (OOP Implementation)
 * Concepts: Encapsulation, Asynchronous UI, HCI Feedback Loops
 */

// CLASS 1: UI Component for a Network Node
class NetworkNode {
    constructor(elementId, name) {
        this.element = document.getElementById(elementId);
        this.name = name;
    }

    // HCI: Visual Feedback when a node is active
    pulse() {
        if(this.element) {
            this.element.classList.add('active');
            setTimeout(() => this.element.classList.remove('active'), 500);
        }
    }
}

// CLASS 2: The Main Application Logic
class HelixApp {
    constructor() {
        // Initialize Nodes
        this.nodes = {
            central: new NetworkNode('node-central', 'HQ'),
            north: new NetworkNode('node-north', 'North'), // Represents Central Region (Muranga)
            south: new NetworkNode('node-south', 'South')  // Represents Rift Region (Naivasha)
        };
        
        this.logContainer = document.getElementById('logs');
        this.checkSystemStatus();
    }

    // SYSTEM DESIGN: Monitoring Health
    async checkSystemStatus() {
        this.log("Checking Network Status...", "info");
        try {
            const res = await fetch('http://localhost:3000/api/status');
            const data = await res.json();
            
            if(data.system === "ONLINE") {
                this.log("✅ System Online. All Shards Connected.", "log-success");
                Object.values(this.nodes).forEach(node => node.pulse());
                
                // Auto-load analytics if system is up
                this.fetchAnalytics();
            }
        } catch (err) {
            this.log("❌ CRITICAL: Middleware Disconnected", "log-error");
        }
    }

    // COMMERCE: Handling the Financial Transaction
    async submitTransaction() {
        const townSelector = document.getElementById('regionInput');
        const selectedTown = townSelector.value;
        const amount = document.getElementById('amountInput').value;
        const cartRaw = document.getElementById('cartInput').value;

        // Basic Validation
        if (!amount || !cartRaw) {
            alert("Please fill all fields");
            return;
        }

        this.log(`Attempting routing for ${selectedTown}...`, "info");
        this.nodes.central.pulse(); // Request hits HQ first

        try {
            // === KEY FIX HERE: We send 'town', not 'region' ===
            const payload = {
                town: selectedTown, // <--- MATCHES SERVER.JS EXPECTATION
                total_amount: parseFloat(amount),
                cashier_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", 
                cart_data: JSON.parse(cartRaw)
            };

            const res = await fetch('http://localhost:3000/api/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (result.status === 'success') {
                this.log(`✅ Transaction Committed! ID: ${result.txn_id}`, "log-success");
                if(result.payment_ref) {
                     this.log(`💳 Payment Ref: ${result.payment_ref}`, "log-success");
                }
                
                // Visual routing feedback based on Town Mapping
                // Central Region Towns -> North Node Visual
                if (['MURANGA', 'NYERI', 'KIAMBU', 'MERU'].includes(selectedTown)) {
                    this.nodes.north.pulse();
                } 
                // Rift Region Towns -> South Node Visual
                else {
                    this.nodes.south.pulse();
                }

                // Refresh analytics to show new total
                this.fetchAnalytics();
                
            } else {
                this.log(`❌ Error: ${result.error}`, "log-error");
            }

        } catch (err) {
            this.log(`❌ Network Error: ${err.message}`, "log-error");
        }
    }

    // ANALYTICS: Fetching Aggregated Data
    async fetchAnalytics() {
        this.log("Fetching national data...", "info");
        try {
            const res = await fetch('http://localhost:3000/api/analytics');
            const data = await res.json();

            // Update DOM Elements
            // Note: We use optional chaining (?.) just in case data is zero/missing
            const northRev = data.breakdown?.central_region?.revenue || 0;
            const southRev = data.breakdown?.rift_region?.revenue || 0;
            const grandTotal = data.national_total || 0;

            document.getElementById('stat-north').innerText = `KES ${northRev}`;
            document.getElementById('stat-south').innerText = `KES ${southRev}`;
            document.getElementById('stat-total').innerText = `KES ${grandTotal}`;
            
            this.log("✅ Analytics Updated.", "log-success");
        } catch (err) {
            this.log("❌ Failed to load analytics.", "log-error");
        }
    }

    // Helper for Logging
    log(msg, type) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
        this.logContainer.prepend(entry);
    }
}

// Initialize the App
const app = new HelixApp();