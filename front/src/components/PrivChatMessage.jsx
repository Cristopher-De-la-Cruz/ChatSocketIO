import propTypes from 'prop-types';
import { useState } from 'react';

export const PrivChatMessage = ({ message, type }) => {
    const [messageType] = useState(type == 'enviado' ? 'end' : 'start');
    return (
        <div
            className={`bg-white text-black p-2 rounded-lg max-w-[70%] self-${messageType} break-words whitespace-pre-wrap`}
        >
            {message}
        </div>

    )
}
PrivChatMessage.propTypes = {
    message: propTypes.string.isRequired,
    type: propTypes.string.isRequired,
}