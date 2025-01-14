import { BubbleChat } from "./bubbleChat";
import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/SocketContext";

export const BubbleChatContainer = () => {
    const [openChat, setOpenChat] = useState(null);
    const socket = useContext(SocketContext);
    const [chats, setChats] = useState([]);

    useEffect(() => {
        socket.on('chat_user', (data) => {
            // Verificar si el chat ya existe
            console.log(data)
            if (chats.find((chat) => chat.user_id == data.user.user_id) != undefined) {
                toggleChat(data.user.user_id);
            } else {
                setChats((chats) => [...chats, { ...data.user, initialMessages: [], sinLeer: 0 }]);
                toggleChat(data.user.user_id);

            }

        });

        socket.on('user_disconnected', (data) => {
            // Quitar el usuario del chat
            setChats((prevChats) => prevChats.filter((chat) => chat.user_id !== data.user_id));
        });

        return () => {
            socket.off('chat_user');
        };
    }, [socket, chats]);

    // Función para alternar el estado del chat
    const toggleChat = (id) => {
        setOpenChat((prevOpenChat) => (prevOpenChat === id ? null : id));
    };

    useEffect(() => {
        socket.on('mensaje_privado_recibido', (data) => {
            // Verificar que el mensaje es de este chat

            console.log('mensaje');
            console.log(data);
            setChats((prevChats) => {
                if (data.receiver === socket.id) {
                    console.log('para mi');
                    // Verificar si el chat ya existe
                    const existingChat = prevChats.find((chat) => chat.user_id === data.sender);
                    if (existingChat) {
                        // El chat ya existe, solo añadir el mensaje
                        return prevChats
                    } else {
                        // Crear un nuevo chat si no existe
                        return [
                            ...prevChats,
                            {
                                ...data.senderInfo,
                                initialMessages: [{ text: data.message, type: 'recibido' }],
                                sinLeer: 1
                            }
                        ];
                    }
                }
                return prevChats;
            });
        });

        return () => {
            socket.off('mensaje_privado_recibido');
        };
    }, [socket]);

    return (
        <div className="absolute bottom-4 right-6 h-full w-1/2 py-1 px-2 overflow-x-auto flex items-end flex-nowrap gap-2">
            {chats.map((chat) => (
                <BubbleChat
                    key={chat.user_id}
                    id={chat.user_id}
                    initialMessages={chat.initialMessages}
                    user={chat}
                    isOpen={openChat === chat.user_id}
                    toggleChat={toggleChat}
                    initialSinLeer={chat.sinLeer}
                />
            ))}
        </div>
    );
};
