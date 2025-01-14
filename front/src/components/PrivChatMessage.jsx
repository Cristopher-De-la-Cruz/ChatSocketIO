import propTypes from 'prop-types';


export const PrivChatMessage = ({message, type}) => {
    console.log(type);
    const messageType = type == 'enviado' ? 'end' : 'start';
    return (
        <div className={`bg-white text-black p-2 rounded-lg max-w-[70%] self-${messageType}`}>
            {message}
        </div>
    )
}
PrivChatMessage.propTypes = {
    message: propTypes.string.isRequired,
    type: propTypes.string.isRequired,
}