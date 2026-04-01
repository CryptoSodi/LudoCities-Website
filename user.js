document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    const playerId = localStorage.getItem('PlayerId');
    const authToken = localStorage.getItem('LudoAuthToken');

    if (!playerId || !authToken) {
        window.location.href = 'index.html';
        return;
    }

    // --- DYNAMIC CONNECTION LOGIC ---
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const hubUrl = isLocal ? "http://192.168.1.15:8085/DashboardHub" : "https://13.202.76.246:8443/DashboardHub";

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();

    const statusBadge = document.getElementById('connection-status');
    let currentTab = 'stats';
    let internalWalletAddress = "";

    // --- SOLANA CONFIG (Robust Fallback for Browser CORS/403) ---
    const LUDC_MINT = new solanaWeb3.PublicKey("JSXWEi4ZXJkrkqWQg4UjUPzpmpYYFxzLmBuADh5cyai");
    const TOKEN_2022_PROGRAM_ID = new solanaWeb3.PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
    const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
    
    const RPC_ENDPOINTS = [
        "https://api.mainnet-beta.solana.com",
        "https://solana-rpc.publicnode.com",
        "https://solana-mainnet.rpc.extrnode.com"
    ];
    
    let phantomWallet = null;

    async function getBlockhashWithFallback() {
        for (const url of RPC_ENDPOINTS) {
            try {
                console.log(`Trying RPC for Blockhash: ${url}`);
                const conn = new solanaWeb3.Connection(url, "confirmed");
                const result = await conn.getLatestBlockhash('confirmed');
                if (result && result.blockhash) {
                    console.log(`Success with: ${url}`);
                    return { blockhash: result.blockhash, connection: conn };
                }
            } catch (err) {
                console.warn(`RPC Blockhash Failed (${url}):`, err.message);
            }
        }
        return null;
    }

    // --- UI HELPERS ---
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
        yesBtn.onclick = () => { onConfirm(); closeConfirm(); };
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
        loadPlayerData(); 
    };

    async function start() {
        try {
            await connection.start();
            console.log("SignalR Connected.");
            const isValid = await connection.invoke("ValidateSession", authToken, "Player");
            if (!isValid) { logout(); return; }
            updateStatus(true);
            loadPlayerData();
        } catch (err) {
            updateStatus(false);
            setTimeout(start, 5000);
        }
    }

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

    start();

    // --- WEB3 PHANTOM ---
    window.connectPhantom = async function() {
        try {
            const provider = window.phantom?.solana || window.solana;
            if (!provider?.isPhantom) {
                showToast("Phantom not found!", 'error');
                window.open("https://phantom.app/", "_blank");
                return;
            }
            const resp = await provider.connect();
            phantomWallet = resp.publicKey.toString();
            document.getElementById('btn-phantom-connect').innerHTML = `<img src="https://phantom.app/favicon.ico" class="w-3 h-3 rounded-full"> Connected`;
            const statusLabel = document.getElementById('phantom-status-label');
            if (statusLabel) {
                statusLabel.innerText = "Phantom Connected";
                statusLabel.className = "text-xs font-black uppercase text-purple-400";
            }
            const addressLabel = document.getElementById('phantom-address-label');
            if (addressLabel) addressLabel.innerText = phantomWallet;
            showToast("Wallet Linked!");
        } catch (err) {
            showToast("Connection failed.", 'error');
        }
    };

    window.useConnectedWallet = function() {
        if (!phantomWallet) { showToast("Connect Phantom first!", 'error'); return; }
        document.getElementById('web3-withdraw-address').value = phantomWallet;
    };

    window.depositLUDC = async function() {
        const amount = parseFloat(document.getElementById('web3-deposit-amount').value);
        if (!amount || amount <= 0) { showToast("Invalid amount", 'error'); return; }
        if (!phantomWallet) { showToast("Connect Phantom first!", 'error'); return; }
        if (!internalWalletAddress) { showToast("Internal wallet not ready.", 'error'); return; }

        showConfirm(`Deposit ${amount} LUDC to your game wallet?`, async () => {
            try {
                showToast("Building Transaction...", 'success');
                const fromWallet = new solanaWeb3.PublicKey(phantomWallet);
                const toWallet = new solanaWeb3.PublicKey(internalWalletAddress);
                const fromAta = await getAssociatedTokenAddress(LUDC_MINT, fromWallet, TOKEN_2022_PROGRAM_ID);
                const toAta = await getAssociatedTokenAddress(LUDC_MINT, toWallet, TOKEN_2022_PROGRAM_ID);

                const decimals = 9;
                const amountInLamports = amount * Math.pow(10, decimals);

                const data = new Uint8Array(10);
                const view = new DataView(data.buffer);
                data[0] = 12; 
                view.setBigUint64(1, BigInt(Math.round(amountInLamports)), true);
                data[9] = decimals;

                const keys = [
                    { pubkey: fromAta, isSigner: false, isWritable: true },
                    { pubkey: LUDC_MINT, isSigner: false, isWritable: false },
                    { pubkey: toAta, isSigner: false, isWritable: true },
                    { pubkey: fromWallet, isSigner: true, isWritable: false }
                ];

                const transaction = new solanaWeb3.Transaction().add(new solanaWeb3.TransactionInstruction({
                    keys, programId: TOKEN_2022_PROGRAM_ID, data
                }));
                transaction.feePayer = fromWallet;
                const { blockhash } = await solConnection.getLatestBlockhash('confirmed');
                transaction.recentBlockhash = blockhash;

                const provider = window.phantom?.solana || window.solana;
                const { signature } = await provider.signAndSendTransaction(transaction);
                showToast("Deposit Signature: " + signature.substring(0,8) + "...");
            } catch (err) {
                showToast(err.message || "Transfer failed.", 'error');
            }
        });
    };

    window.withdrawLUDC = async function() {
        const amount = parseFloat(document.getElementById('web3-withdraw-amount').value);
        const dest = document.getElementById('web3-withdraw-address').value.trim();
        if (!amount || amount <= 0) { showToast("Invalid amount.", 'error'); return; }
        if (!dest) { showToast("Destination required.", 'error'); return; }

        showConfirm(`Withdraw ${amount} LUDC?`, async () => {
            try {
                const res = await connection.invoke("InitiateWithdrawal", authToken, dest, amount);
                if (res.startsWith("Success")) {
                    showToast("Processed!");
                    loadPlayerData();
                } else {
                    showToast(res, 'error');
                }
            } catch (err) { showToast("Server error.", 'error'); }
        });
    };

    // --- DATA HYDRATION ---
    async function loadPlayerData() {
        try {
            const data = await connection.invoke("GetPlayerDashboard", parseInt(playerId));
            if (!data) return;

            internalWalletAddress = data.walletAddress;

            document.getElementById('profile-name').innerText = data.name;
            document.getElementById('profile-img').src = data.picture || 'player.webp';
            document.getElementById('main-profile-name').innerText = data.name;
            document.getElementById('main-profile-img').src = data.picture || 'player.webp';

            const identityBadgeContainer = document.getElementById('identity-badge-container');
            if (identityBadgeContainer) {
                identityBadgeContainer.innerHTML = `
                    <p class="text-[10px] text-purple-400 mb-6 font-black tracking-widest uppercase">${data.city || 'GLOBAL'}</p>
                    <div class="space-y-3 mb-8 bg-white/5 p-6 rounded-3xl border border-white/5 text-left">
                        <div class="flex items-center gap-3">
                            <i data-feather="mail" width="12" class="text-gray-400"></i>
                            <span class="text-[10px] font-bold text-gray-300 uppercase truncate">${data.email}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <i data-feather="phone" width="12" class="text-gray-400"></i>
                            <span class="text-[10px] font-bold text-gray-300">${data.phoneNumber || 'NO PHONE'}</span>
                        </div>
                        <div class="flex items-center gap-3 pt-2 border-t border-white/5">
                            <i data-feather="map-pin" width="12" class="text-purple-500"></i>
                            <span class="text-[10px] font-black text-purple-400 uppercase tracking-widest">${data.city || 'GLOBAL REGION'}</span>
                        </div>
                    </div>
                    <div class="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-2xl shadow-lg">
                        <p class="text-[8px] font-black uppercase tracking-[0.2em] mb-1">Current Global Rank</p>
                        <h2 class="text-3xl font-black font-gamer">#${data.rank}</h2>
                    </div>
                `;
                feather.replace();
            }

            document.getElementById('stat-ludc').innerText = parseFloat(data.ludc).toFixed(2);
            document.getElementById('display-wallet-address').innerText = data.walletAddress ? `${data.walletAddress.substring(0,6)}...${data.walletAddress.substring(38)}` : "No Address";

            // Highlights
            const ratio = data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0;
            const ratioEl = document.getElementById('stat-ratio');
            if(ratioEl) ratioEl.innerText = ratio;
            document.getElementById('stat-played-hud').innerText = data.played;
            document.getElementById('stat-wins-hud').innerText = data.wins;
            document.getElementById('stat-lost-hud').innerText = data.lost;
            document.getElementById('stat-best-hud').innerText = parseFloat(data.bestWin).toFixed(2);
            document.getElementById('stat-total-win-hud').innerText = parseFloat(data.totalWin).toFixed(2);
            document.getElementById('stat-total-lost-hud').innerText = parseFloat(data.totalLost).toFixed(2);

            // Tables
            applyTransactionFilters(); // This will now use the Deep Audit logic
            renderMatches(data.recentGames);
            renderManualDeposits(data.manualDeposits);
            
            // Populate Tournament Archive (If available)
            renderTournaments(data.tournamentHistory || []);

            feather.replace();
        } catch (err) { console.error(err); }
    }

    function renderMatches(games) {
        const mTable = document.getElementById('matches-table');
        if(!mTable) return;
        mTable.innerHTML = '';
        if (!games || games.length === 0) {
            mTable.innerHTML = '<tr><td class="py-10 text-center text-gray-600 italic text-xs">No records found</td></tr>';
            return;
        }
        games.forEach(g => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer group";
            tr.onclick = () => loadMatchDetail(g.id);
            const resClass = g.isWin ? 'text-emerald-400' : 'text-red-400';
            tr.innerHTML = `<td class="py-4 px-2"><div><span class="font-bold text-gray-200 text-xs">${g.type}P</span></div><span class="text-[8px] text-gray-600 uppercase italic">VS: ${g.opponents}</span></td><td class="py-4 font-black text-[10px] ${resClass}">${g.isWin ? 'VICTORY' : 'DEFEAT'}</td><td class="py-4 font-bold text-yellow-500 text-xs font-gamer">${g.bet}</td><td class="py-4 text-right pr-2"><span class="block text-gray-600 text-[8px]">${new Date(g.date).toLocaleDateString()}</span><i data-feather="chevron-right" width="10" class="inline text-gray-800 group-hover:text-white"></i></td>`;
            mTable.appendChild(tr);
        });
    }

    function renderTournaments(data) {
        const tTable = document.getElementById('tournaments-table');
        if(!tTable) return;
        tTable.innerHTML = '';
        if (data.length === 0) {
            tTable.innerHTML = '<tr><td class="py-10 text-center text-gray-600 italic text-xs">No tournament history</td></tr>';
            return;
        }
        data.forEach(t => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-white/5 hover:bg-white/5 transition-all";
            tr.innerHTML = `<td class="py-4 px-2"><span class="block text-purple-400 font-bold text-[10px] uppercase">${t.name}</span><span class="text-[8px] text-gray-600 uppercase font-black tracking-widest">${new Date(t.date).toLocaleDateString()}</span></td><td class="py-4 font-black text-[9px] text-gray-400 uppercase">${t.status}</td><td class="py-4 text-right pr-2 font-black text-emerald-400 font-gamer text-xs">#${t.rank}</td>`;
            tTable.appendChild(tr);
        });
    }

    function renderManualDeposits(deposits) {
        const dTable = document.getElementById('manual-deposits-table');
        if(!dTable) return;
        dTable.innerHTML = '';
        if (!deposits || deposits.length === 0) {
            dTable.innerHTML = '<tr><td class="py-10 text-center text-gray-600 italic text-[9px]">No pending requests</td></tr>';
            return;
        }
        deposits.forEach(d => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-white/5";
            const sClass = d.status === 'Approved' ? 'text-emerald-400' : (d.status === 'Pending' ? 'text-yellow-400' : 'text-red-400');
            tr.innerHTML = `<td class="py-4 px-2 text-[9px] font-black uppercase text-gray-400">${d.paymentMethod}</td><td class="py-4"><a href="${d.receiptImageUrl}" target="_blank" class="text-blue-400 underline text-[8px] font-bold">RECEIPT</a></td><td class="py-4 font-bold text-emerald-400 text-xs">${d.amount}</td><td class="py-4 font-black text-[9px] uppercase ${sClass}">${d.status}</td><td class="py-4 text-right text-gray-600 text-[8px]">${new Date(d.createdDate).toLocaleDateString()}</td>`;
            dTable.appendChild(tr);
        });
    }

    // --- DEEP TRANSACTION AUDIT ---
    window.applyTransactionFilters = async function() {
        const type = document.getElementById('filter-t-type')?.value || 'All';
        const start = document.getElementById('filter-t-start')?.value || null;
        const tTable = document.getElementById('transactions-table');
        if(!tTable) return;

        try {
            // Call the new Hub method for DEEP historical auditing
            const filtered = await connection.invoke("GetTransactionsFiltered", parseInt(playerId), type, start);
            tTable.innerHTML = '';
            
            if (!filtered || filtered.length === 0) {
                tTable.innerHTML = '<tr><td class="py-10 text-center text-gray-600 italic text-xs">No records found</td></tr>';
                return;
            }

            filtered.forEach(t => {
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
                tr.innerHTML = `<td class="py-4 px-2"><span class="px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${typeClass}">${typeLabel}</span></td><td class="py-4"><span class="block text-gray-300 font-medium text-[10px] leading-tight">${t.description}</span>${t.roomCode ? `<button onclick="loadMatchDetailByRoom('${t.roomCode}')" class="text-[8px] font-black text-purple-400 hover:text-purple-300 uppercase mt-1">#${t.roomCode} &rarr;</button>` : ''}</td><td class="py-4 text-right pr-2 font-black ${t.amount > 0 ? 'text-emerald-400' : 'text-yellow-500'} font-gamer text-xs">${parseFloat(t.amount).toFixed(2)}</td>`;
                tTable.appendChild(tr);
            });
        } catch (err) { console.error("Filter error:", err); }
    };

    const dForm = document.getElementById('deposit-form');
    if (dForm) {
        dForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('deposit-amount').value);
            const method = document.getElementById('deposit-method').value;
            const receipt = document.getElementById('deposit-receipt').value.trim();
            showConfirm(`Deposit ${amount} LUDC?`, async () => {
                const res = await connection.invoke("SubmitManualDeposit", parseInt(playerId), amount, method, receipt);
                if (res === "Success") { showToast("Submitted!"); dForm.reset(); loadPlayerData(); } else showToast(res, 'error');
            });
        });
    }

    async function getAssociatedTokenAddress(mint, owner, programId) {
        const [address] = await solanaWeb3.PublicKey.findProgramAddress(
            [owner.toBytes(), ASSOCIATED_TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return address;
    }

    window.loadMatchDetail = async function(id) {
        const g = await connection.invoke("GetGameAudit", id);
        if (g) showBoxScore(g);
    };

    window.loadMatchDetailByRoom = async function(room) {
        const g = await connection.invoke("GetGameAuditByRoom", room);
        if (g) showBoxScore(g);
    };

    function showBoxScore(g) {
        const modal = document.getElementById('audit-modal');
        const body = document.getElementById('audit-modal-body');
        let catColor = g.category === 'Tournament' ? 'text-yellow-500' : 'text-purple-400';
        body.innerHTML = `<div class="space-y-10 text-center"><h3 class="text-3xl font-black text-emerald-400 uppercase">Box Score</h3><p class="text-[10px] font-black uppercase ${catColor}">${g.category}</p><div class="glass-panel p-10 rounded-[2.5rem]"><p class="text-gray-500 text-[10px] font-black mb-4">Winner</p><h2 class="text-4xl font-black text-yellow-400 font-gamer uppercase">${g.winner1}</h2></div><div class="p-8 grid grid-cols-2 gap-4">${g.participants.map(p => `<div class="p-4 bg-white/5 rounded-2xl border border-white/5 font-bold">${p.name}</div>`).join('')}</div></div>`;
        modal.classList.remove('hidden');
        feather.replace();
    }

    window.closeAuditModal = (e) => { if (e && e.target !== e.currentTarget) return; document.getElementById('audit-modal').classList.add('hidden'); };
    window.logout = () => { localStorage.clear(); window.location.href = 'index.html'; };
});