import propTypes from 'prop-types';
import { SocketContext } from "./SocketContext"
import { io } from "socket.io-client";


export const SocketProvider = ({ children }) => {

    const socket = io('http://localhost:3000');

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}

SocketProvider.propTypes = {
    children: propTypes.node.isRequired,
}