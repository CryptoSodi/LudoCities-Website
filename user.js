// Move global functions outside DOMContentLoaded to ensure they are accessible by HTML onclick
window.switchTab = function(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`tab-${tabName}`);
    if (btn) btn.classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    const content = document.getElementById(`content-${tabName}`);
    if (content) content.classList.remove('hidden');
};

window.showMatchBoxScore = function(g) {
    const modal = document.getElementById('audit-modal');
    const body = document.getElementById('audit-modal-body');

    let categoryColor = "text-gray-500";
    if (g.category === 'Tournament') categoryColor = "text-yellow-500";
    else if (g.category === 'Private') categoryColor = "text-purple-400";

    body.innerHTML = `
        <div class="space-y-10">
            <div class="flex justify-between items-start border-b border-white/5 pb-6">
                <div>
                    <h3 class="text-2xl font-black text-emerald-400 uppercase tracking-tighter mb-1">Game Details</h3>
                    <p class="text-[10px] uppercase font-black ${categoryColor} tracking-[0.3em]">${g.category || 'NORMAL'} MATCH COMPLETED</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] text-gray-500 font-bold uppercase mb-1">${new Date(g.date).toLocaleString()}</p>
                    <span class="bg-white/5 text-gray-400 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">ROOM: ${g.roomCode}</span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Podium -->
                <div class="glass-panel p-8 rounded-2xl border-emerald-500/30 flex flex-col justify-center text-center">
                    <div class="mb-6">
                        <p class="text-[9px] text-gray-500 uppercase font-black mb-2">1st Place</p>
                        <h2 class="text-2xl font-black text-yellow-400 uppercase">${g.winner1}</h2>
                    </div>
                    ${g.winner2 !== 'N/A' ? `
                    <div>
                        <p class="text-[9px] text-gray-500 uppercase font-black mb-2">2nd Place</p>
                        <h2 class="text-lg font-bold text-gray-300 uppercase">${g.winner2}</h2>
                    </div>
                    ` : ''}
                </div>

                <!-- Match Stats -->
                <div class="space-y-4">
                    <div class="bg-white/5 p-6 rounded-2xl border border-white/5 flex justify-between items-center">
                        <p class="text-[10px] text-gray-500 uppercase font-black">My Result</p>
                        <p class="text-xl font-bold ${g.isWin ? 'text-emerald-400' : 'text-red-400'}">${g.isWin ? 'VICTORY' : 'DEFEAT'}</p>
                    </div>
                    <div class="bg-white/5 p-6 rounded-2xl border border-white/5 flex justify-between items-center">
                        <p class="text-[10px] text-gray-500 uppercase font-black">Bet Amount</p>
                        <p class="text-xl font-bold text-yellow-500">${g.bet} LUDC</p>
                    </div>
                </div>
            </div>

            <div class="glass-panel rounded-2xl overflow-hidden border border-white/5">
                <div class="bg-white/5 px-6 py-3 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">All Players in Match</div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${g.participants.map(p => `
                            <div class="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                                <span class="font-bold text-sm text-gray-200">${p.name} ${p.playerId == playerId ? '(Me)' : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    feather.replace();
};

window.closeAuditModal = () => document.getElementById('audit-modal').classList.add('hidden');

