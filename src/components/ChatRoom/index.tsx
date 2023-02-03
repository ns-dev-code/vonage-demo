import { useSelector, useDispatch } from 'react-redux';
import { Application, Conversation } from 'nexmo-client';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box } from '@mui/system';
import { useState, useEffect, useRef } from 'react';
import { truncate, uniqBy } from 'lodash';
import moment from 'moment';
import { RootState } from '../../store/store';
import { getUserById, setSelectedUserId, setToken } from '../../store/api/vonage/usersLocalSlice';
import { saveMessages, loadMessagesByConversationId } from '../../store/api/vonage/messageLocalSlice';
import { getSelectedConversation, setConversationId } from '../../store/api/vonage/conversationsLocalSlice';
import './index.css';
import { useAuth } from '../../hooks/useAuth';

const ChatRoom = () => {
  const user = useSelector(getUserById);
  const app: Application = useSelector((state: RootState) => state?.usersLocalSlice?.app);
  const loadedMessages = useSelector(loadMessagesByConversationId);
  const [messages, setMessages] = useState(uniqBy(loadedMessages, 'key'));
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Conversation>();
  const dispatch = useDispatch();
  const currentConversation = useSelector(getSelectedConversation);
  const inputRef = useRef<HTMLInputElement>();
  const messageBoxRef = useRef<HTMLDivElement>();
  const navigate = useNavigate();
  let typingMessage = useRef('');
  const { token, logout } = useAuth();

  // Handling Typing event
  useEffect(() => {
    if (conversation) {
      inputRef?.current?.addEventListener('keypress', (event) => {
        conversation?.startTyping();
      });

      inputRef?.current?.addEventListener('keyup', (event) => {
        conversation?.stopTyping();
      });

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

  // Updating conversation and logout
  useEffect(() => {
    if (!currentConversation?.id || !user?.id) {
      return logout();
    }
    if (currentConversation?.id) {
      if (app) {
        app?.getConversation(currentConversation?.id).then((conv) => {
          conv.on('text', onMessage);
          conv.join();
          setConversation(conv);
        });
      }
    }
  }, [currentConversation, user, app, token]);

  // This will be triggered on text event
  const onMessage = (sender, message) => {
    const newMessages = {
      key: message.id,
      sender: sender.userName,
      userId: sender.userId,
      text: message.body.text,
      time: message.timestamp,
      id: message.id,
      conversationId: currentConversation.id,
    };

    setMessages((prev) => {
      let data = uniqBy([...prev, newMessages], 'key');
      dispatch(saveMessages(data));
      return data;
    });

    messageBoxRef.current.scrollTo({
      top: 100000,
      behavior: 'smooth',
    });
  };

  const handleInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(evt?.target?.value);
  };

  const submitMessage = () => {
    if (message) {
      conversation
        ?.sendText(message)
        .then((res) => {
          setConversation(res.conversation);
          setMessage('');
        })
        .catch((err) => {
          console.log({ err });
        });
    }
  };

  const handleKeyUp = (event) => {
    if (event.keyCode === 13) {
      return submitMessage();
    }
  };

  const handleLogout = () => {
    setConversation(null);
    dispatch(setConversationId(''));
    dispatch(setSelectedUserId(''));
    dispatch(setToken(''));
    navigate('/');
  };

  return (
    <div className='center'>
      <Box mb={3}>
        <Button onClick={handleLogout} endIcon={<LogoutIcon />}>
          Logout
        </Button>
      </Box>
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
            if (message?.userId === user?.id)
              return (
                <div>
                  <div key={message?.id} className='message me'>
                    {message?.text}
                  </div>
                  <div
                    style={{
                      margin: '1rem 1rem 1rem auto',
                      width: 'fit-content',
                      fontSize: '10px',
                      position: 'relative',
                      top: '-10px',
                      right: '0px',
                    }}
                  >
                    {moment(message?.time).format('MM/DD/YY h:mm:ssA')}
                  </div>
                </div>
              );
            return (
              <div key={message?.id}>
                <div style={{ fontSize: '10px', position: 'relative', top: '16px', left: '20px' }}>
                  {message.sender}
                </div>
                <div className='message other'>{message?.text}</div>
                <div style={{ fontSize: '10px', position: 'relative', top: '-16px', left: '16px' }}>
                  {moment(message.time).format('MM/DD/YY h:mm:ssA')}
                </div>
              </div>
            );
          })}

          {/* !Todo not working as expected */}
          {typingMessage?.current && (
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
          <input
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyUp}
            placeholder='Type your message here!'
            type='text'
          />
          <IconButton onClick={submitMessage}>
            <SendIcon />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
