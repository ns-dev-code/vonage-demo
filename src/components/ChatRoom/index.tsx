import { useSelector, useDispatch } from 'react-redux';
import { Application, Conversation } from 'nexmo-client';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { truncate, uniqBy } from 'lodash';
import moment from 'moment';
import { RootState, store } from '../../store/store';
import { getUserById } from '../../store/api/vonage/usersLocalSlice';
import { saveMessages, loadMessagesByConversationId } from '../../store/api/vonage/messageLocalSlice';
import { getSelectedConversation } from '../../store/api/vonage/conversationsLocalSlice';
import './index.css';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatRoom = () => {
  const user = useSelector(getUserById);
  const app: Application = useSelector((state: RootState) => state?.usersLocalSlice?.app);
  const loadedMessages = useSelector(loadMessagesByConversationId);
  const [messages, setMessages] = useState(uniqBy(loadedMessages, 'key'));
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Conversation>();
  const conversationId = useSelector((state: RootState) => state.conversationLocalSlice.selectedConversationId);
  const dispatch = useDispatch();
  const currentConversation = useSelector(getSelectedConversation);
  const inputRef = useRef<HTMLInputElement>();
  const messageBoxRef = useRef<HTMLDivElement>();
  const navigate = useNavigate();

  let typingMessage = useRef('');
  inputRef?.current?.addEventListener('keypress', (event) => {
    conversation?.startTyping();
  });

  inputRef?.current?.addEventListener('keyup', (event) => {
    conversation?.stopTyping();
  });

  useEffect(() => {
    if (conversation) {
      conversation.on('text:typing:on', (data, event) => {
        if (conversation?.me?.id !== data?.memberId) {
          typingMessage.current = data?.userName;
        }
      });
      conversation.on('text:typing:off', (data) => {
        typingMessage.current = null;
      });
    }
  }, [conversation]);

  useEffect(() => {
    if (!app) {
      return navigate('/');
    }
    if (conversationId && app)
      app?.getConversation(conversationId).then((conv) => {
        conv.on('text', onMessage);
        conv.join();
        setConversation(conv);
      });
  }, [conversationId, app]);

  const onMessage = (sender, message) => {
    const newMessages = {
      key: message.id,
      sender: sender.userName,
      userId: sender.userId,
      text: message.body.text,
      time: message.timestamp,
      id: message.id,
      conversationId,
    };

    setMessages((prev) => {
      let data = uniqBy([...prev, newMessages], 'key');
      dispatch(saveMessages(data));
      return data;
    });
    messageBoxRef.current.scrollTo({
      top: 10000,
      behavior: 'smooth',
    });
  };

  const setInput = (evt) => {
    setMessage(evt?.target?.value);
  };

  const sendInput = (evt) => {
    if (message) {
      conversation
        ?.sendText(message)
        .then(() => {
          setMessage(null);
        })
        .catch((err) => {
          console.log({ err });
        });
      evt.target.previousSibling.value = '';
    }
  };
  console.log(messages);
  return (
    <div className='center'>
      <div className='chat'>
        <div className='header'>
          <div className='name'>
            Connected as :{' '}
            {truncate(user?.name, {
              length: 10,
              separator: '...',
            })}
          </div>
          <div className='name'>
            Conversation :{' '}
            {truncate(currentConversation?.name, {
              length: 10,
              separator: '...',
            })}
          </div>
        </div>
        <div ref={messageBoxRef} className='messages' id='chat'>
          <div className='time'>Today at {moment().format('HH:mm')}</div>
          {messages.map((message) => {
            if (message.userId === user.id)
              return (
                <div key={message?.id} className='message me'>
                  {message?.text}
                </div>
              );
            return (
              <div key={message?.id}>
                <span style={{ fontSize: '10px', position: 'relative', top: '16px', left: '20px' }}>
                  {message.sender}
                </span>
                <div className='message other'>{message?.text}</div>
                <span style={{ fontSize: '10px', position: 'relative', top: '-16px', left: '16px' }}>
                  {moment(message.time).format('MM/DD/YY h:mm:ssA')}
                </span>
              </div>
            );
          })}
          {typingMessage.current && (
            <>
              <span style={{ fontSize: '10px', position: 'relative', top: '16px', left: '20px' }}>
                {typingMessage.current}
              </span>
              <div className='message other'>
                <div className='typing typing-1'></div>
                <div className='typing typing-2'></div>
                <div className='typing typing-3'></div>
              </div>
            </>
          )}
        </div>
        <div className='input'>
          <input ref={inputRef} onChange={(evt) => setInput(evt)} placeholder='Type your message here!' type='text' />
          <button onClick={(evt) => sendInput(evt)}>Send</button>
          {/* <IconButton onClick={(evt) => sendInput(evt)}>
            <SendIcon />
          </IconButton> */}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
