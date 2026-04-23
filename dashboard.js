document.addEventListener('DOMContentLoaded', () => {
    feather.replace();
    const hubUrl = "https://signal.ludocities.com/DashboardHub";

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();

    const statusBadge = document.getElementById('connection-status');
    const rpcStatusBadge = document.getElementById('rpc-status');
    const detailsSection = document.getElementById('player-details-section');
    const searchInput = document.getElementById('player-search-input');
    const authToken = localStorage.getItem('LudoAuthToken');
    let currentTab = 'overview';

    // --- PRETTY UI HELPERS ---

    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toast-container');
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

    window.switchTab = function(tabName) {
        currentTab = tabName;
        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
        const navLink = document.getElementById(`nav-${tabName}`);
        if (navLink) navLink.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        const tabContent = document.getElementById(`tab-${tabName}`);
        if (tabContent) tabContent.classList.add('active');

        switch(tabName) {
            case 'overview': loadAllData(); break;
            case 'players': loadPlayerList(); break;
            case 'matches': loadMatchCenter(); break;
            case 'finance': loadFinanceData(); break;
            case 'tournaments': loadTournaments(); break;
        }
    };

    connection.on("RefreshMatchCenter", () => {
        if (currentTab === 'matches') loadMatchCenter();
        if (currentTab === 'overview') loadStats();
    });

    function updateStatus(isConnected) {
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
            const isValid = await connection.invoke("ValidateSession", authToken, "Admin");
            if (!isValid) { logout(); return; }
            await loadRpcConfig();
            updateStatus(true);
            loadAllData();
        } catch (err) {
            updateStatus(false);
            setTimeout(start, 5000);
        }
    }

    async function loadRpcConfig() {
        if (!rpcStatusBadge) return;

        try {
            const rpc = await connection.invoke("GetClientRpcConfig", authToken, "Admin");
            if (rpc?.hasRpc) {
                rpcStatusBadge.className = 'max-w-[420px] truncate px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black uppercase text-cyan-300 tracking-tighter';
                rpcStatusBadge.innerText = rpc.displayLabel || rpc.provider || 'Configured RPC';
            } else {
                rpcStatusBadge.className = 'max-w-[420px] truncate px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black uppercase text-yellow-300 tracking-tighter';
                rpcStatusBadge.innerText = 'RPC Not Configured';
            }
        } catch (err) {
            rpcStatusBadge.className = 'max-w-[420px] truncate px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase text-red-300 tracking-tighter';
            rpcStatusBadge.innerText = 'RPC Load Failed';
        }
    }

    start();

    connection.on("AccountStatusUpdate", (status) => {
        if (status === "ACCOUNT_BLOCKED") {
            showToast("Your session has been terminated by an administrator.", 'error');
            setTimeout(logout, 3000);
        }
    });

    // --- MATCH CENTER ---
    let allPastMatches = [];

    window.loadMatchCenter = async function() {
        loadLiveMatches();
        loadPastMatches();
    };

    async function loadLiveMatches() {
        try {
            const rooms = await connection.invoke("GetActiveMatches");
            const tbody = document.getElementById('live-matches-table');
            tbody.innerHTML = '';
            if (!rooms || rooms.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-gray-600 italic">No active rooms</td></tr>';
                return;
            }
            rooms.forEach(r => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer";
                tr.onclick = () => loadGameAudit(r);
                let catColor = r.category === 'Tournament' ? 'text-yellow-500' : (r.category === 'Private' ? 'text-purple-400' : 'text-gray-500');
                const pNames = r.players.map(p => `<span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 mr-1 text-[10px]">${p.name}</span>`).join('');
                tr.innerHTML = `<td class="py-4 font-mono text-purple-400">#${r.roomCode}</td><td class="font-bold text-yellow-500">${r.bet}</td><td>${pNames}</td><td><span class="text-blue-400">${r.status}</span></td><td class="text-right uppercase ${catColor} text-[9px] font-black">${r.category}</td>`;
                tbody.appendChild(tr);
            });
            feather.replace();
        } catch (err) { }
    }

    window.loadGameAudit = function(r) {
        const modal = document.getElementById('audit-modal');
        const body = document.getElementById('audit-modal-body');
        let catColor = r.category === 'Tournament' ? 'text-yellow-500' : (r.category === 'Private' ? 'text-purple-400' : 'text-gray-500');

        body.innerHTML = `
            <div class="space-y-10">
                <div class="flex justify-between items-start border-b border-white/5 pb-6">
                    <div>
                        <h3 class="text-2xl font-black text-blue-400 uppercase tracking-tighter mb-1">Live Room Monitor</h3>
                        <p class="text-[10px] uppercase font-black ${catColor} tracking-[0.3em]">${r.category} SESSION</p>
                    </div>
                    <div class="text-right">
                        <span class="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">ROOM: ${r.roomCode}</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
                        <p class="text-[9px] text-gray-500 uppercase font-black mb-1">Estimated Pot</p>
                        <p class="text-xl font-bold text-yellow-500">${(r.bet * r.playerCount).toFixed(2)} LUDC</p>
                    </div>
                    <div class="bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
                        <p class="text-[9px] text-gray-500 uppercase font-black mb-1">Variant</p>
                        <p class="text-xl font-bold text-white">${r.type} Player</p>
                    </div>
                    <div class="bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
                        <p class="text-[9px] text-gray-500 uppercase font-black mb-1">Server Status</p>
                        <p class="text-xl font-bold text-emerald-400 uppercase">${r.status}</p>
                    </div>
                </div>

                <div class="glass-panel rounded-2xl overflow-hidden border border-white/5">
                    <div class="bg-white/5 px-6 py-3 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">Active Participants</div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${r.players.map(p => `
                                <div onclick="loadPlayerAudit(${p.playerId})" class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 cursor-pointer transition-all">
                                    <span class="font-bold text-sm text-gray-200">${p.name}</span>
                                    <span class="text-[9px] text-gray-500 font-black uppercase tracking-tighter">View Audit &rarr;</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
        modal.classList.remove('hidden');
        feather.replace();
    };

    async function loadPastMatches() {
        try {
            allPastMatches = await connection.invoke("GetPastMatches", 50);
            applyMatchFilters();
        } catch (err) { }
    }

    window.applyMatchFilters = function() {
        const type = document.getElementById('filter-m-type').value;
        const start = document.getElementById('filter-m-start').value;
        const end = document.getElementById('filter-m-end').value;
        let filtered = allPastMatches;
        if (type !== 'All') filtered = filtered.filter(m => m.category === type);
        if (start) filtered = filtered.filter(m => new Date(start).getTime() <= new Date(m.date).getTime());
        if (end) filtered = filtered.filter(m => new Date(m.date).getTime() <= new Date(end).setHours(23,59,59,999));
        renderPastMatches(filtered);
    };

    function renderPastMatches(data) {
        const container = document.getElementById('past-matches-container');
        container.innerHTML = '';
        data.forEach(g => {
            const div = document.createElement('div');
            div.className = "p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition-all";
            div.onclick = () => loadPastMatchAudit(g);
            let catColor = g.category === 'Tournament' ? 'text-yellow-500' : (g.category === 'Private' ? 'text-purple-400' : 'text-gray-500');
            div.innerHTML = `<div><p class="text-[9px] font-black uppercase ${catColor}">${g.category}</p><p class="text-[10px] text-gray-300 font-medium">${g.participants.map(p=>p.name).join(', ')}</p></div><p class="text-yellow-500 font-bold text-[11px]">${g.bet} LUDC</p>`;
            container.appendChild(div);
        });
    }

    window.loadPastMatchAudit = function(g) {
        const modal = document.getElementById('audit-modal');
        const body = document.getElementById('audit-modal-body');
        let catColor = g.category === 'Tournament' ? 'text-yellow-500' : (g.category === 'Private' ? 'text-purple-400' : 'text-gray-500');

        body.innerHTML = `
            <div class="space-y-10">
                <div class="flex justify-between items-start border-b border-white/5 pb-6">
                    <div>
                        <h3 class="text-2xl font-black text-emerald-400 uppercase tracking-tighter mb-1">Match Box Score</h3>
                        <p class="text-[10px] uppercase font-black ${catColor} tracking-[0.3em]">${g.category || 'NORMAL'} MATCH COMPLETED</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] text-gray-500 font-bold uppercase mb-1">${new Date(g.date).toLocaleString()}</p>
                        <span class="bg-white/5 text-gray-400 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">ROOM: ${g.roomCode}</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="glass-panel p-8 rounded-2xl border-emerald-500/30 flex flex-col justify-center text-center">
                        <div class="mb-6">
                            <p class="text-[9px] text-gray-500 uppercase font-black mb-2">1st Place (Winner)</p>
                            <h2 class="text-3xl font-black text-yellow-400 uppercase">${g.winner1}</h2>
                        </div>
                        ${g.winner2 && g.winner2 !== 'N/A' ? `
                        <div class="pt-4 border-t border-white/5">
                            <p class="text-[9px] text-gray-500 uppercase font-black mb-2">2nd Place</p>
                            <h2 class="text-xl font-bold text-gray-300 uppercase">${g.winner2}</h2>
                        </div>` : ''}
                    </div>
                    <div class="space-y-4">
                        <div class="bg-white/5 p-6 rounded-2xl border border-white/5 flex justify-between items-center"><p class="text-[10px] text-gray-500 uppercase font-black">Entry Stake</p><p class="text-xl font-bold text-yellow-500">${g.bet} LUDC</p></div>
                        <div class="bg-white/5 p-6 rounded-2xl border border-white/5 flex justify-between items-center"><p class="text-[10px] text-gray-500 uppercase font-black">Player Variant</p><p class="text-xl font-bold text-white">${g.type} Player</p></div>
                    </div>
                </div>

                <div class="glass-panel rounded-2xl overflow-hidden border border-white/5">
                    <div class="bg-white/5 px-6 py-3 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">All Participants</div>
                    <div class="p-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${g.participants.map(p => `<div onclick="loadPlayerAudit(${p.playerId})" class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 cursor-pointer transition-all"><span class="font-bold text-sm text-gray-200">${p.name}</span><span class="text-[9px] text-gray-500 font-black uppercase">Audit &rarr;</span></div>`).join('')}
                    </div></div>
                </div>
            </div>`;
        modal.classList.remove('hidden');
        feather.replace();
    };

    // --- PLAYER DIRECTORY & AUDIT ---
    let allPlayers = [];
    let currentPlayerAuditData = null; // Store for local filtering

    window.loadPlayerList = async function() {
        try {
            allPlayers = await connection.invoke("GetAllPlayers");
            applyPlayerFilters();
        } catch (err) { }
    };

    window.applyPlayerFilters = function() {
        const query = document.getElementById('filter-p-search').value.toLowerCase();
        const city = document.getElementById('filter-p-city').value;
        const start = document.getElementById('filter-p-start').value;
        const end = document.getElementById('filter-p-end').value;
        let f = allPlayers;
        if (query) f = f.filter(p => (p.name && p.name.toLowerCase().includes(query)) || (p.email && p.email.toLowerCase().includes(query)));
        if (city !== 'All') f = f.filter(p => p.city === city);
        if (start) f = f.filter(p => new Date(p.createdDate).getTime() >= new Date(start).getTime());
        if (end) f = f.filter(p => new Date(p.createdDate).getTime() <= new Date(end).setHours(23,59,59,999));
        renderPlayerTable(f);
    };

    function renderPlayerTable(data) {
        const container = document.getElementById('player-list-container');
        if (!data || data.length === 0) { container.innerHTML = '<div class="py-10 text-center text-gray-600 italic">No players found</div>'; return; }
        let html = '<table class="w-full text-left text-xs"><thead class="text-gray-500 uppercase border-b border-white/5 tracking-widest text-[9px]"><tr><th class="pb-4">Name</th><th class="pb-4">City</th><th class="pb-4">Role</th><th class="pb-4">Wins</th><th class="pb-4 text-right">Joined</th></tr></thead><tbody>';
        data.forEach(p => {
            html += `<tr class="border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer" onclick="loadPlayerAudit(${p.id})"><td class="py-4 font-bold text-gray-200">${p.name}</td><td class="py-4 text-gray-500">${p.city || '---'}</td><td class="py-4 text-purple-400 font-black uppercase text-[9px]">${p.role}</td><td class="py-4 text-emerald-400 font-bold">${p.wins}</td><td class="py-4 text-right text-gray-600 text-[10px]">${new Date(p.createdDate).toLocaleDateString()}</td></tr>`;
        });
        container.innerHTML = html + '</tbody></table>';
        feather.replace();
    }

    window.loadPlayerAudit = async function(id) {
        try {
            const p = await connection.invoke("GetPlayerDashboard", id);
            if (p) {
                currentPlayerAuditData = p;
                showPlayerDetails(p);
            }
        } catch (err) { }
    };

    window.showPlayerDetails = function(p) {
        const adminId = parseInt(localStorage.getItem('PlayerId'));
        const myRole = localStorage.getItem('PlayerRole');
        const modal = document.getElementById('audit-modal');
        const body = document.getElementById('audit-modal-body');
        const isSystem = p.name === 'SYSTEM' || p.role === 'SYSTEM';
        const isManager = myRole === 'Manager';

        body.innerHTML = `
            <div class="space-y-8">
                <!-- Header -->
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center bg-white/5 p-8 rounded-3xl border border-white/5">
                    <div class="text-center lg:border-r border-white/5 lg:pr-8">
                        <img src="${p.picture || 'player.webp'}" class="h-24 w-24 rounded-full border-4 border-purple-500 mx-auto mb-4 glow-purple shadow-2xl">
                        <h3 class="text-xl font-black uppercase mb-1 truncate">${p.name}</h3>
                        <p class="text-[10px] text-purple-400 mb-2 font-black tracking-widest uppercase">${p.city || 'GLOBAL'}</p>
                        <span class="text-[8px] font-black px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-widest">${p.role}</span>
                    </div>
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Contact Info Hub -->
                        <div class="flex flex-wrap justify-center gap-6 border-b border-white/5 pb-6">
                            <div class="flex items-center gap-2">
                                <i data-feather="mail" width="12" class="text-gray-500"></i>
                                <span class="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">${p.email}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i data-feather="phone" width="12" class="text-gray-500"></i>
                                <span class="text-[10px] font-bold text-gray-300 tracking-tighter">${p.phoneNumber || 'NO PHONE'}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p class="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Global Rank</p>
                                <p class="text-2xl font-black text-yellow-400 font-gamer">#${p.rank}</p>
                            </div>
                            <div class="text-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p class="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Available LUDC</p>
                                <p class="text-2xl font-black text-blue-400 font-gamer">${parseFloat(p.ludc).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2 ${isSystem || isManager ? 'hidden' : ''}">
                        <button onclick="blockPlayer(${adminId}, ${p.id}, ${!p.isBlocked})" class="w-full py-3 ${p.isBlocked ? 'bg-emerald-600' : 'bg-red-600'} rounded-xl font-black text-[10px] uppercase">${p.isBlocked ? 'Unblock' : 'Block User'}</button>
                        <button onclick="toggleAdjustmentForm()" class="w-full py-3 bg-blue-600 rounded-xl font-black text-[10px] uppercase">Adjust Wallet</button>
                        <select onchange="promotePlayer(${adminId}, ${p.id}, this.value)" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase outline-none focus:border-purple-500"><option value="Player" ${p.role==='Player'?'selected':''}>Set Player</option><option value="Manager" ${p.role==='Manager'?'selected':''}>Set Manager</option><option value="Admin" ${p.role==='Admin'?'selected':''}>Set Admin</option></select>
                    </div>
                    ${isSystem ? '<p class="text-yellow-500 font-black uppercase text-[10px] text-center">SYSTEM PROTECTED</p>' : ''}
                </div>

                <!-- Adjustment Form -->
                <div id="adjustment-form" class="hidden glass-panel p-8 rounded-3xl border-blue-500/30 animate-in zoom-in duration-300">
                    <h4 class="font-black text-sm uppercase tracking-widest text-blue-400 mb-6 text-center">Manual Adjustment</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="number" id="adj-amount" placeholder="Amount (+/-)" class="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-sm outline-none">
                        <input type="text" id="adj-reason" placeholder="Reason" class="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-sm outline-none">
                    </div>
                    <div class="flex justify-end gap-3 mt-8">
                        <button onclick="toggleAdjustmentForm()" class="px-6 py-3 bg-white/5 rounded-xl text-[10px] font-black">CANCEL</button>
                        <button type="button" onclick="setAdjustmentMax()" class="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest">Use Max</button>
                        <button onclick="submitAdjustment(${p.id})" class="px-8 py-3 bg-blue-600 rounded-xl text-[10px] font-black">APPLY</button>
                    </div>
                </div>

                <!-- Dual Ledgers with Filtering -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col h-[500px]">
                        <div class="bg-white/5 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                            <span class="text-[10px] font-black uppercase text-gray-400">Match Record</span>
                            <i data-feather="play-circle" width="14"></i>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar" id="audit-matches-body">
                            <!-- Table Rendered below -->
                        </div>
                    </div>
                    
                    <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col h-[500px]">
                        <div class="bg-emerald-500/5 px-6 py-4 border-b border-white/5 flex flex-col gap-2">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] font-black uppercase text-emerald-400">Wallet Ledger</span>
                                <i data-feather="database" width="14" class="text-emerald-600"></i>
                            </div>
                            <!-- LEDGER FILTERS -->
                            <div class="flex gap-2">
                                <select id="filter-audit-type" onchange="applyAuditLedgerFilters()" class="bg-black/40 border border-white/10 rounded px-2 py-1 text-[8px] uppercase font-black outline-none flex-1">
                                    <option value="All">All Types</option>
                                    <option value="1">Deposit</option>
                                    <option value="2">Withdraw</option>
                                    <option value="3">Game Win</option>
                                    <option value="4">Game Loss</option>
                                    <option value="6">Bonus</option>
                                </select>
                                <input type="date" id="filter-audit-start" onchange="applyAuditLedgerFilters()" class="bg-black/40 border border-white/10 rounded px-2 py-1 text-[8px] outline-none w-20">
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar" id="audit-ledger-body">
                            <!-- Table Rendered below -->
                        </div>
                    </div>
                </div>
            </div>`;
        
        applyAuditLedgerFilters(); // Initial render of tables
        modal.classList.remove('hidden');
        feather.replace();
    };

    window.applyAuditLedgerFilters = function() {
        if (!currentPlayerAuditData) return;
        const type = document.getElementById('filter-audit-type').value;
        const start = document.getElementById('filter-audit-start').value;
        
        let filteredTrans = currentPlayerAuditData.transactions;
        if (type !== 'All') filteredTrans = filteredTrans.filter(t => t.type === parseInt(type));
        if (start) filteredTrans = filteredTrans.filter(t => new Date(t.date).getTime() >= new Date(start).getTime());

        renderAuditTables(currentPlayerAuditData.recentGames, filteredTrans);
    };

    function renderAuditTables(games, trans) {
        const mBody = document.getElementById('audit-matches-body');
        const lBody = document.getElementById('audit-ledger-body');

        // Render Matches
        mBody.innerHTML = `<table class="w-full text-left"><tbody>${games.map(g => `<tr class="border-b border-white/5 hover:bg-white/5 cursor-pointer" onclick="loadPastMatchAuditById(${g.id})"><td class="py-4 px-2"><div><span class="text-[7px] font-black px-1.5 py-0.5 rounded bg-white/5 uppercase ${g.category==='Tournament'?'text-yellow-500':(g.category==='Private'?'text-purple-400':'text-gray-500')}">${g.category||'CASH'}</span> <span class="font-bold text-gray-300">${g.type}P</span></div><span class="text-[8px] text-gray-600 uppercase italic">VS: ${g.opponents}</span></td><td class="py-4 font-black ${g.isWin?'text-emerald-400':'text-red-400'}">${g.isWin?'WIN':'LOSS'}</td><td class="py-4 text-right pr-2 text-gray-500 text-[8px]">${new Date(g.date).toLocaleDateString()}</span><i data-feather="chevron-right" width="10" class="inline"></i></td></tr>`).join('')}</tbody></table>`;

        // Render Ledger
        lBody.innerHTML = `<table class="w-full text-left"><tbody>${trans.map(t => {
            let typeLabel = "SWEEP", typeClass = "bg-red-500/10 text-red-400";
            switch(t.type) {
                case 1: typeLabel = "DEPOSIT"; typeClass = "bg-emerald-500/10 text-emerald-400"; break;
                case 2: typeLabel = "WITHDRAW"; typeClass = "bg-orange-500/10 text-orange-400"; break;
                case 3: typeLabel = "GAME WIN"; typeClass = "bg-emerald-500/10 text-emerald-400"; break;
                case 4: typeLabel = "GAME LOSS"; typeClass = "bg-red-500/10 text-red-400"; break;
                case 5: typeLabel = "SWEEP"; typeClass = "bg-gray-500/10 text-gray-400"; break;
                case 6: typeLabel = "BONUS"; typeClass = "bg-purple-500/10 text-purple-400"; break;
            }
            return `
                <tr class="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td class="py-4 px-2">
                        <span class="px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${typeClass}">${typeLabel}</span>
                    </td>
                    <td class="py-4 font-medium text-gray-300 leading-tight text-[10px]">
                        ${t.description}<br/>
                        ${t.roomCode ? `<button onclick="loadMatchDetailByRoom('${t.roomCode}')" class="text-[8px] font-black text-purple-400 hover:text-purple-300 uppercase mt-1 tracking-tighter">#${t.roomCode} &rarr;</button>` : ''}
                        <span class="text-[8px] text-gray-600 block mt-1">${new Date(t.date).toLocaleDateString()}</span>
                    </td>
                    <td class="py-4 text-right pr-2 font-black ${t.amount > 0 ? 'text-emerald-400' : 'text-yellow-500'} font-gamer">
                        ${t.amount > 0 ? '+' : ''}${parseFloat(t.amount).toFixed(2)}
                    </td>
                </tr>`;
        }).join('')}</tbody></table>`;
        feather.replace();
    }

    window.loadMatchDetailByRoom = async function(roomCode) {
        try {
            const g = await connection.invoke("GetGameAuditByRoom", roomCode);
            if (g) loadPastMatchAudit(g);
            else showToast("Match details not found.", 'error');
        } catch (err) { console.error(err); }
    };

    window.loadPastMatchAuditById = async function(id) {
        try {
            const g = await connection.invoke("GetGameAudit", id);
            if (g) loadPastMatchAudit(g);
            else showToast("Details not found.", 'error');
        } catch (err) { console.error(err); }
    };

    window.closeAuditModal = function(e) { if (e && e.target !== e.currentTarget) return; document.getElementById('audit-modal').classList.add('hidden'); };
    window.blockPlayer = async function(adminId, id, status) { showConfirm(`Confirm ${status?'BLOCK':'UNBLOCK'}?`, async () => { const result = await connection.invoke("BlockPlayer", adminId, id, status); if (result === "Success") { showToast("Updated."); loadPlayerAudit(id); } else showToast(result, 'error'); }); };
    window.promotePlayer = async function(adminId, id, newRole) { showConfirm(`Set to ${newRole.toUpperCase()}?`, async () => { const result = await connection.invoke("UpdatePlayerRole", adminId, id, newRole); if (result === "Success") { showToast("Role updated."); loadPlayerAudit(id); } else showToast(result, 'error'); }); };
    window.toggleAdjustmentForm = () => document.getElementById('adjustment-form').classList.toggle('hidden');
window.submitAdjustment = async function(playerId) {
  const adminId = parseInt(localStorage.getItem('PlayerId'));
  const amount = parseFloat(document.getElementById('adj-amount').value);
  const reason = document.getElementById('adj-reason').value.trim();
  if (!amount || isNaN(amount)) return;
  const result = await connection.invoke("AdjustPlayerBalance", adminId, playerId, amount, reason || "Manual Adjustment");
  if (result === "Success") { showToast("Balance updated."); loadPlayerAudit(playerId); } else showToast(result, 'error');
};

window.setAdjustmentMax = function() {
    const amountInput = document.getElementById('adj-amount');
    if (!amountInput || !currentPlayerAuditData) return;
    amountInput.value = String(currentPlayerAuditData.ludc || 0);
    showToast("Amount set to current balance.", 'success');
};

    window.loadAllData = function() { loadStats(); loadTopPlayers(); loadTournaments(); loadFinanceData(); };
    window.loadFinanceData = function() { loadPendingDeposits(); loadPendingWithdrawals(); };
    window.loadStats = async function() {
        try {
            const s = await connection.invoke("GetDashboardStats");
            if (s) {
                document.getElementById('stat-players').innerText = s.totalPlayers;
                document.getElementById('stat-active-games').innerText = s.activeGames;
                document.getElementById('stat-ludc').innerText = parseFloat(s.totalLUDC).toFixed(2);
                document.getElementById('stat-pending-deposits').innerText = s.pendingDeposits;
            }
        } catch (err) { }
    };

    window.loadTopPlayers = async function() {
        try {
            const p = await connection.invoke("GetTopPlayers");
            const tbody = document.getElementById('top-players-table');
            tbody.innerHTML = '';
            p.forEach((x, i) => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all";
                tr.onclick = () => loadPlayerAudit(x.id);
                tr.innerHTML = `<td class="py-3 px-2 font-black text-gray-500">#${i+1}</td><td class="py-3 font-bold text-gray-200">${x.name}</td><td class="py-3 text-right text-emerald-400 font-gamer text-[10px]">${x.wins} WINS</td>`;
                tbody.appendChild(tr);
            });
        } catch (err) { }
    };

    let allTournaments = [];
    window.loadTournaments = async function() {
        try {
            allTournaments = await connection.invoke("GetAllTournamentsAdmin");
            applyTournamentFilters();
            const container = document.getElementById('tournaments-container');
            container.innerHTML = '';
            allTournaments.filter(t => t.state === 'Active').forEach(t => {
                const div = document.createElement('div');
                div.className = "p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition-all";
                div.onclick = () => loadTournamentAudit(t.id);
                div.innerHTML = `<div><p class="text-[10px] font-black text-purple-400 uppercase tracking-widest">${t.name}</p><p class="text-[9px] text-gray-500 uppercase">${t.participants} Players Joined</p></div><p class="text-yellow-500 font-gamer text-[11px]">${t.entryFee} LUDC</p>`;
                container.appendChild(div);
            });
        } catch (err) { }
    };

    window.applyTournamentFilters = function() {
        const cat = document.getElementById('filter-t-category').value;
        const stat = document.getElementById('filter-t-status').value;
        let f = allTournaments;
        if (cat !== 'All') f = f.filter(t => t.name.includes(cat));
        if (stat !== 'All') f = f.filter(t => t.state === stat);
        renderTournamentTable(f);
    };

    function renderTournamentTable(data) {
        const tbody = document.getElementById('admin-tournaments-table');
        tbody.innerHTML = '';
        data.forEach(t => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer";
            tr.onclick = (e) => { if (e.target.tagName !== 'BUTTON') loadTournamentAudit(t.id); };
            const stateClass = t.state === 'Active' ? 'text-emerald-400' : 'text-gray-500';
            tr.innerHTML = `<td class="py-4"><span class="font-bold text-purple-300 block text-[11px]">${t.name}</span><span class="text-[8px] text-gray-600 uppercase font-medium tracking-tighter">${new Date(t.startDate).toLocaleDateString()} - ${new Date(t.endDate).toLocaleDateString()}</span></td><td class="py-4 text-[9px] font-black uppercase ${stateClass}">${t.state}</td><td class="py-4 text-right text-yellow-500 font-gamer text-[10px]">${t.entryFee}</td><td class="py-4 text-right text-blue-400 font-gamer text-[10px]">${t.participants}</td><td class="py-4 text-right text-gray-500 font-gamer text-[10px]">${t.gamesPlayed}</td><td class="py-4 text-right">${t.state === 'Active' ? `<button onclick="closeTournament(${t.id})" class="bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-1 rounded text-[8px] font-black hover:bg-red-600 hover:text-white transition-all">CLOSE</button>` : `<span class="text-emerald-500 text-[8px] font-black">WIN: ${t.winner1 || '---'}</span>`}</td>`;
            tbody.appendChild(tr);
        });
    }

    window.loadTournamentAudit = async function(id) {
        try {
            const data = await connection.invoke("GetTournamentAudit", id);
            if (data) {
                const modal = document.getElementById('audit-modal');
                const body = document.getElementById('audit-modal-body');
                const fin = data.finance;
                body.innerHTML = `
                    <div class="space-y-10">
                        <div class="flex justify-between items-start border-b border-white/5 pb-6">
                            <div><h3 class="text-2xl font-black text-purple-400 uppercase tracking-tighter mb-1">${data.name}</h3><p class="text-[9px] text-gray-500 uppercase tracking-widest">${new Date(data.startDate).toLocaleString()} — ${new Date(data.endDate).toLocaleString()}</p></div>
                            <span class="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">T-ID: ${data.tournamentId}</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="bg-white/5 p-5 rounded-2xl border border-white/5 text-center"><p class="text-[8px] text-gray-500 uppercase font-black mb-1">Participants</p><p class="text-xl font-bold text-white">${fin.totalParticipants}</p></div>
                            <div class="bg-white/5 p-5 rounded-2xl border border-white/5 text-center"><p class="text-[8px] text-gray-500 uppercase font-black mb-1">Revenue</p><p class="text-xl font-bold text-yellow-500">${fin.totalRevenue.toFixed(2)}</p></div>
                            <div class="bg-white/5 p-5 rounded-2xl border border-white/5 text-center"><p class="text-[8px] text-gray-500 uppercase font-black mb-1">Prize Pool</p><p class="text-xl font-bold text-blue-400">${fin.totalPrizes.toFixed(2)}</p></div>
                            <div class="bg-white/5 p-5 rounded-2xl border border-white/5 text-center"><p class="text-[8px] text-gray-500 uppercase font-black mb-1">Net</p><p class="text-xl font-bold ${fin.netResult>=0?'text-emerald-400':'text-red-400'}">${fin.netResult.toFixed(2)}</p></div>
                        </div>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div class="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[400px]">
                                <div class="bg-white/5 px-6 py-3 border-b border-white/5 text-[9px] uppercase font-black">Standings</div>
                                <div class="flex-1 overflow-y-auto"><table class="w-full text-left text-xs"><tbody>${data.participants.map(p => `<tr class="border-b border-white/5 hover:bg-white/5"><td class="py-4 px-6 font-black ${p.rank <= 3 ? 'text-yellow-400' : 'text-gray-500'}">#${p.rank}</td><td class="py-4 font-bold text-gray-200 cursor-pointer" onclick="loadPlayerAudit(${p.playerId})">${p.name}</td><td class="py-4 text-emerald-400 text-right pr-6 font-gamer">${p.score} WIN</td></tr>`).join('')}</tbody></table></div>
                            </div>
                            <div class="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[400px]">
                                <div class="bg-blue-500/10 px-6 py-3 border-b border-blue-500/20 text-[9px] uppercase font-black text-blue-400">Tournament Matches</div>
                                <div class="flex-1 overflow-y-auto custom-scrollbar">
                                    <table class="w-full text-left text-xs">
                                        <tbody>
                                            ${data.games.map(g => `
                                                <tr class="border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer" onclick="loadPastMatchAuditById(${g.id})">
                                                    <td class="py-4 px-6 font-mono text-purple-400 text-[10px]">#${g.roomCode}</td>
                                                    <td class="py-4 font-black uppercase text-[8px] text-gray-400">${g.state}</td>
                                                    <td class="py-4 text-right pr-6 text-gray-500 text-[9px] font-medium">${new Date(g.createdDate).toLocaleTimeString()}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>`;
                modal.classList.remove('hidden');
                feather.replace();
            }
        } catch (err) { }
    };

    const tForm = document.getElementById('create-tournament-form');
    if (tForm) {
        tForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('t-name').value;
            const city = document.getElementById('t-city').value;
            const fee = parseFloat(document.getElementById('t-fee').value);
            const p1 = parseFloat(document.getElementById('t-p1').value);
            const p2 = parseFloat(document.getElementById('t-p2').value);
            const p3 = parseFloat(document.getElementById('t-p3').value);
            const start = document.getElementById('t-start').value;
            const end = document.getElementById('t-end').value;
            const isRepeatable = document.getElementById('t-repeat').checked;
            showConfirm(`Launch ${name}?`, async () => {
                const res = await connection.invoke("CreateTournament", name, city, fee, p1, p2, p3, new Date(start), new Date(end), isRepeatable);
                if (res === "Success") { showToast("Launched!"); tForm.reset(); loadTournaments(); } else showToast(res, 'error');
            });
        });
    }

    window.closeTournament = async function(id) { showConfirm("End tournament?", async () => { const res = await connection.invoke("CloseTournamentManually", id); if (res === "Success") { showToast("Closed."); loadTournaments(); } else showToast(res, 'error'); }); };

    window.loadPendingDeposits = async function() {
        try {
            const d = await connection.invoke("GetPendingDeposits");
            const tbody = document.getElementById('pending-deposits-table');
            tbody.innerHTML = '';
            if (!d || d.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-gray-600 italic">No pending requests</td></tr>'; return; }
            d.forEach(x => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5 hover:bg-white/5";
                tr.innerHTML = `<td class="py-4 px-4 font-bold cursor-pointer text-purple-400" onclick="loadPlayerAudit(${x.playerId})">${x.playerName}</td><td class="py-4 font-mono text-cyan-300">${x.referenceNumber || '---'}</td><td class="font-gamer text-emerald-400">${x.amount}</td><td class="text-[10px] text-gray-500 uppercase font-black">${x.method}</td><td><a href="${x.receiptUrl}" target="_blank" class="text-blue-400 underline text-[10px]">VIEW</a></td><td class="text-right pr-4"><button onclick="approveDeposit(${x.id})" class="bg-emerald-600 px-3 py-1 rounded text-[9px] font-black uppercase">OK</button><button onclick="rejectDeposit(${x.id})" class="bg-red-600 px-3 py-1 rounded text-[9px] font-black uppercase ml-2">NO</button></td>`;
                tbody.appendChild(tr);
            });
        } catch (err) { }
    };

    window.loadPendingWithdrawals = async function() {
        try {
            const rows = await connection.invoke("GetPendingWithdrawals");
            const tbody = document.getElementById('pending-withdrawals-table');
            tbody.innerHTML = '';
            if (!rows || rows.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-gray-600 italic">No pending requests</td></tr>'; return; }
            rows.forEach(x => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5 hover:bg-white/5";
                tr.innerHTML = `<td class="py-4 px-4 font-bold cursor-pointer text-purple-400" onclick="loadPlayerAudit(${x.playerId})">${x.playerName}</td><td class="py-4 font-gamer text-orange-300">${x.amount}</td><td class="text-[10px] text-gray-500 uppercase font-black">${x.method}</td><td class="py-4 text-[10px] text-cyan-300 font-mono break-all">${x.destinationDetails}</td><td class="text-right pr-4"><button onclick="approveWithdrawal(${x.id})" class="bg-emerald-600 px-3 py-1 rounded text-[9px] font-black uppercase">OK</button><button onclick="rejectWithdrawal(${x.id})" class="bg-red-600 px-3 py-1 rounded text-[9px] font-black uppercase ml-2">NO</button></td>`;
                tbody.appendChild(tr);
            });
        } catch (err) { }
    };

    window.approveDeposit = async function(id) { showConfirm("Approve deposit?", async () => { const res = await connection.invoke("ProcessDeposit", authToken, id, "Approved", "Verified"); if (res === "Success") { showToast("Approved!"); loadAllData(); } else showToast(res, 'error'); }); };
    window.rejectDeposit = async function(id) { const note = prompt("Reason:"); if (note) { const res = await connection.invoke("ProcessDeposit", authToken, id, "Rejected", note); if (res === "Success") { showToast("Rejected."); loadAllData(); } else showToast(res, 'error'); } };
    window.approveWithdrawal = async function(id) { showConfirm("Approve withdrawal?", async () => { const res = await connection.invoke("ProcessWithdrawal", authToken, id, "Approved", "Verified"); if (res === "Success") { showToast("Approved!"); loadAllData(); } else showToast(res, 'error'); }); };
    window.rejectWithdrawal = async function(id) { const note = prompt("Reason:"); if (note) { const res = await connection.invoke("ProcessWithdrawal", authToken, id, "Rejected", note); if (res === "Success") { showToast("Rejected."); loadAllData(); } else showToast(res, 'error'); } };
    window.logout = () => { localStorage.clear(); window.location.href = 'index.html'; };
});
