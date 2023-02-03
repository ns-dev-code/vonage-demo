import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import NexmoClient from 'nexmo-client';
import { useNavigate } from 'react-router-dom';
import { getUserById, setApp, setSelectedUserId, setToken } from '../store/api/vonage/usersLocalSlice';
import { getSelectedConversation, setConversationId } from '../store/api/vonage/conversationsLocalSlice';
import { RootState } from '../store/store';
import { useGenerateTokenMutation } from '../store/api/vonage/tokenSlice';

export const useAuth = () => {
  const currentUser = useSelector(getUserById);
  const token = useSelector((state: RootState) => state.usersLocalSlice.token);
  const [generateToken, { data: tokenData }] = useGenerateTokenMutation({});
  const currentConversation = useSelector(getSelectedConversation);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const login = useCallback(async (token: string) => {
    try {
      let nexmo = new NexmoClient({});
      const app = await nexmo.createSession(token);
      dispatch(setApp(app));
    } catch (error) {
      generateToken({
        name: currentUser?.name,
      });
    }
  }, []);

  const logout = () => {
    dispatch(setConversationId(''));
    dispatch(setSelectedUserId(''));
    dispatch(setToken(''));
    navigate('/');
  };

  useEffect(() => {
    if (tokenData?.jwt || token) {
      login(tokenData?.jwt || token);
    }
  }, [token, tokenData, login]);

  return { login, logout, token, currentConversation, currentUser };
};
