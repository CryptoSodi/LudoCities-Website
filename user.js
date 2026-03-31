document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    const playerId = localStorage.getItem('PlayerId');
    const authToken = localStorage.getItem('LudoAuthToken');

    if (!playerId || !authToken) {
        window.location.href = 'index.html';
        return;
    }

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://192.168.1.15:8085/DashboardHub")
        .withAutomaticReconnect()
        .build();

    const statusBadge = document.getElementById('connection-status');
    let currentTab = 'stats';
    let userTransactions = [];
    let internalWalletAddress = "";

    // --- SOLANA CONFIG ---
    const LUDC_MINT = "JSXWEi4ZXJkrkqWQg4UjUPzpmpYYFxzLmBuADh5cyai";
    const TOKEN_2022_PROGRAM_ID = new solanaWeb3.PublicKey("TokenzQdBNbLqP5VEhdkXEhsnwt4mcUzndzUtNo5vUP");
    const RPC_URL = "https://api.mainnet-beta.solana.com";
    const solConnection = new solanaWeb3.Connection(RPC_URL, "confirmed");

    let phantomWallet = null;

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
        yesBtn.onclick = () => { onConfirm(); closeConfirm(); };
    };

    window.closeConfirm = () => document.getElementById('confirm-modal').classList.add('hidden');

    // --- NAVIGATION ---

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

    // --- WEB3 PHANTOM LOGIC ---

    window.connectPhantom = async function() {
        try {
            const isPhantomInstalled = window.solana && window.solana.isPhantom;
            if (!isPhantomInstalled) {
                showToast("Phantom wallet not found!", 'error');
                window.open("https://phantom.app/", "_blank");
                return;
            }

            const resp = await window.solana.connect();
            phantomWallet = resp.publicKey.toString();
            
            document.getElementById('btn-phantom-connect').innerHTML = `<img src="https://phantom.app/favicon.ico" class="w-3 h-3 rounded-full"> Connected`;
            document.getElementById('phantom-status-label').innerText = "Phantom Connected";
            document.getElementById('phantom-status-label').className = "text-xs font-black uppercase text-purple-400";
            document.getElementById('phantom-address-label').innerText = phantomWallet;
            
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
                showToast("Requesting signature...", 'success');
                
                const fromWallet = new solanaWeb3.PublicKey(phantomWallet);
                const toWallet = new solanaWeb3.PublicKey(internalWalletAddress);
                const mintPublic = new solanaWeb3.PublicKey(LUDC_MINT);

                // 1. Get associated token accounts
                const fromTokenAccount = await getAssociatedTokenAddress(mintPublic, fromWallet, TOKEN_2022_PROGRAM_ID);
                const toTokenAccount = await getAssociatedTokenAddress(mintPublic, toWallet, TOKEN_2022_PROGRAM_ID);

                // 2. Build Transaction
                const transaction = new solanaWeb3.Transaction();
                
                // Note: On Mainnet, we'd check if the 'to' account exists and add CreateAccount instruction if needed.
                // But since ludcpaymentprovider ensures player wallets exist, it should be fine.
                
                const decimals = 9; // LUDC decimals
                const amountInLamports = amount * Math.pow(10, decimals);

                const transferInstruction = createTransferCheckedInstruction(
                    fromTokenAccount,
                    mintPublic,
                    toTokenAccount,
                    fromWallet,
                    amountInLamports,
                    decimals,
                    [],
                    TOKEN_2022_PROGRAM_ID
                );

                transaction.add(transferInstruction);
                transaction.feePayer = fromWallet;
                const { blockhash } = await solConnection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;

                // 3. Sign & Send
                const { signature } = await window.solana.signAndSendTransaction(transaction);
                showToast("Transaction sent! Verifying...");
                console.log("Sig:", signature);
                
                // Scanner service will pick it up. No need to notify hub.
            } catch (err) {
                console.error(err);
                showToast("Deposit failed or cancelled.", 'error');
            }
        });
    };

    window.withdrawLUDC = async function() {
        const amount = parseFloat(document.getElementById('web3-withdraw-amount').value);
        const dest = document.getElementById('web3-withdraw-address').value.trim();

        if (!amount || amount <= 0) { showToast("Invalid amount.", 'error'); return; }
        if (!dest) { showToast("Destination required.", 'error'); return; }

        showConfirm(`Withdraw ${amount} LUDC to ${dest.substring(0,6)}...?`, async () => {
            try {
                const res = await connection.invoke("InitiateWithdrawal", authToken, dest, amount);
                if (res.startsWith("Success") || res === "Success") {
                    showToast("Withdrawal processed!");
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

            userTransactions = data.transactions || [];
            internalWalletAddress = data.walletAddress;

            document.getElementById('profile-name').innerText = data.name;
            document.getElementById('profile-img').src = data.picture || 'player.webp';
            document.getElementById('main-profile-name').innerText = data.name;
            document.getElementById('main-profile-img').src = data.picture || 'player.webp';
            
            document.getElementById('stat-rank').innerText = data.rank;
            document.getElementById('stat-wins').innerText = data.wins;
            document.getElementById('stat-played').innerText = data.played;
            document.getElementById('stat-ludc').innerText = parseFloat(data.ludc).toFixed(2);
            document.getElementById('display-wallet-address').innerText = data.walletAddress ? `${data.walletAddress.substring(0,6)}...${data.walletAddress.substring(38)}` : "No Address";

            // Table rendering...
            applyTransactionFilters();
            renderMatches(data.recentGames);
            renderManualDeposits(data.manualDeposits);

            feather.replace();
        } catch (err) { console.error(err); }
    }

    function renderMatches(games) {
        const mTable = document.getElementById('matches-table');
        mTable.innerHTML = '';
        if (games && games.length > 0) {
            games.forEach(g => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer group";
                tr.onclick = () => loadMatchDetail(g.id);
                const resultClass = g.isWin ? 'text-emerald-400' : 'text-red-400';
                tr.innerHTML = `<td class="py-4 px-2"><div><span class="font-bold text-gray-200 text-xs">${g.type}P</span></div><span class="text-[8px] text-gray-600 uppercase italic">VS: ${g.opponents}</span></td><td class="py-4 font-black text-[10px] ${resultClass}">${g.isWin ? 'VICTORY' : 'DEFEAT'}</td><td class="py-4 font-bold text-yellow-500 text-xs">${g.bet}</td><td class="py-4 text-right pr-2"><span class="block text-gray-600 text-[8px]">${new Date(g.date).toLocaleDateString()}</span><i data-feather="chevron-right" width="10" class="inline text-gray-800 group-hover:text-white"></i></td>`;
                mTable.appendChild(tr);
            });
        }
    }

    function renderManualDeposits(deposits) {
        const dTable = document.getElementById('manual-deposits-table');
        dTable.innerHTML = '';
        if (deposits && deposits.length > 0) {
            deposits.forEach(d => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5";
                const sClass = d.status === 'Approved' ? 'text-emerald-400' : (d.status === 'Pending' ? 'text-yellow-400' : 'text-red-400');
                tr.innerHTML = `<td class="py-4 px-2 text-[9px] font-black uppercase text-gray-400">${d.paymentMethod}</td><td class="py-4"><a href="${d.receiptImageUrl}" target="_blank" class="text-blue-400 underline text-[8px] font-bold">RECEIPT</a></td><td class="py-4 font-bold text-emerald-400 text-xs">${d.amount}</td><td class="py-4 font-black text-[9px] uppercase ${sClass}">${d.status}</td><td class="py-4 text-right text-gray-600 text-[8px]">${new Date(d.createdDate).toLocaleDateString()}</td>`;
                dTable.appendChild(tr);
            });
        }
    }

    window.applyTransactionFilters = function() {
        const type = document.getElementById('filter-t-type')?.value || 'All';
        let filtered = userTransactions;
        if (type !== 'All') filtered = filtered.filter(t => t.type === parseInt(type));
        
        const tTable = document.getElementById('transactions-table');
        tTable.innerHTML = '';
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
            tr.innerHTML = `<td class="py-4 px-2"><span class="px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${typeClass}">${typeLabel}</span></td><td class="py-4"><span class="block text-gray-300 font-medium text-[10px] leading-tight">${t.description}</span>${t.roomCode ? `<button onclick="loadMatchDetailByRoom('${t.roomCode}')" class="text-[8px] font-black text-purple-400 hover:text-purple-300 uppercase mt-1">#${t.roomCode} &rarr;</button>` : ''}</td><td class="py-4 text-right pr-2 font-black ${t.amount>0?'text-emerald-400':'text-yellow-500'} text-xs">${parseFloat(t.amount).toFixed(2)}</td>`;
            tTable.appendChild(tr);
        });
    }

    // --- HELPERS FOR TOKEN-2022 ---
    async function getAssociatedTokenAddress(mint, owner, programId) {
        const [address] = await solanaWeb3.PublicKey.findProgramAddress(
            [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
            new solanaWeb3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
        );
        return address;
    }

    function createTransferCheckedInstruction(from, mint, to, owner, amount, decimals, signers, programId) {
        const keys = [
            { pubkey: from, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: to, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false },
        ];
        signers.forEach(s => keys.push({ pubkey: s, isSigner: true, isWritable: false }));
        
        const data = Buffer.alloc(13);
        data.writeUInt8(12, 0); // TransferChecked instruction index
        data.writeBigUInt64LE(BigInt(amount), 1);
        data.writeUInt8(decimals, 9);

        return new solanaWeb3.TransactionInstruction({ keys, programId, data });
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