document.addEventListener("DOMContentLoaded", () => {
    // 1. Read Session & Theme State
    const user = JSON.parse(localStorage.getItem('kapem_user'));
    const theme = localStorage.getItem('kapem_theme') || 'light';
    if (theme === 'dark') document.body.classList.add('dark-mode');

    // 2. Build the Smart Navbar
    let navLinks = '';
    if (!user) {
        navLinks = `
            <a href="index.html">Home</a>
            <a href="marketplace.html">Marketplace</a>
            <a href="register.html">Register</a>
            <a href="login.html" style="background:var(--primary); color:white; padding:8px 15px; border-radius:6px;">Sign In</a>
        `;
    } else {
        const role = user.role;
        navLinks += `<a href="index.html">Home</a>`;
        
        // Context-Aware Links
        if (['HQ_ADMIN', 'REGION_ADMIN', 'TECH_STAFF'].includes(role)) {
            navLinks += `<a href="admin.html">⚡ Command Center</a>`;
        }
        if (['HQ_ADMIN', 'WAREHOUSE_ADMIN', 'REGION_ADMIN'].includes(role)) {
            navLinks += `<a href="warehouse_dashboard.html">📦 Inventory & Bins</a>`;
        }
        if (['HQ_ADMIN', 'LOGISTICS_ADMIN', 'DRIVER'].includes(role)) {
            navLinks += `<a href="logistics_dashboard.html">🚚 Fleet Routing</a>`;
        }
        if (role === 'FARMER') {
            navLinks += `<a href="farmer_dashboard.html">🌾 My Farm</a>`;
        }
        if (['WHOLESALE_BUYER', 'RETAIL_BUYER'].includes(role)) {
            navLinks += `<a href="marketplace.html">🛒 Marketplace</a>`;
        }
        if (['HQ_ADMIN', 'FINANCE_ADMIN'].includes(role)) {
            navLinks += `<a href="finance_dashboard.html">💰 Finance</a>`;
        }

        // Settings & Logout
        navLinks += `
            <span class="nav-user">${user.business_name || user.username} (${role.replace('_', ' ')})</span>
            <button onclick="toggleTheme()" class="icon-btn" title="Toggle Dark Mode">🌓</button>
            <button onclick="logoutUser()" class="icon-btn" title="Logout">🚪</button>
        `;
    }

    const navHTML = `
        <nav class="smart-navbar">
            <a href="index.html" class="nav-brand">🚜 KAPEM Network</a>
            <div class="nav-menu">${navLinks}</div>
        </nav>
    `;

    // 3. Build the Context-Aware Footer
    let regionContact = '';
    if (user && user.region_access && user.region_access !== 'NONE') {
        const contacts = {
            'CENTRAL': 'Central HQ (Nyeri): +254 711 222 333',
            'RIFT': 'Rift Valley HQ (Naivasha): +254 722 333 444',
            'WESTERN': 'Western HQ (Kisumu): +254 733 444 555',
            'COAST': 'Coast HQ (Mombasa): +254 744 555 666',
            'NORTHERN': 'Northern HQ (Garissa): +254 755 666 777',
            'ALL': 'Global Directory Access Granted. Dial 000 for HQ routing.'
        };
        regionContact = contacts[user.region_access] || '';
    }

    const footerHTML = `
        <footer class="smart-footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>KAPEM National HQ</h4>
                    <p>Waiyaki Way, Nairobi, Kenya</p>
                    <p>Support: +254 700 111 222</p>
                </div>
                ${regionContact ? `
                <div class="footer-section">
                    <h4>Regional Ops Contacts</h4>
                    <p>${regionContact}</p>
                </div>` : ''}
                <div class="footer-section">
                    <h4>System Access</h4>
                    ${!user ? `<a href="login.html" style="color:#ef4444; font-weight:bold;">Staff / Admin Login</a>` : `<a href="#" onclick="logoutUser()">Sign Out</a>`}
                </div>
            </div>
            <div class="footer-bottom">&copy; 2026 KAPEM Distributed Database Systems</div>
        </footer>
    `;

    // 4. Inject into the DOM
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
});

// Global Utility Functions
window.toggleTheme = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('kapem_theme', isDark ? 'dark' : 'light');
};

window.logoutUser = function() {
    localStorage.removeItem('kapem_user');
    localStorage.removeItem('kapem_cart');
    window.location.href = 'index.html';
};