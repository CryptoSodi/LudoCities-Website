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
    
    let phantomWallet = null;

    function getPhantomProvider() {
        const provider = window.phantom?.solana || window.solana;
        if (!provider?.isPhantom) return null;
        return provider;
    }

    function updatePhantomUi(connected, address = "") {
        const connectBtn = document.getElementById('btn-phantom-connect');
        const statusLabel = document.getElementById('phantom-status-label');
        const addressLabel = document.getElementById('phantom-address-label');

        if (connectBtn) {
            connectBtn.innerHTML = connected
                ? `<img src="https://phantom.app/favicon.ico" class="w-3 h-3 rounded-full"> ${address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'Connected'}`
                : `<img src="https://phantom.app/favicon.ico" class="w-3 h-3 rounded-full"> Connect Phantom`;
        }

        if (statusLabel) {
            statusLabel.innerText = connected ? "Phantom Connected" : "Phantom Disconnected";
            statusLabel.className = connected
                ? "text-xs font-black uppercase text-purple-400"
                : "text-xs font-black uppercase text-gray-500";
        }

        if (addressLabel) {
            addressLabel.innerText = connected && address ? address : "No Wallet Linked";
        }
    }

    function bindPhantomEvents(provider) {
        if (!provider || provider.__ludcBound) return;

        provider.on?.('connect', (publicKey) => {
            phantomWallet = publicKey?.toString?.() || provider.publicKey?.toString?.() || null;
            updatePhantomUi(true, phantomWallet || "");
        });

        provider.on?.('disconnect', () => {
            phantomWallet = null;
            updatePhantomUi(false);
        });

        provider.on?.('accountChanged', (publicKey) => {
            phantomWallet = publicKey?.toString?.() || null;
            updatePhantomUi(!!phantomWallet, phantomWallet || "");
        });

        provider.__ludcBound = true;
    }

    async function syncExistingPhantomSession() {
        const provider = getPhantomProvider();
        if (!provider) {
            updatePhantomUi(false);
            return;
        }

        bindPhantomEvents(provider);

        if (provider.isConnected && provider.publicKey) {
            phantomWallet = provider.publicKey.toString();
            updatePhantomUi(true, phantomWallet);
            return;
        }

        try {
            const resp = await provider.connect({ onlyIfTrusted: true });
            phantomWallet = resp?.publicKey?.toString() || provider.publicKey?.toString?.() || null;
            updatePhantomUi(!!phantomWallet, phantomWallet || "");
        } catch {
            updatePhantomUi(false);
        }
    }

    async function findAssociatedTokenAddress(owner, mint, tokenProgramId = TOKEN_2022_PROGRAM_ID) {
        const [address] = await solanaWeb3.PublicKey.findProgramAddress(
            [owner.toBytes(), tokenProgramId.toBytes(), mint.toBytes()],
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return address;
    }

    function createAssociatedTokenAccountInstruction(payer, associatedToken, owner, mint, tokenProgramId = TOKEN_2022_PROGRAM_ID) {
        return new solanaWeb3.TransactionInstruction({
            programId: ASSOCIATED_TOKEN_PROGRAM_ID,
            keys: [
                { pubkey: payer, isSigner: true, isWritable: true },
                { pubkey: associatedToken, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: false },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: tokenProgramId, isSigner: false, isWritable: false }
            ],
            data: new Uint8Array([])
        });
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
            await loadRpcConfig();
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
    syncExistingPhantomSession();

    async function loadRpcConfig() {
        try {
            const rpc = await connection.invoke("GetClientRpcConfig", authToken, "Player");
            const display = document.getElementById('display-rpc-url');
            if (display) {
                display.innerText = rpc?.hasRpc
                    ? (rpc.displayLabel || rpc.provider || 'Configured RPC')
                    : "No RPC Configured";
            }
        } catch (err) {
            const display = document.getElementById('display-rpc-url');
            if (display) display.innerText = "RPC Load Failed";
        }
    }

    // --- WEB3 PHANTOM ---
    window.connectPhantom = async function() {
        try {
            const provider = getPhantomProvider();
            if (!provider) {
                const insecure = !window.isSecureContext && !isLocal;
                showToast(insecure ? "Phantom needs HTTPS or localhost." : "Phantom not found!", 'error');
                window.open("https://phantom.app/", "_blank");
                return;
            }

            bindPhantomEvents(provider);
            const resp = await provider.connect();
            phantomWallet = resp.publicKey.toString();
            updatePhantomUi(true, phantomWallet);
            showToast("Wallet Linked!");
        } catch (err) {
            const message =
                err?.code === 4001 ? "Phantom connection rejected." :
                err?.message?.includes("secure") ? "Phantom needs HTTPS or localhost." :
                err?.message || "Connection failed.";
            showToast(message, 'error');
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
                showToast("Preparing Transaction...", 'success');
                const prep = await connection.invoke("PrepareLudcDeposit", authToken, phantomWallet, amount);
                if (!prep) throw new Error("Server could not prepare the deposit transaction.");
                if (!prep.senderAtaExists) throw new Error("Your Phantom wallet does not have an LUDC token account.");

                const fromWallet = new solanaWeb3.PublicKey(prep.senderOwner);
                const toWallet = new solanaWeb3.PublicKey(prep.destinationOwner);
                const fromAta = new solanaWeb3.PublicKey(prep.senderAta);
                const toAta = new solanaWeb3.PublicKey(prep.destinationAta);

                const data = new Uint8Array(10);
                const view = new DataView(data.buffer);
                data[0] = 12;
                view.setBigUint64(1, BigInt(prep.amountRaw), true);
                data[9] = prep.decimals;

                const transaction = new solanaWeb3.Transaction();
                if (!prep.destinationAtaExists) {
                    transaction.add(createAssociatedTokenAccountInstruction(fromWallet, toAta, toWallet, LUDC_MINT));
                }
                transaction.add(new solanaWeb3.TransactionInstruction({
                    keys: [
                        { pubkey: fromAta, isSigner: false, isWritable: true },
                        { pubkey: LUDC_MINT, isSigner: false, isWritable: false },
                        { pubkey: toAta, isSigner: false, isWritable: true },
                        { pubkey: fromWallet, isSigner: true, isWritable: false }
                    ],
                    programId: TOKEN_2022_PROGRAM_ID,
                    data
                }));
                transaction.feePayer = fromWallet;
                transaction.recentBlockhash = prep.blockhash;

                const provider = window.phantom?.solana || window.solana;
                const result = await provider.signAndSendTransaction(transaction);
                const signature = result?.signature || result;
                const confirmed = await connection.invoke("ConfirmSolanaTransaction", authToken, "Player", signature);
                showToast(
                    confirmed
                        ? "Deposit Signature: " + signature.substring(0,8) + "..."
                        : "Signed. Confirmation pending.",
                    'success'
                );
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
