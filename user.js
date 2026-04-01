document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    const playerId = localStorage.getItem('PlayerId');
    const authToken = localStorage.getItem('LudoAuthToken');

    if (!playerId || !authToken) {
        window.location.href = 'index.html';
        return;
    }

    // Standard port for local dev
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://192.168.1.15:8085/DashboardHub")
        .withAutomaticReconnect()
        .build();

    const statusBadge = document.getElementById('connection-status');
    let currentTab = 'stats';
    let userTransactions = [];
    let internalWalletAddress = "";

<<<<<<< HEAD
    // --- SOLANA CONFIG (Multi-RPC Fallback for Browser CORS) ---
    const LUDC_MINT = new solanaWeb3.PublicKey("JSXWEi4ZXJkrkqWQg4UjUPzpmpYYFxzLmBuADh5cyai");
    const TOKEN_2022_PROGRAM_ID = new solanaWeb3.PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
    const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
    
    // List of reliable RPCs to try in sequence
    const RPC_ENDPOINTS = [
        "https://api.mainnet-beta.solana.com",
        "https://solana-mainnet.rpc.extrnode.com",
        "https://rpc.ankr.com/solana"
    ];
    
    let solConnection = new solanaWeb3.Connection(RPC_ENDPOINTS[0], "confirmed");
    let phantomWallet = null;

    // Helper to rotate RPC if one fails
    async function getValidConnection() {
        for (const url of RPC_ENDPOINTS) {
            try {
                console.log(`Testing RPC: ${url}`);
                const conn = new solanaWeb3.Connection(url, "confirmed");
                await conn.getLatestBlockhash('confirmed');
                console.log(`RPC Valid: ${url}`);
                return conn;
            } catch (err) {
                console.warn(`RPC Failed (${url}):`, err.message);
            }
        }
        return null;
    }
