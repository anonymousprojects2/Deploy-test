document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.classList.contains('logout')) return;
            e.preventDefault();
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const targetSection = this.dataset.section;
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });

    // QR Code Generation
    let qrUpdateInterval;
    const generateBtn = document.getElementById('generateQR');
    const departmentSelect = document.getElementById('department');
    const yearSelect = document.getElementById('year');
    const qrCodeDiv = document.getElementById('qrCode');
    const timerSpan = document.getElementById('timer');

    generateBtn.addEventListener('click', function() {
        const department = departmentSelect.value;
        const year = yearSelect.value;

        if (!department || !year) {
            alert('Please select both department and year');
            return;
        }

        // Start QR generation
        startQRGeneration(department, year);
    });

    function startQRGeneration(department, year) {
        // Clear any existing interval
        if (qrUpdateInterval) {
            clearInterval(qrUpdateInterval);
        }

        // Initial QR generation
        generateQR(department, year);

        // Set up timer and interval for updates
        let timeLeft = 15;
        timerSpan.textContent = timeLeft;

        qrUpdateInterval = setInterval(() => {
            timeLeft--;
            timerSpan.textContent = timeLeft;

            if (timeLeft <= 0) {
                timeLeft = 15;
                generateQR(department, year);
            }
        }, 1000);
    }

    async function generateQR(department, year) {
        try {
            const response = await fetch('/admin/generate-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ department, year })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Add timestamp to prevent caching
                const timestamp = new Date().getTime();
                qrCodeDiv.innerHTML = `<img src="${data.qr_path}?t=${timestamp}" alt="QR Code">`;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error generating QR:', error);
            qrCodeDiv.innerHTML = '<p class="error">Error generating QR code</p>';
        }
    }

    // Attendance Records
    const attendanceTable = document.getElementById('attendanceData');
    const dateFilter = document.getElementById('dateFilter');
    const deptFilter = document.getElementById('deptFilter');
    const yearFilter = document.getElementById('yearFilter');
    const exportBtn = document.getElementById('exportExcel');

    async function loadAttendanceData() {
        try {
            const response = await fetch('/admin/attendance-data');
            const data = await response.json();

            if (data.status === 'success') {
                updateAttendanceTable(data.data);
            }
        } catch (error) {
            console.error('Error loading attendance data:', error);
        }
    }

    function updateAttendanceTable(data) {
        // Filter data based on selected filters
        const date = dateFilter.value;
        const dept = deptFilter.value;
        const year = yearFilter.value;

        const filteredData = data.filter(record => {
            if (date && !record.timestamp.includes(date)) return false;
            if (dept && record.department !== dept) return false;
            if (year && record.year !== year) return false;
            return true;
        });

        // Update table
        attendanceTable.innerHTML = filteredData.map(record => `
            <tr>
                <td>${record.username}</td>
                <td>${record.department}</td>
                <td>${record.year}</td>
                <td>${record.timestamp}</td>
            </tr>
        `).join('');
    }

    // Manual Attendance
    const markAttendanceBtn = document.getElementById('markAttendance');
    const studentEmailInput = document.getElementById('studentEmail');
    const manualDeptSelect = document.getElementById('manualDepartment');
    const manualYearSelect = document.getElementById('manualYear');

    markAttendanceBtn.addEventListener('click', async function() {
        const email = studentEmailInput.value.trim();
        const department = manualDeptSelect.value;
        const year = manualYearSelect.value;

        if (!email || !department || !year) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/admin/mark-manual-attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, department, year })
            });

            const data = await response.json();

            if (data.status === 'success') {
                alert('Attendance marked successfully');
                studentEmailInput.value = '';
                loadAttendanceData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            alert('Error marking attendance: ' + error.message);
        }
    });

    // Initial load
    loadAttendanceData();

    // Set up filter change listeners
    [dateFilter, deptFilter, yearFilter].forEach(filter => {
        filter.addEventListener('change', () => loadAttendanceData());
    });
});
