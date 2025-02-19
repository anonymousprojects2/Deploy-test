document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.classList.contains('logout')) return;
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            const targetSection = this.dataset.section;
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });

    // QR Scanner
    const video = document.getElementById('qr-video');
    const startButton = document.getElementById('startScan');
    const stopButton = document.getElementById('stopScan');
    const scanMessage = document.getElementById('scanMessage');
    let codeReader;

    async function initializeScanner() {
        try {
            codeReader = new ZXing.BrowserQRCodeReader();
            const videoInputDevices = await ZXing.BrowserCodeReader.listVideoInputDevices();
            
            if (videoInputDevices.length === 0) {
                throw new Error('No camera found');
            }

            startButton.disabled = false;
        } catch (err) {
            console.error('Error initializing scanner:', err);
            scanMessage.textContent = 'Error initializing camera. Please ensure camera permissions are granted.';
            scanMessage.className = 'scan-message error';
        }
    }

    startButton.addEventListener('click', async () => {
        try {
            startButton.disabled = true;
            stopButton.disabled = false;
            scanMessage.textContent = 'Scanning...';
            scanMessage.className = 'scan-message info';

            const result = await codeReader.decodeOnceFromConstraints(
                {
                    audio: false,
                    video: { facingMode: 'environment' }
                },
                video
            );

            if (result) {
                handleQRCode(result.text);
            }
        } catch (err) {
            console.error('Error starting scanner:', err);
            scanMessage.textContent = 'Error accessing camera';
            scanMessage.className = 'scan-message error';
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });

    stopButton.addEventListener('click', () => {
        if (codeReader) {
            codeReader.reset();
            video.srcObject = null;
            startButton.disabled = false;
            stopButton.disabled = true;
            scanMessage.textContent = 'Scanner stopped';
            scanMessage.className = 'scan-message info';
        }
    });

    async function handleQRCode(qrCode) {
        try {
            const response = await fetch('/student/mark-attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ qr_code: qrCode })
            });

            const data = await response.json();

            if (data.status === 'success') {
                scanMessage.textContent = 'Attendance marked successfully!';
                scanMessage.className = 'scan-message success';
                // Reload attendance history
                loadAttendanceHistory();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            scanMessage.textContent = error.message || 'Error marking attendance';
            scanMessage.className = 'scan-message error';
        } finally {
            // Reset scanner after 3 seconds
            setTimeout(() => {
                if (codeReader) {
                    startButton.click();
                }
            }, 3000);
        }
    }

    // Attendance History
    const attendanceTable = document.getElementById('attendanceHistory');
    const monthFilter = document.getElementById('monthFilter');
    const totalClassesSpan = document.getElementById('totalClasses');
    const classesAttendedSpan = document.getElementById('classesAttended');
    const attendancePercentageSpan = document.getElementById('attendancePercentage');

    async function loadAttendanceHistory() {
        try {
            const response = await fetch('/student/attendance-history');
            const data = await response.json();

            if (data.status === 'success') {
                updateAttendanceStats(data.data);
                updateAttendanceTable(data.data);
            }
        } catch (error) {
            console.error('Error loading attendance history:', error);
        }
    }

    function updateAttendanceStats(data) {
        const month = monthFilter.value;
        const filteredData = month ? 
            data.filter(record => record.timestamp.startsWith(month)) : 
            data;

        const totalClasses = filteredData.length;
        const classesAttended = filteredData.filter(record => record.status === 'present').length;
        const percentage = totalClasses ? Math.round((classesAttended / totalClasses) * 100) : 0;

        totalClassesSpan.textContent = totalClasses;
        classesAttendedSpan.textContent = classesAttended;
        attendancePercentageSpan.textContent = `${percentage}%`;
    }

    function updateAttendanceTable(data) {
        const month = monthFilter.value;
        const filteredData = month ? 
            data.filter(record => record.timestamp.startsWith(month)) : 
            data;

        attendanceTable.innerHTML = filteredData.map(record => `
            <tr>
                <td>${record.timestamp.split(' ')[0]}</td>
                <td>${record.timestamp.split(' ')[1]}</td>
                <td>${record.department}</td>
                <td>${record.year}</td>
                <td class="${record.status}">${record.status}</td>
            </tr>
        `).join('');
    }

    // Initialize scanner
    initializeScanner();

    // Initial load of attendance history
    loadAttendanceHistory();

    // Set up month filter change listener
    monthFilter.addEventListener('change', () => loadAttendanceHistory());
});
