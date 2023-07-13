var socket = io()

socket.emit('setup', userloggedin)
socket.on('connected', () => {
    console.log('connected to rgv')
})

socket.on('broad', () => console.log('broadcasting event'));
socket.on('msg', msg => messagerecieved(msg));
