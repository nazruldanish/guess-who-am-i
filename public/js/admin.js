const socket = io();

function addChatLine(sender, message) {
    const line = document.createElement('p');
    const label = document.createElement('b');
    label.textContent = `${sender}: `;
    line.append(label, document.createTextNode(message));
    document.getElementById('adminChatBox').appendChild(line);
}

// Listen for messages routed to the human
socket.on('adminReceive', (data) => {
    addChatLine(`Student [${data.id.substring(0, 4)}]`, data.msg);
    // Lock onto this student ID to reply to them
    document.getElementById('targetStudentId').value = data.id;
});

// Send manual reply
document.getElementById('adminSendBtn').onclick = () => {
    const input = document.getElementById('adminInput');
    const targetId = document.getElementById('targetStudentId').value;
    
    if (input.value.trim() === '' || !targetId) return;

    addChatLine('You', input.value);
    
    socket.emit('adminReply', { id: targetId, msg: input.value });
    input.value = '';
};
