import propTypes from 'prop-types';
import { useRef, useState, useEffect, useContext } from 'react';
import { PrivChatMessage } from './PrivChatMessage';
import { SocketContext } from '../context/SocketContext';


export const BubbleChat = ({ id, isOpen, toggleChat, initialMessages, user, initialSinLeer }) => {
    const [messages, setMessages] = useState(initialMessages);
    const [friend, setFriend] = useState(user);
    const [sender, setSender] = useState({});
    const [message, setMessage] = useState('');
    const [sinLeer, setSinLeer] = useState(initialSinLeer);
    const messagesEndRef = useRef(null);

    const socket = useContext(SocketContext);

    useEffect(() => {
        socket.on('change_user_name', (data) => {
      
          data.usuarios.map((usuario) => {
            if (usuario.user_id === user.user_id) {
                setFriend((prevFriend) => ({
                    ...prevFriend,
                    name: usuario.name,
                    bubbleName: usuario.bubbleName,
                }));
            }
          })
          
        });
      
        // Limpiar el socket cuando el componente se desmonte
        return () => {
          socket.off('change_user_name');
        };
      }, [socket,user.user_id]);
    

    useEffect(() => {
        socket.emit('user_data')
        socket.on('user_data', (data) => {
            setSender(data);
        });
    }, [socket])

    useEffect(() => {
        if (isOpen) {
            sinLeer > 0 && setSinLeer(0);
        }
    }, [isOpen, sinLeer])

    useEffect(() => {
        socket.on('mensaje_privado_recibido', (data) => {
            //verificar que el mensaje es de este chat 
            if ((data.sender == socket.id && data.receiver == id) || (data.sender == id && data.receiver == socket.id)) {
                //Verificar si es el usuario enviador o recibidor o no es su mensaje
                if (data.sender === socket.id) {
                    setMessages((messages) => [...messages, { text: data.message, type: 'enviado' }]);
                } else if (data.receiver === socket.id) {
                    setMessages((messages) => [...messages, { text: data.message, type: 'recibido' }]);
                    console.log('mensaje recibido');
                    !isOpen && setSinLeer(sinLeer + 1);
                }
            }
        });

        return () => {
            socket.off('mensaje_privado_recibido');
        };
    }, [socket, id, sinLeer, isOpen])

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);


    const submitMessage = (e) => {
        e.preventDefault();
        if (message.trim().length > 0) {
            socket.emit('mensaje_privado_enviado', { message: message, user_id: user.user_id, sender: sender });
            setMessage('');
        }
    }

    return (
        <>
            <div
                onClick={() => toggleChat(id)} // Llamamos al toggleChat con el id del chat
                className={`hover:bg-slate-700 border-solid border-2 border-cyan-500 h-14 w-14 rounded-full cursor-pointer flex-shrink-0 flex justify-center items-center text-white font-bold hover:text-cyan-500 ${isOpen ? 'bg-purple-700' : 'bg-transparent'} relative`} // Añadimos 'relative' aquí
            >
                {/* Contenedor con el contador de 'sinLeer' */}
                {sinLeer > 0 && (
                    <div className='absolute top-0 p-0 right-0 flex justify-center items-center text-xs text-white bg-red-600 rounded-full h-6 w-6'>
                        <p>{sinLeer > 10 ? '10+' : sinLeer}</p>
                    </div>
                )}

                <h1>{friend.bubbleName}</h1>
            </div>

            {isOpen && (
                <div className="absolute z-30 bottom-20 right-0 w-[22rem] h-[450px] bg-zinc-950 grid grid-rows-[auto_1fr_auto] items-stretch border-solid border-2 border-white rounded-lg">
                    {/* Cabecera */}
                    <div onClick={() => toggleChat(id)} className="text-white text-center py-2 px-4 font-semibold cursor-pointer">
                        <p>{friend.name}</p>
                        <p className='text-xs'>({friend.bubbleName})</p>
                    </div>
                    {/* Cuerpo */}

                    <div className="bg-zinc-900 overflow-y-auto p-4 space-y-2 flex flex-col">
                        {
                            messages.length == 0 && <div className='h-full w-full flex justify-center items-center px-5'>
                                <p className='text-gray-400 text-center'>Aún no hay mensajes enviados, envía un mensaje 😀</p>
                            </div>
                        }
                        {
                            messages.map((message, index) => (
                                <PrivChatMessage key={index} message={message.text} type={message.type} />
                            ))
                        }
                        <div ref={messagesEndRef}></div>
                    </div>
                    {/* Mensajería */}
                    <div className="p-2">
                        <form className='flex gap-2' onSubmit={submitMessage}>
                            <input
                                type="text"
                                className="w-full p-2 rounded-lg bg-zinc-800 text-white border-none focus:outline-none"
                                placeholder="Escribe un mensaje..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button type='submit' className='text-white border-solid border-2 p-1 rounded-lg hover:bg-zinc-900'>Send</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

BubbleChat.propTypes = {
    id: propTypes.string.isRequired,
    isOpen: propTypes.bool.isRequired,
    toggleChat: propTypes.func.isRequired,
    user: propTypes.object.isRequired,
    initialMessages: propTypes.array.isRequired,
    initialSinLeer: propTypes.number.isRequired,
}