=======
    // --- SOLANA CONFIG ---
    const LUDC_MINT = "JSXWEi4ZXJkrkqWQg4UjUPzpmpYYFxzLmBuADh5cyai";
    const TOKEN_2022_PROGRAM_ID = new solanaWeb3.PublicKey("TokenzQdBNbLqP5VEhdkXEhsnwt4mcUzndzUtNo5vUP");
    const RPC_URL = "https://api.mainnet-beta.solana.com";
    const solConnection = new solanaWeb3.Connection(RPC_URL, "confirmed");

    let phantomWallet = null;
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa

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
<<<<<<< HEAD
            const provider = window.phantom?.solana || window.solana;
            if (!provider?.isPhantom) {
                showToast("Phantom not found!", 'error');
=======
            const isPhantomInstalled = window.solana && window.solana.isPhantom;
            if (!isPhantomInstalled) {
                showToast("Phantom wallet not found!", 'error');
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
                window.open("https://phantom.app/", "_blank");
                return;
            }

<<<<<<< HEAD
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
            console.error("Phantom Error:", err);
=======
            const resp = await window.solana.connect();
            phantomWallet = resp.publicKey.toString();
            
            document.getElementById('btn-phantom-connect').innerHTML = `<img src="https://phantom.app/favicon.ico" class="w-3 h-3 rounded-full"> Connected`;
            document.getElementById('phantom-status-label').innerText = "Phantom Connected";
            document.getElementById('phantom-status-label').className = "text-xs font-black uppercase text-purple-400";
            document.getElementById('phantom-address-label').innerText = phantomWallet;
            
            showToast("Wallet Linked!");
        } catch (err) {
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
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
<<<<<<< HEAD
                showToast("Establishing Secure Connection...", 'success');
                
                // Use fallback connection logic
                const activeConn = await getValidConnection();
                if (!activeConn) {
                    throw new Error("All Solana nodes rejected the connection. Your browser may be blocking the blockchain. Check Site Settings > Insecure Content.");
                }

                const fromWallet = new solanaWeb3.PublicKey(phantomWallet);
                const toWallet = new solanaWeb3.PublicKey(internalWalletAddress);

                const fromAta = await getAssociatedTokenAddress(LUDC_MINT, fromWallet, TOKEN_2022_PROGRAM_ID);
                const toAta = await getAssociatedTokenAddress(LUDC_MINT, toWallet, TOKEN_2022_PROGRAM_ID);

                showToast("Fetching network data...");
                const { blockhash } = await activeConn.getLatestBlockhash('confirmed');

                // 3. Build Instruction (Index 12 = TransferChecked)
                const data = new Uint8Array(10);
                const view = new DataView(data.buffer);
                data[0] = 12; 
                view.setBigUint64(1, BigInt(Math.round(amount * 1e9)), true);
                data[9] = 9; 

                const keys = [
                    { pubkey: fromAta, isSigner: false, isWritable: true },
                    { pubkey: LUDC_MINT, isSigner: false, isWritable: false },
                    { pubkey: toAta, isSigner: false, isWritable: true },
                    { pubkey: fromWallet, isSigner: true, isWritable: false }
                ];

                const transaction = new solanaWeb3.Transaction();
                transaction.add(new solanaWeb3.TransactionInstruction({
                    keys,
                    programId: TOKEN_2022_PROGRAM_ID,
                    data
                }));
                
                transaction.feePayer = fromWallet;
                transaction.recentBlockhash = blockhash;

                showToast("Sign in Phantom...");
                const provider = window.phantom?.solana || window.solana;
                const { signature } = await provider.signAndSendTransaction(transaction);
                showToast("Deposit Sent! Verifying...");
                console.log("Deposit Signature:", signature);
                
            } catch (err) {
                console.error("Deposit Error:", err);
                showToast(err.message || "Transfer failed.", 'error');
=======
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
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
            }
        });
    };

    window.withdrawLUDC = async function() {
        const amount = parseFloat(document.getElementById('web3-withdraw-amount').value);
        const dest = document.getElementById('web3-withdraw-address').value.trim();
<<<<<<< HEAD
=======

>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
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
<<<<<<< HEAD

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

            const ratio = data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0;
            const ratioEl = document.getElementById('stat-ratio');
            if(ratioEl) ratioEl.innerText = ratio;
            document.getElementById('stat-played-hud').innerText = data.played;
            document.getElementById('stat-wins-hud').innerText = data.wins;
            document.getElementById('stat-lost-hud').innerText = data.lost;
            document.getElementById('stat-best-hud').innerText = parseFloat(data.bestWin).toFixed(2);
            document.getElementById('stat-total-win-hud').innerText = parseFloat(data.totalWin).toFixed(2);
            document.getElementById('stat-total-lost-hud').innerText = parseFloat(data.totalLost).toFixed(2);

=======
            
            document.getElementById('stat-rank').innerText = data.rank;
            document.getElementById('stat-wins').innerText = data.wins;
            document.getElementById('stat-played').innerText = data.played;
            document.getElementById('stat-ludc').innerText = parseFloat(data.ludc).toFixed(2);
            document.getElementById('display-wallet-address').innerText = data.walletAddress ? `${data.walletAddress.substring(0,6)}...${data.walletAddress.substring(38)}` : "No Address";

            // Table rendering...
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
            applyTransactionFilters();
            renderMatches(data.recentGames);
            renderManualDeposits(data.manualDeposits);

            feather.replace();
        } catch (err) { console.error(err); }
    }

    function renderMatches(games) {
        const mTable = document.getElementById('matches-table');
<<<<<<< HEAD
        if(!mTable) return;
=======
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
        mTable.innerHTML = '';
        if (games && games.length > 0) {
            games.forEach(g => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer group";
                tr.onclick = () => loadMatchDetail(g.id);
<<<<<<< HEAD
                const resClass = g.isWin ? 'text-emerald-400' : 'text-red-400';
                tr.innerHTML = `<td class="py-4 px-2"><div><span class="font-bold text-gray-200 text-xs">${g.type}P</span></div><span class="text-[8px] text-gray-600 uppercase italic">VS: ${g.opponents}</span></td><td class="py-4 font-black text-[10px] ${resClass}">${g.isWin ? 'WIN' : 'LOSS'}</td><td class="py-4 font-bold text-yellow-500 text-xs">${g.bet}</td><td class="py-4 text-right pr-2"><span class="block text-gray-600 text-[8px]">${new Date(g.date).toLocaleDateString()}</span><i data-feather="chevron-right" width="10" class="inline text-gray-800 group-hover:text-white"></i></td>`;
=======
                const resultClass = g.isWin ? 'text-emerald-400' : 'text-red-400';
                tr.innerHTML = `<td class="py-4 px-2"><div><span class="font-bold text-gray-200 text-xs">${g.type}P</span></div><span class="text-[8px] text-gray-600 uppercase italic">VS: ${g.opponents}</span></td><td class="py-4 font-black text-[10px] ${resultClass}">${g.isWin ? 'VICTORY' : 'DEFEAT'}</td><td class="py-4 font-bold text-yellow-500 text-xs">${g.bet}</td><td class="py-4 text-right pr-2"><span class="block text-gray-600 text-[8px]">${new Date(g.date).toLocaleDateString()}</span><i data-feather="chevron-right" width="10" class="inline text-gray-800 group-hover:text-white"></i></td>`;
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
                mTable.appendChild(tr);
            });
        }
    }

    function renderManualDeposits(deposits) {
        const dTable = document.getElementById('manual-deposits-table');
<<<<<<< HEAD
        if(!dTable) return;
=======
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
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
<<<<<<< HEAD
        const start = document.getElementById('filter-t-start')?.value;
        let filtered = userTransactions;
        if (type !== 'All') filtered = filtered.filter(t => t.type === parseInt(type));
        if (start) filtered = filtered.filter(t => new Date(t.date).getTime() >= new Date(start).getTime());
        
        const tTable = document.getElementById('transactions-table');
        if(!tTable) return;
=======
        let filtered = userTransactions;
        if (type !== 'All') filtered = filtered.filter(t => t.type === parseInt(type));
        
        const tTable = document.getElementById('transactions-table');
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
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
<<<<<<< HEAD
            tr.innerHTML = `<td class="py-4 px-2"><span class="px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${typeClass}">${typeLabel}</span></td><td class="py-4"><span class="block text-gray-300 font-medium text-[10px] leading-tight">${t.description}</span>${t.roomCode ? `<button onclick="loadMatchDetailByRoom('${t.roomCode}')" class="text-[8px] font-black text-purple-400 hover:text-purple-300 uppercase mt-1">#${t.roomCode} &rarr;</button>` : ''}</td><td class="py-4 text-right pr-2 font-black ${t.amount > 0 ? 'text-emerald-400' : 'text-yellow-500'} text-xs">${parseFloat(t.amount).toFixed(2)}</td>`;
=======
            tr.innerHTML = `<td class="py-4 px-2"><span class="px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${typeClass}">${typeLabel}</span></td><td class="py-4"><span class="block text-gray-300 font-medium text-[10px] leading-tight">${t.description}</span>${t.roomCode ? `<button onclick="loadMatchDetailByRoom('${t.roomCode}')" class="text-[8px] font-black text-purple-400 hover:text-purple-300 uppercase mt-1">#${t.roomCode} &rarr;</button>` : ''}</td><td class="py-4 text-right pr-2 font-black ${t.amount>0?'text-emerald-400':'text-yellow-500'} text-xs">${parseFloat(t.amount).toFixed(2)}</td>`;
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
            tTable.appendChild(tr);
        });
    }

<<<<<<< HEAD
    async function getAssociatedTokenAddress(mint, owner, programId) {
        const [address] = await solanaWeb3.PublicKey.findProgramAddress(
            [owner.toBytes(), ASSOCIATED_TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
            ASSOCIATED_TOKEN_PROGRAM_ID
=======
    // --- HELPERS FOR TOKEN-2022 ---
    async function getAssociatedTokenAddress(mint, owner, programId) {
        const [address] = await solanaWeb3.PublicKey.findProgramAddress(
            [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
            new solanaWeb3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
        );
        return address;
    }

<<<<<<< HEAD
=======
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

>>>>>>> c28cc60c7a7e8700a4ef9c2ae979615c356ca5fa
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