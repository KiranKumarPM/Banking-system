// Basic config
const API_BASE = 'http://localhost:5000/api';
// Simple storage for current user and latest receipt
function saveUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function saveReceipt(data) { localStorage.setItem('receipt', JSON.stringify(data)); }
function getReceipt() { const r = localStorage.getItem('receipt'); return r ? JSON.parse(r) : null; }

// Logout helper
function logout() {
    try {
        localStorage.removeItem('user');
        localStorage.removeItem('receipt');
    } catch (_) { }
    window.location.href = 'login.html';
}

// Auth actions
async function signup() {
    const name = document.getElementById('name').value.trim();
    const pin = document.getElementById('pin').value.trim();
    try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, pin })
        });
        const data = await res.json();
        document.getElementById('message').textContent = data.message || '';
        if (res.ok) { saveUser(data.user); window.location.href = 'dashboard.html'; }
    } catch (e) { console.error(e); }
}

async function login() {
    const name = document.getElementById('name').value.trim();
    const pin = document.getElementById('pin').value.trim();
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, pin })
        });
        const data = await res.json();
        document.getElementById('message').textContent = data.message || '';
        if (res.ok) { saveUser(data.user); window.location.href = 'dashboard.html'; }
    } catch (e) { console.error(e); }
}

// Dashboard
async function loadDashboard() {
    const user = getUser();
    if (!user) {
        // Hide UI and hard redirect to prevent back navigation showing cached page
        const app = document.getElementById('dashboardApp');
        if (app) app.style.display = 'none';
        window.location.replace('login.html');
        return;
    }
    const app = document.getElementById('dashboardApp');
    if (app) app.style.display = '';
    document.getElementById('userInfo').innerHTML = `<strong>User:</strong> ${user.name}`;
    await refreshBalance();
}

async function refreshBalance() {
    const user = getUser();
    if (!user) return;
    try {
        const res = await fetch(`${API_BASE}/transactions/balance/${user.id}`);
        const data = await res.json();
        if (res.ok) { document.getElementById('balance').textContent = `₹ ${data.balance.toFixed(2)}`; }
    } catch (e) { console.error(e); }
}

async function loadStatement() {
    const user = getUser();
    if (!user) return;
    try {
        const res = await fetch(`${API_BASE}/transactions/statement/${user.id}`);
        const data = await res.json();
        const list = document.getElementById('statement');
        list.innerHTML = '';
        (data.transactions || []).forEach(t => {
            const li = document.createElement('li');
            const meta = t.merchant ? ` • ${t.merchant}` : (t.toUserId ? '' : '');
            li.innerHTML = `<span>${t.type}${meta}</span><span>₹ ${Number(t.amount).toFixed(2)}</span>`;
            list.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

// Transaction page
function initTransactionPage() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'transfer';
    const lang = getCurrentLanguage();
    const titleText = type === 'bill' ? (translations[lang]?.billPayment || 'Bill Payment') : (translations[lang]?.transfer || 'Transfer');
    document.getElementById('txnTitle').textContent = titleText;
    // Toggle optional fields
    document.getElementById('recipientRow').style.display = type === 'transfer' ? 'block' : 'none';
    document.getElementById('merchantRow').style.display = type === 'bill' ? 'block' : 'none';
}

async function submitTransaction(event) {
    event.preventDefault();
    const user = getUser();
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'transfer';
    const amount = Number(document.getElementById('amount').value);
    const recipientName = document.getElementById('recipientName') ? document.getElementById('recipientName').value.trim() : '';
    const merchant = document.getElementById('merchant') ? document.getElementById('merchant').value.trim() : '';
    try {
        const res = await fetch(`${API_BASE}/transactions/transfer`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type, amount, recipientName, merchant })
        });
        const data = await res.json();
        if (res.ok) { saveReceipt(data.receipt); window.location.href = 'receipt.html'; }
        else { alert(data.message || 'Transaction failed'); }
    } catch (e) { console.error(e); }
}