// Handle Deposit Form    feather.replace();

    const authToken = localStorage.getItem('LudoAuthToken');
    const playerId = localStorage.getItem('PlayerId');

    if (!authToken || !playerId) {
        window.location.href = 'login.html';
        return;
    }

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://192.168.1.13:8085/DashboardHub")
        .withAutomaticReconnect()
        .build();

    async function start() {
        try {
            await connection.start();
            console.log("SignalR Connected.");
            loadPlayerData();
        } catch (err) {
            console.log(err);
            setTimeout(start, 5000);
        }
    }

    start();

    async function loadPlayerData() {
        try {
            const data = await connection.invoke("GetPlayerDashboard", parseInt(playerId));
            if (data) {
                // 1. Core Profile
                document.getElementById('profile-name').innerText = data.name;
                document.getElementById('profile-img').src = data.picture || 'player.webp';
                document.getElementById('main-profile-name').innerText = data.name;
                document.getElementById('main-profile-img').src = data.picture || 'player.webp';
                
                // 2. Stats
                document.getElementById('stat-rank').innerText = data.rank;
                document.getElementById('stat-wins').innerText = data.wins;
                document.getElementById('stat-played').innerText = data.played;
                document.getElementById('stat-ludc').innerText = parseFloat(data.ludc).toFixed(2);

                // 3. Transactions Table
                const tBody = document.getElementById('transactions-table');
                tBody.innerHTML = '';
                if (data.transactions && data.transactions.length > 0) {
                    data.transactions.forEach(t => {
                        const tr = document.createElement('tr');
                        tr.className = "border-b border-white/5 hover:bg-white/5 transition-all";
                        tr.innerHTML = `
                            <td class="py-4 text-xs font-bold ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}">${t.type === 1 ? 'DEPOSIT' : 'GAME'}</td>
                            <td class="py-4 text-gray-300 text-xs">${t.description}</td>
                            <td class="py-4 font-bold text-xs">${t.amount > 0 ? '+' : ''}${t.amount}</td>
                            <td class="py-4"><span class="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase">${t.status}</span></td>
                            <td class="py-4 text-right text-gray-500 text-[10px]">${new Date(t.date).toLocaleDateString()}</td>
                        `;
                        tBody.appendChild(tr);
                    });
                } else {
                    tBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-gray-500 italic">No transactions found</td></tr>';
                }

                // 4. Manual Deposits Table
                const dBody = document.getElementById('manual-deposits-table');
                dBody.innerHTML = '';
                if (data.manualDeposits && data.manualDeposits.length > 0) {
                    data.manualDeposits.forEach(d => {
                        const tr = document.createElement('tr');
                        tr.className = "border-b border-white/5 hover:bg-white/5 transition-all";
                        const statusClass = d.status === 'Approved' ? 'text-emerald-400' : (d.status === 'Pending' ? 'text-yellow-400' : 'text-red-400');
                        tr.innerHTML = `
                            <td class="py-4 font-bold text-blue-400 text-xs">${d.paymentMethod}</td>
                            <td class="py-4"><a href="${d.receiptImageUrl}" target="_blank" class="text-purple-400 underline text-[10px] italic">View Receipt</a></td>
                            <td class="py-4 font-bold text-xs">${d.amount} LUDC</td>
                            <td class="py-4 font-black text-[10px] uppercase ${statusClass}">${d.status}</td>
                            <td class="py-4 text-right text-gray-500 text-[10px]">${new Date(d.createdDate).toLocaleDateString()}</td>
                        `;
                        dBody.appendChild(tr);
                    });
                } else {
                    dBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-gray-500 italic">No manual requests found</td></tr>';
                }

                // 5. Match History Table
                const mBody = document.getElementById('matches-table');
                mBody.innerHTML = '';
                if (data.recentGames && data.recentGames.length > 0) {
                    data.recentGames.forEach(g => {
                        const tr = document.createElement('tr');
                        tr.className = "border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer";
                        tr.onclick = () => showMatchBoxScore(g); // NEW: Click to see details
                        const resultText = g.isWin ? 'VICTORY' : 'DEFEAT';
                        const resultClass = g.isWin ? 'text-emerald-400' : 'text-red-400';
                        const betText = g.bet === 0 ? 'Practice' : `${g.bet} LUDC`;
                        tr.innerHTML = `
                            <td class="py-4 font-medium text-gray-300 text-xs">${g.type}</td>
                            <td class="py-4 font-black text-[10px] uppercase ${resultClass}">${resultText}</td>
                            <td class="py-4 font-medium text-yellow-400 text-xs">${betText}</td>
                            <td class="py-4 text-right text-gray-500 text-[10px]">${new Date(g.date).toLocaleDateString()}</td>
                        `;
                        mBody.appendChild(tr);
                    });
                } else {
                    mBody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-gray-500 italic">No recent matches</td></tr>';
                }

                // 6. Tournament History Table
                const thBody = document.getElementById('tournaments-table');
                thBody.innerHTML = '';
                if (data.tournaments && data.tournaments.length > 0) {
                    data.tournaments.forEach(t => {
                        const tr = document.createElement('tr');
                        tr.className = "border-b border-white/5 hover:bg-white/5 transition-all";
                        const statusClass = t.state === 'Active' ? 'text-emerald-400' : 'text-gray-400';
                        tr.innerHTML = `
                            <td class="py-4 font-medium text-purple-300 text-xs">${t.name}</td>
                            <td class="py-4 font-black text-[10px] uppercase ${statusClass}">${t.state}</td>
                            <td class="py-4 font-bold text-yellow-400 text-xs">${t.wins}</td>
                            <td class="py-4 text-right text-gray-500 text-[10px]">${new Date(t.date).toLocaleDateString()}</td>
                        `;
                        thBody.appendChild(tr);
                    });
                } else {
                    thBody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-gray-500 italic">No tournaments joined</td></tr>';
                }
            }
        } catch (err) {
            console.error("Error loading profile: ", err);
        }
    }

    // Handle Deposit Form
    const depositForm = document.getElementById('deposit-form');
    const formMsg = document.getElementById('form-msg');

    if (depositForm) {
        depositForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const amount = document.getElementById('deposit-amount').value;
            const method = document.getElementById('deposit-method').value;
            const receipt = document.getElementById('deposit-receipt').value;

            formMsg.innerText = "Submitting...";
            formMsg.className = "text-center text-sm text-purple-400 block";
            formMsg.classList.remove('hidden');

            try {
                const result = await connection.invoke("SubmitManualDeposit", parseInt(playerId), parseFloat(amount), method, receipt);
                if (result === "Success") {
                    formMsg.innerText = "Request submitted successfully! Admin will review it shortly.";
                    formMsg.className = "text-center text-sm text-green-400 block";
                    depositForm.reset();
                    setTimeout(loadPlayerData, 2000); // Reload list
                } else {
                    throw new Error(result);
                }
            } catch (err) {
                formMsg.innerText = "Error: " + err.message;
                formMsg.className = "text-center text-sm text-red-400 block";
            }
        });
    }
});