// Wallet connection handler
document.addEventListener('DOMContentLoaded', () => {
    // Mock wallet connection
    const walletBtn = document.getElementById('connect-wallet');
    if (walletBtn) {
        walletBtn.addEventListener('click', () => {
            walletBtn.innerHTML = '<i data-feather="loader" class="animate-spin mr-2"></i> Connecting...';
            feather.replace();
            
            // Simulate connection delay
            setTimeout(() => {
                walletBtn.innerHTML = '<i data-feather="check-circle" class="mr-2"></i> Connected';
                feather.replace();
                walletBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                walletBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            }, 1500);
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Track outbound links
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (link.hostname !== window.location.hostname) {
            link.addEventListener('click', function() {
                // Here you would typically send analytics data
                console.log('Outbound link clicked:', this.href);
            });
        }
    });

    // Tokenomics section interactivity
    const tokenomicsSection = document.getElementById('tokenomics');
    if (tokenomicsSection) {
        // Click to expand/collapse details
        const tokenomicsItems = tokenomicsSection.querySelectorAll('.tokenomics-item');
        tokenomicsItems.forEach((item, index) => {
            // Staggered entry animation
            item.style.opacity = '0';
            item.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);

            // Click handler for expanding details
            item.addEventListener('click', function() {
                const detail = this.querySelector('.tokenomics-detail');
                const isExpanded = !detail.classList.contains('hidden');
                
                if (isExpanded) {
                    // Collapse
                    detail.classList.add('hidden');
                    this.style.transform = 'translateX(0) translateY(0)';
                    this.classList.remove('bg-purple-900/30');
                } else {
                    // Expand
                    detail.classList.remove('hidden');
                    this.style.transform = 'translateX(4px) translateY(-2px) scale(1.01)';
                    this.classList.add('bg-purple-900/30');
                }
            });
        });
    }
});