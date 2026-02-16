/**
 * KAPEM API GATEWAY (Dockerized)
 * Entry Point
 */

const http = require('http');
const transactionController = require('./controllers/transactionController');

const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const baseURL = 'http://' + req.headers.host + '/';
    const reqUrl = new URL(req.url, baseURL);

    // --- ROUTER ---
    if (reqUrl.pathname === '/api/transaction' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            req.body = JSON.parse(body); // Manual Body Parsing
            transactionController.processTransaction(req, res);
        });
    } 
    else if (reqUrl.pathname === '/api/analytics' && req.method === 'GET') {
        transactionController.getAnalytics(req, res);
    } 
    else if (reqUrl.pathname === '/api/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ system: "ONLINE", mode: "CONTAINERIZED" }));
    } 
    else if (reqUrl.pathname === '/api/warehouse' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            req.body = JSON.parse(body);
            transactionController.requestWarehousing(req, res);
        });
    }
    else if (reqUrl.pathname === '/api/admin/warehouse' && req.method === 'GET') {
        transactionController.getAdminWarehouseData(req, res);
    }
    else {
        res.writeHead(404); res.end("Not Found");
    }
});

server.listen(3000, () => {
    console.log('🚀 KAPEM Cloud API running on Port 3000');
});