// Receipt
function loadReceipt() {
    const receipt = getReceipt();
    if (!receipt) { window.location.href = 'dashboard.html'; return; }
    const el = document.getElementById('receipt');
    const lang = getCurrentLanguage();
    const t = translations[lang] || translations.en;
    el.innerHTML = `
		<div class="card">
			<p><strong>${t.transactionId}:</strong> ${receipt.transactionId}</p>
			<p><strong>${t.type}:</strong> ${receipt.type}</p>
			<p><strong>${t.amount}:</strong> ₹ ${Number(receipt.amount).toFixed(2)}</p>
			<p><strong>${t.date}:</strong> ${receipt.dateIST || new Date(receipt.date).toLocaleString()}</p>
			<p><strong>${t.balanceAfter}:</strong> ₹ ${Number(receipt.balanceAfter).toFixed(2)}</p>
		</div>
	`;
}

// Load all transactions (not just mini statement)
async function loadAllTransactions() {
    const user = getUser();
    if (!user) return;
    try {
        const res = await fetch(`${API_BASE}/transactions/all/${user.id}`);
        const data = await res.json();
        const list = document.getElementById('allTransactions');
        list.innerHTML = '';
        (data.transactions || []).forEach(t => {
            const li = document.createElement('li');
            const fromTo = t.fromName && t.toName ? ` (${t.fromName} → ${t.toName})` : '';
            const merchant = t.merchant ? ` • ${t.merchant}` : '';
            li.innerHTML = `
                <div>
                    <strong>${t.type}${fromTo}${merchant}</strong><br>
                    <small>ID: ${t._id}</small><br>
                    <small>${t.dateIST || new Date(t.date).toLocaleString()}</small>
                </div>
                <div><strong>₹ ${Number(t.amount).toFixed(2)}</strong></div>
            `;
            list.appendChild(li);
        });
    } catch (e) { console.error(e); }
}

// Lookup specific transaction by ID
async function lookupTransaction() {
    const transactionId = document.getElementById('transactionId').value.trim();
    const lang = getCurrentLanguage();
    const t = translations[lang] || translations.en;

    if (!transactionId) { alert(t.transactionIdPlaceholder || 'Please enter a transaction ID'); return; }

    try {
        const res = await fetch(`${API_BASE}/transactions/lookup/${transactionId}`);
        const data = await res.json();
        const details = document.getElementById('transactionDetails');

        if (res.ok && data.transaction) {
            const transaction = data.transaction;
            details.innerHTML = `
                <div class="card" style="margin-top: 12px;">
                    <h4>${t.transaction} ${t.details || 'Details'}</h4>
                    <p><strong>ID:</strong> ${transaction._id}</p>
                    <p><strong>${t.type}:</strong> ${transaction.type}</p>
                    <p><strong>${t.amount}:</strong> ₹ ${Number(transaction.amount).toFixed(2)}</p>
                    <p><strong>${t.date}:</strong> ${transaction.dateIST || new Date(transaction.date).toLocaleString()}</p>
                    ${transaction.fromName ? `<p><strong>From:</strong> ${transaction.fromName}</p>` : ''}
                    ${transaction.toName ? `<p><strong>To:</strong> ${transaction.toName}</p>` : ''}
                    ${transaction.merchant ? `<p><strong>Merchant:</strong> ${transaction.merchant}</p>` : ''}
                    ${transaction.note ? `<p><strong>Note:</strong> ${transaction.note}</p>` : ''}
                </div>
            `;
        } else {
            details.innerHTML = `<div class="card" style="margin-top: 12px; color: #ff6b6b;"><strong>${t.error}:</strong> ${data.message || t.notFound}</div>`;
        }
    } catch (e) {
        console.error(e);
        document.getElementById('transactionDetails').innerHTML = `<div class="card" style="margin-top: 12px; color: #ff6b6b;"><strong>${t.error}:</strong> ${t.serverError}</div>`;
    }
}


