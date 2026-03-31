document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    const playerId = localStorage.getItem('PlayerId');
    const authToken = localStorage.getItem('LudoAuthToken');

    if (!playerId || !authToken) {
        window.location.href = 'login.html';
        return;
    }

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://192.168.1.15:8085/DashboardHub")
        .withAutomaticReconnect()
        .build();

    const statusBadge = document.getElementById('connection-status');
    let currentTab = 'stats';
    let userTransactions = []; // Local cache for filtering

    // --- PRETTY UI HELPERS ---

    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
        const icon = type === 'success' ? 'check-circle' : 'alert-circle';

        toast.className = `${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-full duration-300 min-w-[300px] border border-white/10`;
        toast.innerHTML = `<i data-feather="${icon}" width="18"></i> <span class="text-xs font-black uppercase tracking-widest">${message}</span>`;
        
        container.appendChild(toast);
        feather.replace();

        setTimeout(() => {
            toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right-full');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    window.showConfirm = function(message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-msg');
        const yesBtn = document.getElementById('confirm-yes');

        msgEl.innerText = message;
        modal.classList.remove('hidden');

        yesBtn.onclick = () => {
            onConfirm();
            closeConfirm();
        };
    };

    window.closeConfirm = () => document.getElementById('confirm-modal').classList.add('hidden');

    // --- NAVIGATION ---

    window.switchTab = function(tabName) {
        currentTab = tabName;
        // Update Sidebar
        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
        const navLink = document.getElementById(`nav-${tabName}`);
        if (navLink) navLink.classList.add('active');

        // Update Content
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        const tabContent = document.getElementById(`tab-${tabName}`);
        if (tabContent) tabContent.classList.add('active');

        console.log(`Switching to: ${tabName}`);
        loadPlayerData(); 
    };

    function updateStatus(isConnected) {
        if (!statusBadge) return;
        if (isConnected) {
            statusBadge.className = 'flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-black uppercase text-green-400 tracking-tighter';
            statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online';
        } else {
            statusBadge.className = 'flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase text-red-400 tracking-tighter';
            statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Offline';
        }
    }

    async function start() {
        try {
            await connection.start();
            console.log("SignalR Connected.");

            // 🛑 SESSION VALIDATION
            const isValid = await connection.invoke("ValidateSession", authToken, "Player");
            if (!isValid) {
                logout();
                return;
            }

            updateStatus(true);
            loadPlayerData();
        } catch (err) {
            updateStatus(false);
            setTimeout(start, 5000);
        }
    }

    start();

    // --- BROADCAST LISTENERS ---
    connection.on("AccountStatusUpdate", (status) => {
        if (status === "ACCOUNT_BLOCKED") {
            logout();
        }
    });

    // --- DATA HYDRATION ---

    async function loadPlayerData() {
        try {
            const data = await connection.invoke("GetPlayerDashboard", parseInt(playerId));
            if (!data) return;

            // Cache for filtering
            userTransactions = data.transactions || [];

            // 1. Core Identity
            document.getElementById('profile-name').innerText = data.name;
            document.getElementById('profile-img').src = data.picture || 'player.webp';
            document.getElementById('main-profile-name').innerText = data.name;
            document.getElementById('main-profile-img').src = data.picture || 'player.webp';
            
            // 2. Career Stats
            document.getElementById('stat-rank').innerText = data.rank;
            document.getElementById('stat-wins').innerText = data.wins;
            document.getElementById('stat-played').innerText = data.played;
            document.getElementById('stat-ludc').innerText = parseFloat(data.ludc).toFixed(2);

            // 3. Match Records
            const mTable = document.getElementById('matches-table');
            mTable.innerHTML = '';
            if (data.recentGames && data.recentGames.length > 0) {
                data.recentGames.forEach(g => {
                    const tr = document.createElement('tr');
                    tr.className = "border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer group";
                    tr.onclick = () => loadMatchDetail(g.id);
                    
                    const resultClass = g.isWin ? 'text-emerald-400' : 'text-red-400';
                    tr.innerHTML = `
                        <td class="py-4 px-2">
                            <span class="block text-gray-200 font-bold text-xs">${g.type}P LUDO</span>
                            <span class="text-[8px] text-gray-600 uppercase italic">VS: ${g.opponents}</span>
                        </td>
                        <td class="py-4 font-black text-[10px] ${resultClass}">${g.isWin ? 'VICTORY' : 'DEFEAT'}</td>
                        <td class="py-4 font-black text-yellow-500 font-gamer text-xs">${g.bet} LUDC</td>
                        <td class="py-4 text-right pr-2">
                            <span class="block text-gray-600 text-[8px]">${new Date(g.date).toLocaleDateString()}</span>
                            <i data-feather="chevron-right" width="10" class="inline text-gray-800 group-hover:text-white"></i>
                        </td>
                    `;
                    mTable.appendChild(tr);
                });
            } else {
                mTable.innerHTML = '<tr><td colspan="4" class="py-10 text-center text-gray-600 italic text-xs">No match logs found</td></tr>';
            }

            // 4. Initial Render of Transaction Feed (Apply current filters)
            applyTransactionFilters();

            // 5. Manual Deposits
            const dTable = document.getElementById('manual-deposits-table');
            dTable.innerHTML = '';
            if (data.manualDeposits && data.manualDeposits.length > 0) {
                data.manualDeposits.forEach(d => {
                    const tr = document.createElement('tr');
                    tr.className = "border-b border-white/5";
                    const sClass = d.status === 'Approved' ? 'text-emerald-400' : (d.status === 'Pending' ? 'text-yellow-400' : 'text-red-400');
                    tr.innerHTML = `
                        <td class="py-4 px-2 text-[10px] font-black uppercase text-gray-400">${d.paymentMethod}</td>
                        <td class="py-4"><a href="${d.receiptImageUrl}" target="_blank" class="text-blue-400 underline text-[9px] font-bold">VIEW RECEIPT</a></td>
                        <td class="py-4 font-gamer text-emerald-400 text-xs">${d.amount}</td>
                        <td class="py-4 font-black text-[9px] uppercase ${sClass}">${d.status}</td>
                        <td class="py-4 text-right text-gray-600 text-[8px]">${new Date(d.createdDate).toLocaleDateString()}</td>
                    `;
                    dTable.appendChild(tr);
                });
            }

            feather.replace();
        } catch (err) { console.error(err); }
    }

    // --- TRANSACTION FILTERING ---

    window.applyTransactionFilters = function() {
        const type = document.getElementById('filter-t-type')?.value || 'All';
        const start = document.getElementById('filter-t-start')?.value;
        
        let filtered = userTransactions;

        if (type !== 'All') {
            filtered = filtered.filter(t => t.type === parseInt(type));
        }

        if (start) {
            const startTime = new Date(start).getTime();
            filtered = filtered.filter(t => new Date(t.date).getTime() >= startTime);
        }

        renderTransactionTable(filtered);
    };

    function renderTransactionTable(data) {
        const tTable = document.getElementById('transactions-table');
        if (!tTable) return;
        tTable.innerHTML = '';
        
        if (data.length === 0) {
            tTable.innerHTML = '<tr><td colspan="3" class="py-10 text-center text-gray-600 italic text-xs">No matching transactions</td></tr>';
            return;
        }

        data.forEach(t => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-white/5 hover:bg-white/5 transition-all";
            
            let typeLabel = "SWEEP", typeClass = "bg-red-500/10 text-red-400";
            switch(t.type) {
                case 1: typeLabel = "DEPOSIT"; typeClass = "bg-emerald-500/10 text-emerald-400"; break;
                case 2: typeLabel = "WITHDRAW"; typeClass = "bg-orange-500/10 text-orange-400"; break;
                case 3: typeLabel = "GAME WIN"; typeClass = "bg-emerald-500/10 text-emerald-400"; break;
                case 4: typeLabel = "GAME LOSS"; typeClass = "bg-red-500/10 text-red-400"; break;
                case 5: typeLabel = "SWEEP"; typeClass = "bg-gray-500/10 text-gray-400"; break;
                case 6: typeLabel = "BONUS"; typeClass = "bg-purple-500/10 text-purple-400"; break;
            }

            tr.innerHTML = `
                <td class="py-4 px-2">
                    <span class="px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${typeClass}">${typeLabel}</span>
                </td>
                <td class="py-4">
                    <span class="block text-gray-300 font-medium text-[10px] leading-tight">${t.description}</span>
                    ${t.roomCode ? `<button onclick="loadMatchDetailByRoom('${t.roomCode}')" class="text-[8px] font-black text-purple-400 hover:text-purple-300 transition-all uppercase tracking-tighter mt-1">#${t.roomCode} &rarr;</button>` : ''}
                    <span class="text-[8px] text-gray-600 uppercase font-black tracking-widest block mt-1">${new Date(t.date).toLocaleDateString()}</span>
                </td>
                <td class="py-4 text-right pr-2 font-black ${t.amount > 0 ? 'text-emerald-400' : 'text-yellow-500'} font-gamer text-xs">
                    ${t.amount > 0 ? '+' : ''}${parseFloat(t.amount).toFixed(2)}
                </td>
            `;            tTable.appendChild(tr);
        });
    }

    // --- MATCH DETAILS ---

    window.loadMatchDetail = async function(gameId) {
        try {
            const g = await connection.invoke("GetGameAudit", gameId);
            if (g) showBoxScore(g);
            else showToast("Failed to load match details.", 'error');
        } catch (err) { console.error(err); }
    };

    window.loadMatchDetailByRoom = async function(roomCode) {
        try {
            const g = await connection.invoke("GetGameAuditByRoom", roomCode);
            if (g) showBoxScore(g);
            else showToast("Match details not found for this room.", 'error');
        } catch (err) { console.error(err); }
    };

    function showBoxScore(g) {
        const modal = document.getElementById('audit-modal');
        const body = document.getElementById('audit-modal-body');
        let catColor = g.category === 'Tournament' ? 'text-yellow-500' : (g.category === 'Private' ? 'text-purple-400' : 'text-gray-500');

        body.innerHTML = `
            <div class="space-y-10 text-center">
                <div class="border-b border-white/5 pb-6">
                    <h3 class="text-3xl font-black text-emerald-400 uppercase tracking-tighter mb-1">Match Box Score</h3>
                    <p class="text-[10px] uppercase font-black ${catColor} tracking-[0.3em]">${g.category} SESSION COMPLETED</p>
                </div>
                <div class="glass-panel p-10 rounded-[2.5rem] border-emerald-500/30">
                    <p class="text-[10px] text-gray-500 uppercase font-black mb-4 tracking-widest">1st Place (Winner)</p>
                    <h2 class="text-4xl font-black text-yellow-400 uppercase font-gamer mb-6">${g.winner1}</h2>
                    ${g.winner2 && g.winner2 !== 'N/A' ? `<div class="pt-6 border-t border-white/5"><p class="text-[9px] text-gray-500 uppercase font-black mb-2">2nd Place</p><h2 class="text-xl font-bold text-gray-300 uppercase">${g.winner2}</h2></div>` : ''}
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-white/5 p-6 rounded-3xl border border-white/5"><p class="text-[9px] text-gray-500 uppercase font-black mb-1">Stakes</p><p class="text-xl font-bold text-yellow-500 font-gamer">${g.bet} LUDC</p></div>
                    <div class="bg-white/5 p-6 rounded-3xl border border-white/5"><p class="text-[9px] text-gray-500 uppercase font-black mb-1">Room</p><p class="text-xl font-bold text-white font-gamer">#${g.roomCode}</p></div>
                </div>
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div class="bg-white/5 px-6 py-3 border-b border-white/5 text-[9px] font-black uppercase text-gray-400 tracking-widest">Roster</div>
                    <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${g.participants.map(p => `<div class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5"><div class="w-3 h-3 rounded-full bg-purple-500 glow-purple"></div><span class="font-bold text-gray-200 text-sm">${p.name} ${p.playerId == playerId ? '(Me)' : ''}</span></div>`).join('')}
                    </div>
                </div>
            </div>`;
        modal.classList.remove('hidden');
        feather.replace();
    }

    window.closeAuditModal = (e) => {
        if (e && e.target !== e.currentTarget) return;
        document.getElementById('audit-modal').classList.add('hidden');
    };

    const dForm = document.getElementById('deposit-form');
    if (dForm) {
        dForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('deposit-amount').value);
            const method = document.getElementById('deposit-method').value;
            const receipt = document.getElementById('deposit-receipt').value.trim();
            if (!amount || amount <= 0) { showToast("Enter a valid amount.", 'error'); return; }
            showConfirm(`Deposit ${amount} LUDC?`, async () => {
                const res = await connection.invoke("SubmitManualDeposit", parseInt(playerId), amount, method, receipt);
                if (res === "Success") { showToast("Submitted!"); dForm.reset(); switchTab('wallet'); } else showToast(res, 'error');
            });
        });
    }

    window.logout = () => { localStorage.clear(); window.location.href = 'login.html'; };
});