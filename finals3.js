// Process storage
let processes = [];
let processCounter = 1;

// DOM Elements
const processNameInput = document.getElementById('processName');
const arrivalTimeInput = document.getElementById('arrivalTime');
const burstTimeInput = document.getElementById('burstTime');
const addProcessBtn = document.getElementById('addProcessBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const calculateBtn = document.getElementById('calculateBtn');
const processList = document.getElementById('processList');
const resultsSection = document.getElementById('resultsSection');
const ganttChart = document.getElementById('ganttChart');
const tableBody = document.getElementById('tableBody');
const avgTurnaround = document.getElementById('avgTurnaround');
const avgWaiting = document.getElementById('avgWaiting');

// Color palette for processes
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

// Add Process
addProcessBtn.addEventListener('click', addProcess);

// Allow Enter key to add process
[processNameInput, arrivalTimeInput, burstTimeInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addProcess();
    });
});

function addProcess() {
    const name = processNameInput.value.trim() || `P${processCounter}`;
    const arrivalTime = parseInt(arrivalTimeInput.value) || 0;
    const burstTime = parseInt(burstTimeInput.value);

    if (!burstTime || burstTime <= 0) {
        alert('Please enter a valid burst time (must be greater than 0)');
        return;
    }

    const process = {
        id: Date.now(),
        name: name,
        arrivalTime: arrivalTime,
        burstTime: burstTime,
        color: colors[processes.length % colors.length]
    };

    processes.push(process);
    processCounter++;

    // Clear inputs
    processNameInput.value = '';
    arrivalTimeInput.value = '';
    burstTimeInput.value = '';
    
    // Focus back on name input
    processNameInput.focus();

    renderProcessList();
}

// Clear All Processes
clearAllBtn.addEventListener('click', () => {
    if (processes.length === 0) return;
    
    if (confirm('Are you sure you want to clear all processes?')) {
        processes = [];
        processCounter = 1;
        renderProcessList();
        resultsSection.style.display = 'none';
    }
});

// Render Process List
function renderProcessList() {
    if (processes.length === 0) {
        processList.innerHTML = '<div class="empty-state">No processes added yet. Add a process to get started.</div>';
        return;
    }

    processList.innerHTML = processes.map(process => `
        <div class="process-item" style="border-color: ${process.color}">
            <button onclick="removeProcess(${process.id})">Remove</button>
            <h3 style="color: ${process.color}">${process.name}</h3>
            <p><strong>Arrival:</strong> ${process.arrivalTime}</p>
            <p><strong>Burst:</strong> ${process.burstTime}</p>
        </div>
    `).join('');
}

// Remove Process
function removeProcess(id) {
    processes = processes.filter(p => p.id !== id);
    renderProcessList();
    if (processes.length === 0) {
        resultsSection.style.display = 'none';
    }
}

// Calculate SJF Non-Preemptive Schedule
calculateBtn.addEventListener('click', calculateSchedule);

function calculateSchedule() {
    if (processes.length === 0) {
        alert('Please add at least one process');
        return;
    }

    // Sort processes by arrival time, then by burst time for SJF
    const sortedProcesses = [...processes].sort((a, b) => {
        if (a.arrivalTime === b.arrivalTime) {
            return a.burstTime - b.burstTime;
        }
        return a.arrivalTime - b.arrivalTime;
    });

    let currentTime = 0;
    let completedProcesses = [];
    let remainingProcesses = [...sortedProcesses];
    let ganttSchedule = [];

    while (remainingProcesses.length > 0) {
        // Find all processes that have arrived by current time
        const availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);

        if (availableProcesses.length === 0) {
            // No process available, jump to next arrival time
            currentTime = remainingProcesses[0].arrivalTime;
            continue;
        }

        // Select process with shortest burst time (SJF)
        availableProcesses.sort((a, b) => a.burstTime - b.burstTime);
        const selectedProcess = availableProcesses[0];

        // Remove from remaining
        remainingProcesses = remainingProcesses.filter(p => p.id !== selectedProcess.id);

        // Calculate times
        const startTime = currentTime;
        const completionTime = currentTime + selectedProcess.burstTime;
        const turnaroundTime = completionTime - selectedProcess.arrivalTime;
        const waitingTime = turnaroundTime - selectedProcess.burstTime;

        // Add to gantt schedule
        ganttSchedule.push({
            ...selectedProcess,
            startTime: startTime,
            completionTime: completionTime
        });

        // Add to completed processes
        completedProcesses.push({
            ...selectedProcess,
            completionTime: completionTime,
            turnaroundTime: turnaroundTime,
            waitingTime: waitingTime
        });

        currentTime = completionTime;
    }

    // Sort completed processes by original order for display
    completedProcesses.sort((a, b) => {
        const aIndex = processes.findIndex(p => p.id === a.id);
        const bIndex = processes.findIndex(p => p.id === b.id);
        return aIndex - bIndex;
    });

    renderResults(completedProcesses, ganttSchedule);
}

// Render Results
function renderResults(completedProcesses, ganttSchedule) {
    // Show results section
    resultsSection.style.display = 'block';

    // Render Gantt Chart
    ganttChart.innerHTML = ganttSchedule.map((process, index) => `
        <div class="gantt-block" style="
            background: ${process.color};
            width: ${process.burstTime * 50}px;
        ">
            <div class="process-name">${process.name}</div>
            <div class="burst-time">BT: ${process.burstTime}</div>
            <div class="gantt-time start">${process.startTime}</div>
            ${index === ganttSchedule.length - 1 ? 
                `<div class="gantt-time end">${process.completionTime}</div>` : ''}
        </div>
    `).join('');

    // Render Table
    tableBody.innerHTML = completedProcesses.map(process => `
        <tr>
            <td style="color: ${process.color}; font-weight: bold;">${process.name}</td>
            <td>${process.arrivalTime}</td>
            <td>${process.burstTime}</td>
            <td>${process.completionTime}</td>
            <td>${process.turnaroundTime}</td>
            <td>${process.waitingTime}</td>
        </tr>
    `).join('');

    // Calculate averages
    const avgTAT = (completedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0) / completedProcesses.length).toFixed(2);
    const avgWT = (completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0) / completedProcesses.length).toFixed(2);

    avgTurnaround.textContent = avgTAT;
    avgWaiting.textContent = avgWT;

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Initialize
renderProcessList();
