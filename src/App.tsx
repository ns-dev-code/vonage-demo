import React, { useCallback } from 'react';
import './App.css';
import UserComponent from './components/User';
import ConversationComponent from './components/Conversation';
import { Button, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSnackbar } from 'notistack';

function App() {
  const userId = useSelector((state: RootState) => state?.usersLocalSlice?.selectedUserId);
  const token = useSelector((state: RootState) => state?.usersLocalSlice?.token);
  const conversationId = useSelector((state: RootState) => state.conversationLocalSlice.selectedConversationId);
  const location = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { login, isloading } = useAuth();

  const handleLogin = useCallback((): void => {
    login(token)
      .then(() => {
        location('/chat-room');
      })
      .catch((err) => {
        enqueueSnackbar('Unable to login, please try again !', {
          variant: 'error',
        });
      });
  }, [token]);

  return (
    <div className='App'>
      <div className='header-app'>
        <h3>Vonage Chat App</h3>
      </div>
      <UserComponent />
      <ConversationComponent />
      {userId && conversationId && (
        <Button onClick={handleLogin} variant='outlined'>
          {isloading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
          Login
        </Button>
      )}
    </div>
  );
}

export default App;
