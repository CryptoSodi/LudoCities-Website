// Initialize SignalR
const hubUrl = "https://signal.ludocities.com/DashboardHub";

const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl)
    .withAutomaticReconnect()
    .build();

async function startConnection() {
    try {
        await connection.start();
        console.log("SignalR Connected.");
    } catch (err) {
        console.log(err);
        setTimeout(startConnection, 5000);
    }
}

startConnection();

// ✅ Google Login Callback
window.handleCredentialResponse = async function(response) {
    const errorEl = document.getElementById('error-message');
    const loadingEl = document.getElementById('loading-spinner');
    
    errorEl.classList.add('hidden');
    loadingEl.classList.remove('hidden');

    try {
        console.log("Google response received, authenticating via Auth API...");

        // 1. Send id_token to Ludo.Api HTTP endpoint
        const authResponse = await fetch("https://api.ludocities.com/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: response.credential })
        });

        if (!authResponse.ok) {
            throw new Error("Authentication failed.");
        }

        const result = await authResponse.json();
        
        if (result && result.authToken) {
            console.log("Authentication successful! Role:", result.role);
            
            // 2. Store session data
            localStorage.setItem('LudoAuthToken', result.authToken);
            localStorage.setItem('PlayerId', result.playerId);
            localStorage.setItem('PlayerRole', result.role);

            // 3. Redirect based on role
            if (result.role === 'Admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'user.html';
            }
        } else {
            throw new Error("Authentication failed. Server returned invalid response.");
        }
    } catch (err) {
        console.error("Auth Error:", err);
        loadingEl.classList.add('hidden');
        errorEl.innerText = "Login failed: " + err.message;
        errorEl.classList.remove('hidden');
    }
}
