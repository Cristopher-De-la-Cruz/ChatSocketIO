import { useEffect, useState, useRef, useContext } from 'react';
import { SocketContext } from './context/SocketContext';
import { BubbleChatContainer } from './components/bubbleChatContainer';


function App() {
  const socket = useContext(SocketContext);
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [cursors, setCursors] = useState({});
  const [user, setUser] = useState({ user_id: 'NoId', name: 'No Name', bubbleName: 'NNd' });

  // Crear un ref para el contenedor de mensajes
  const messagesEndRef = useRef(null);

  const handleCountClick = () => {
    socket.emit('countpressed', { count: count + 1 });
  };
  
  useEffect(() => {
  }, [user]);
  useEffect(() => {
    // Nuevo usuario
    if (connected) {
      socket.emit('new_user_connected', { user_id: socket.id });

      socket.on('user_data', (data) => {
        setUser(data);
      });

      socket.on('countpressed', (data) => {
        setCount(data.count);
      });

      socket.on('new_user_connected', (data) => {
        setUsuarios(data.users);
        setMessages((messages) => [...messages, { usuario_id: data.user_id, name: data.name, type: 'user_connected' }]);
      });

      socket.on('user_disconnected', (data) => {
        setUsuarios(data.users);
        setMessages((messages) => [...messages, { usuario_id: data.user_id, name: data.name, type: 'user_disconnected' }]);
      });

      socket.on('mensaje-recibido', (data) => {
        setMessages((messages) => [...messages, data]);
      });

      socket.on('countupdate', (data) => {
        setCount(data.count);
      });

      socket.on('cursor-update', (data) => {
        setCursors((prev) => ({ ...prev, [data.id]: { x: data.x, y: data.y } }));
      });

      socket.on('cursor-disconnect', (data) => {
        setCursors((prev) => {
          const updated = { ...prev };
          delete updated[data.id];
          return updated;
        });
      });

      // socket.on('change_user_name', (data) => {
      //   setUsuarios(data.usuarios);
      //   if (data.user_id === user.user_id) {
      //     setUser((prev) => ({ ...prev, name: data.name, bubbleName: data.bubbleName }));
      //   }
      //   //Modificar mensajes
      //   setMessages((messages) => messages.map((message) => {
      //     if (message.usuario_id === data.user_id) {
      //       return { ...message, name: data.name };
      //     }
      //     return message;
      //   }));
      // });
    }

    return () => {
      socket.off('countpressed');
      socket.off('countupdate');
      socket.off('mensaje-recibido');
      socket.off('cursor-update');
      socket.off('cursor-disconnect');
      socket.off('change_user_name');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  useEffect(() => {
    socket.on('change_user_name', (data) => {
  
      // Actualizar la lista de usuarios
      setUsuarios(data.usuarios);
  
      // Verificar si el usuario actual es el que ha cambiado
      if (data.user_id === user.user_id) {
        setUser((prevUser) => ({
          ...prevUser,
          name: data.name,
          bubbleName: data.bubbleName,
        }));
      }
  
      // Modificar los mensajes
      setMessages((prevMessages) =>
        prevMessages.map((message) => {
          if (message.usuario_id === data.user_id) {
            return { ...message, name: data.name };
          }
          return message;
        })
      );
    });
  
    // Limpiar el socket cuando el componente se desmonte
    return () => {
      socket.off('change_user_name');
    };
  }, [socket,user.user_id]);

  useEffect(() => {
    setConnected(socket.connected);

    socket.on('connect', () => {
      setConnected(true);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  const handleMouseMove = (e) => {
    const { clientX: x, clientY: y } = e;
    if (connected) {
      socket.emit('cursor-move', { x, y });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (connected) {
      socket.emit('mensaje-enviado', { message });
    }
    setMessage('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const changeName = (e) => {
    const newName = e.target.value;
    if (newName !== user.name) {
      if (newName.length < 20) {

        setUser((prev) => ({ ...prev, name: newName }));
        socket.emit('change_user_name', { user_id: user.user_id, name: newName, bubbleName: user.bubbleName });
      }
    }
  }

  const handleClickUser = (user) => {
    socket.emit('chat_user', { user: user });
  }

  return (
    <div className='bg-slate-900 h-full w-full' onMouseMove={handleMouseMove}>
      <div className='bg-slate-900 h-max w-full flex flex-col items-center py-5 px-7 gap-10'>
        {/* Titulo */}
        <div>
          <h1 className='text-4xl font-bold text-cyan-500'>Socket IO Project</h1>
        </div>

        {/* Body */}
        <div className='grid grid-cols-2 gap-5 w-full '>
          {/* Chat general */}
          <div className='grid gap-3 w-full'>
            {/* Sub Titulo */}
            <div className='w-full text-center'>
              <h1 className='text-2xl font-bold text-white '>Chat General</h1>
            </div>
            {/* Cuerpo */}
            <div className='grid gap-4 w-full '>
              {/* Input */}
              <div className='w-full'>
                <form onSubmit={handleSubmit} className='w-full flex justify-center gap-3'>
                  <input
                    className='border-solid border-2 w-2/3 border-sky-500 rounded-full px-2 py-1 text-sky-500 bg-transparent'
                    type="text"
                    onChange={(e) => setMessage(e.target.value)}
                    value={message}
                    placeholder='Escribe algo...'
                    required
                  />
                  <button className='border-solid border-2 rounded-lg text-white py-1 px-2 hover:bg-sky-400 hover:text-black hover:border-black hover:font-bold' type="submit">Send</button>
                </form>
              </div>
              {/* Mensajes */}
              <div className='w-full px-3 max-h-96 overflow-y-auto'>
                {messages.map((message, index) => (
                  <div key={index} className='p-0 my-2'>
                    {message.type === 'message' && (
                      <div className='border-solid border-2 rounded-lg py-1.5 px-3 cursor-default'>
                        <div>
                          <p className='text-[8px] text-cyan-400'>{message.name}</p>
                        </div>
                        <div className='break-words text-sm text-white'>
                          <p>{message.message}</p>
                        </div>
                        <div>
                          <p className='text-[8px] text-fuchsia-400'>{message.hora_envio}</p>
                        </div>
                      </div>
                    ) || message.type === 'user_connected' && (
                      <div className='border-solid border-2 border-green-500 rounded-lg py-1.5 px-3 cursor-default'>
                        <div className='break-words text-sm text-green-500'>
                          <p>{message.name} se ha conectado</p>
                        </div>
                      </div>
                    ) || message.type === 'user_disconnected' && (
                      <div className='border-solid border-2 border-red-500 rounded-lg py-1.5 px-3 cursor-default'>
                        <div className='break-words text-sm text-red-500'>
                          <p>{message.name} se ha desconectado</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Usuarios */}
          <div className=' z-20'>
            {/* Sub titulo */}
            <div className='w-full text-center mb-5'>
              <h1 className='text-2xl font-bold text-white '>Usuarios</h1>
              <p className='text-sm text-white'>Lista de usuarios conectados</p>
            </div>
            <div className='max-h-96 overflow-y-auto'>
              <div className='grid grid-cols-1 gap-4' style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                {usuarios.map((usuario) => (
                  <div onClick={() => handleClickUser(usuario)}
                    key={usuario.user_id}
                    className='text-white cursor-pointer border-solid border-2 rounded-lg p-4 flex justify-center items-center bg-sky-500 hover:bg-sky-400 transition-all'>
                    {usuario.name} {usuario.user_id == socket.id &&  '(Tú)'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Absolute */}
        <div>
          <div className={`absolute top-3 left-5 flex flex-col gap-2`}>
            <h1 className={`border-solid border-2 ${connected ? 'border-green-500 text-green-500' : 'border-red -500 text-red-500'} rounded-full px-2 py-1`}>{connected ? '🟢 Conectado' : '🔴 No conectado'}</h1>
            <input type="text" value={user.name} onChange={changeName} className='bg-transparent border-solid border-2 rounded-lg px-2 py-1 text-white w-full' />
          </div>

          <div className="absolute z-20 top-3 right-5 border-solid border-2 border-sky-500 rounded-full px-2 py-1 text-sky-500">
            <button onClick={handleCountClick}>Multi-count: {count}</button>
          </div>

          {/* Contenedor de burbujas de chat */}
          <BubbleChatContainer/>

          {Object.entries(cursors).map(([id, position]) => (
            <div
              key={id}
              style={{
                position: 'absolute',
                top: position.y,
                left: position.x,
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;