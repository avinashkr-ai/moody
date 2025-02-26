document.addEventListener('DOMContentLoaded', function() {
    const recipesContainer = document.getElementById('recipesContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const hitCountSpan = document.getElementById('hitCount');
    const userIPSpan = document.getElementById('userIP');

    function showLoading() {
        loadingSpinner.style.display = 'block';
        recipesContainer.style.display = 'none';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
        recipesContainer.style.display = 'block';
    }

    async function getClientIP() {
        try {
            // Check localStorage first
            const storedIPInfo = localStorage.getItem('ipInfo');
            if (storedIPInfo) {
                const ipInfo = JSON.parse(storedIPInfo);
                return ipInfo.ip.replace(/\./g, '_');
            }

            // If not in localStorage, fetch from API
            const response = await fetch('/api/get-ip');
            const ipInfo = await response.json();
            
            // Store in localStorage
            localStorage.setItem('ipInfo', JSON.stringify(ipInfo));
            
            return ipInfo.ip.replace(/\./g, '_');
        } catch (error) {
            console.error('Error fetching IP:', error);
            return null;
        }
    }

    async function updateUserIP() {
        try {
            const ipInfo = JSON.parse(localStorage.getItem('ipInfo'));
            if (ipInfo && ipInfo.ip) {
                const targetIP = ipInfo.ip;
                let currentIP = [0, 0, 0, 0];

                function animateIP() {
                    let ipString = currentIP.join('.');
                    userIPSpan.textContent = `IP: ${ipString}`;

                    if (ipString !== targetIP) {
                        let targetOctets = targetIP.split('.').map(Number);

                        for (let i = 0; i < 4; i++) {
                            if (currentIP[i] < targetOctets[i]) {
                                currentIP[i]++;
                            }
                        }

                        setTimeout(animateIP, 10); // Adjust the timeout for speed
                    } else {
                        userIPSpan.textContent = `IP: ${targetIP}`;
                    }
                }

                animateIP();
            } else {
                userIPSpan.textContent = 'IP: Not found';
            }
        } catch (error) {
            console.error('Error updating user IP:', error);
            userIPSpan.textContent = 'IP: Error';
        }
    }

    async function updateHitCount() {
        try {
            const response = await fetch('/api/hit-count', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            const finalHitCount = data.hit_count;
            let currentHitCount = parseInt(hitCountSpan.textContent) || 0;

            function animateHitCount() {
                if (currentHitCount < finalHitCount) {
                    currentHitCount++;
                    hitCountSpan.textContent = currentHitCount;
                    setTimeout(animateHitCount, 10); // Adjust the timeout for speed
                } else {
                    hitCountSpan.textContent = finalHitCount; // Ensure final value
                }
            }

            animateHitCount();
        } catch (error) {
            console.error('Error updating hit count:', error);
        }
    }

    // Call updateHitCount and updateUserIP on page load
    updateHitCount();
    updateUserIP();

    document.getElementById('feedbackForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const rating = document.querySelector('input[name="rating"]:checked');
        const comment = document.getElementById('comment').value;

        if (!rating) {
            alert('Please select a rating.');
            return;
        }

        // Get the client's IP address from local storage
        const ipInfo = JSON.parse(localStorage.getItem('ipInfo'));
        const clientIP = ipInfo ? ipInfo.ip : null;

        if (!clientIP) {
            alert('Could not get your IP address. Please make sure to visit the home page first.');
            return;
        }

        // Send feedback to the server
        fetch('/api/save-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: rating.value,
                comment: comment,
                clientIP: clientIP
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Thank you for your feedback!');
                document.getElementById('feedbackForm').reset();
            } else {
                alert('Failed to submit feedback. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
});