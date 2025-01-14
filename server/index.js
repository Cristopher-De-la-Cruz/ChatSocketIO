const http = require('http');

const server = http.createServer();
const io = require('socket.io')(server, {
    cors: { origin: '*' }
});

let count = 0;
let usersCount = 0;
let users = [];

io.on('connection', (socket) => {
    console.log(`se conectó un usuario: ${socket.id}`);
    socket.emit('countupdate', { count });
    socket.emit('users', { users: users });
    socket.on('countpressed', (data) => {
        console.log(`se ha pulsado el botón: ${data.count}`);
        io.emit('countpressed', { count: data.count });
        count = data.count;
    });

    socket.on('mensaje-enviado', (data) => {
        console.log(`se ha enviado el mensaje: ${data.message}`);
        let name = users.filter((user) => user.user_id === socket.id)[0].name;
        io.emit('mensaje-recibido', { message: data.message, usuario_id: socket.id, name: name, hora_envio: new Date().toLocaleTimeString(), type: 'message' });
    });
    socket.on('cursor-move', (data) => {
        socket.broadcast.emit('cursor-update', { id: socket.id, x: data.x, y: data.y });
    });

    socket.on('new_user_connected', () => {
        usersCount++;
        //BubbleName toma la primer letra del name y la junta con la primer y ultima letra del socket.id
        let bubbleName = 'u' + socket.id.charAt(0) + socket.id.charAt(socket.id.length - 1);
        users = [...users, { user_id: socket.id, name: `usuario ${usersCount}`, bubbleName: bubbleName }];
        io.emit('new_user_connected', { user_id: socket.id, name: `usuario ${usersCount}`, users: users });
        socket.emit('user_data', { user_id: socket.id, name: `usuario ${usersCount}`, bubbleName: bubbleName });
        console.log(`usuarios conectados: ${usersCount}`); 
    });

    socket.on('user_data', () => {
        const user = users.find((user) => user.user_id === socket.id);
        socket.emit('user_data', { user_id: socket.id, name: user.name, bubbleName: user.bubbleName });
    });

    socket.on('change_user_name', (data) => {
        let bubbleName = data.name.charAt(0) + socket.id.charAt(0) + socket.id.charAt(socket.id.length - 1);

        users = users.map(user => {
            if (user.user_id === data.user_id) {
                return { ...user, name: data.name, bubbleName: bubbleName }; // Cambiar solo el nombre del usuario
            }
            return user; // No cambiar otros usuariosAS
        });
        console.log(`usuarios = ${users[0]}`);
        //Se guarda el nuevo nombre en el array de usuarios

        io.emit('change_user_name', { user_id: data.user_id, name: data.name, bubbleName: bubbleName, usuarios: users });
    })

    socket.on('chat_user', (data) => {
        socket.emit('chat_user', { user: data.user });
    });

    socket.on('mensaje_privado_enviado', (data) => {
        io.emit('mensaje_privado_recibido', { message: data.message, receiver: data.user_id, sender: socket.id, senderInfo: data.sender});
    });


    socket.on('disconnect', () => {
        socket.broadcast.emit('cursor-disconnect', { id: socket.id });
        let name = users.filter((user) => user.user_id === socket.id)[0].name;

        users = [...users.filter((usuario) => usuario.user_id !== socket.id)];
        io.emit('user_disconnected', { user_id: socket.id, users: users, name: name });
        
    });
});


server.listen(3000);
