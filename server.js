const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const transactionController = require('./controllers/transactionController');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const reqUrl = url.parse(req.url, true);

    if (req.method === 'GET' && (!reqUrl.pathname.startsWith('/api/'))) {
        let filePath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
        let extname = String(path.extname(filePath)).toLowerCase();
        let mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
        let contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(path.join(__dirname, filePath), (err, content) => {
            if (err) {
                res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/html' });
                res.end(err.code === 'ENOENT' ? '<h1>404 Not Found</h1>' : `Server Error`);
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
        return; 
    }

    const parseBody = (callback) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => { req.body = JSON.parse(body || '{}'); callback(); });
    };

    // Routing
    if (reqUrl.pathname === '/api/register' && req.method === 'POST') parseBody(() => transactionController.registerUser(req, res));
    else if (reqUrl.pathname === '/api/login' && req.method === 'POST') parseBody(() => transactionController.loginUser(req, res));
    else if (reqUrl.pathname === '/api/checkout' && req.method === 'POST') parseBody(() => transactionController.checkoutCart(req, res));
    else if (reqUrl.pathname === '/api/warehouse' && req.method === 'POST') parseBody(() => transactionController.requestWarehousing(req, res));
    else if (reqUrl.pathname === '/api/farmer/history' && req.method === 'POST') parseBody(() => transactionController.getFarmerHistory(req, res));
    else if (reqUrl.pathname === '/api/marketplace' && req.method === 'GET') transactionController.getMarketplaceInventory(req, res);
    
    // NEW ROUTE: Buyer Order History
    else if (reqUrl.pathname === '/api/buyer/history' && req.method === 'POST') parseBody(() => transactionController.getBuyerHistory(req, res));
    
    // Internal Routes
    else if (reqUrl.pathname === '/api/admin/update' && req.method === 'POST') parseBody(() => transactionController.updateWarehouseStatus(req, res));
    else if (reqUrl.pathname === '/api/admin/warehouse' && req.method === 'GET') transactionController.getAdminWarehouseData(req, res);
    else if (reqUrl.pathname === '/api/logs' && req.method === 'GET') transactionController.getSystemLogs(req, res);
    else if (reqUrl.pathname === '/api/warehouse/inventory' && req.method === 'GET') transactionController.getWarehouseInventory(req, res);
    else if (reqUrl.pathname === '/api/warehouse/bin' && req.method === 'POST') parseBody(() => transactionController.updateWarehouseBin(req, res));
    else if (reqUrl.pathname === '/api/logistics' && req.method === 'GET') transactionController.getLogisticsData(req, res);
    else if (reqUrl.pathname === '/api/finance/analytics' && req.method === 'GET') transactionController.getFinanceAnalytics(req, res);
    else if (reqUrl.pathname === '/api/health' && req.method === 'GET') transactionController.getSystemHealth(req, res);
    
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'API Route not found' }));
    }
});

const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 KAPEM Server running securely on port ${PORT}`));