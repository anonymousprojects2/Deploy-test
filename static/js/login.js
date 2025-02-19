document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const roleInput = document.getElementById('roleInput');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Update hidden role input
            roleInput.value = button.dataset.role;
            // Clear any previous messages
            errorMessage.textContent = '';
            successMessage.textContent = '';
        });
    });

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous messages
        errorMessage.textContent = '';
        successMessage.textContent = '';
        
        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        const formData = {
            username: loginForm.username.value.trim(),
            password: loginForm.password.value,
            role: roleInput.value
        };

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                // Show success message
                successMessage.textContent = 'Login successful! Redirecting...';
                
                // Redirect based on role
                setTimeout(() => {
                    window.location.href = formData.role === 'admin' 
                        ? '/admin/dashboard' 
                        : '/student/dashboard';
                }, 1000);
            } else {
                // Show error message
                errorMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });
});
