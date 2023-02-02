import React, { useEffect, useState } from 'react';
import { Button, Grid } from '@mui/material';
import styled from '@emotion/styled';
import { useSelector, useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import {
  useGetConversationsQuery,
  useCreateConversationMutation,
  ConversationApiDto,
} from '../../store/api/vonage/coversationsSlice';
import { setConversationId } from '../../store/api/vonage/conversationsLocalSlice';

import { RootState } from '../../store/store';
import { getUserById, setApp, setToken } from '../../store/api/vonage/usersLocalSlice';
import { useGenerateTokenMutation } from '../../store/api/vonage/tokenSlice';
import NexmoClient from 'nexmo-client';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Input = styled.input`
  width: 200px;
  height: 40px;
  margin: 10px;
  padding: 0 10px;
  font-size: 16px;
`;

const StyledButton = styled(Button)`
  height: 40px;
  margin: 10px;
  font-size: 16px;
  text-transform: none;
`;

const Select = styled.select`
  margin-top: 20px;
  padding: 10px;
  font-size: 16px;
  border-radius: 5px;
  border: 1px solid #ccc;
  width: 200px;
  margin-bottom: 10px;
`;

const CreateConversationForm = () => {
  const [name, setConversationName] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const [createConversation, { isLoading, isError, error }] = useCreateConversationMutation();

  useEffect(() => {
    if (isError) {
      enqueueSnackbar(error['data'].description, { variant: 'error' });
    }
  }, [isError]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createConversation({
      body: {
        name: name,
        display_name: name,
      },
    });
    setConversationName('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type='text'
        placeholder='Conversation Name'
        value={name}
        onChange={(event) => setConversationName(event.target.value)}
      />
      <StyledButton color='primary' variant='contained' disabled={!name || isLoading} type='submit'>
        Create Conversation
      </StyledButton>
    </Form>
  );
};

type ConversationListProps = {
  conversations: ConversationApiDto[];
  handleConversation: (conversation: string) => void;
  selectedConversationId: string;
};

const ConversationList = ({ conversations, handleConversation, selectedConversationId }: ConversationListProps) => {
  return (
    <>
      <Select value={selectedConversationId} onChange={(event) => handleConversation(event.target.value)}>
        <option value=''>Select Conversation</option>
        {conversations.map((conversation) => (
          <option key={conversation.id} value={conversation.id}>
            {conversation.name}
          </option>
        ))}
      </Select>
    </>
  );
};

const ConversationComponent = () => {
  const { data, isLoading, isError } = useGetConversationsQuery({});
  const [generateToken, { data: token }] = useGenerateTokenMutation({});
  const dispatch = useDispatch();
  const selectedConversationId = useSelector((state: RootState) => state.conversationLocalSlice.selectedConversationId);
  const selecteduser = useSelector(getUserById);

  useEffect(() => {
    if (selecteduser?.id) {
      generateToken({
        name: selecteduser.name,
      });
    }
  }, [selecteduser?.id]);

  useEffect(() => {
    if (token) dispatch(setToken(token?.jwt));
  }, [token?.jwt]);

  const login = async (token: string) => {
    let nexmo = new NexmoClient({});
    const app = await nexmo.createSession(token);
    dispatch(setApp(app));
  };

  useEffect(() => {
    if (token?.jwt) login(token.jwt);
  }, [token?.jwt]);

  if (isLoading) {
    return <h1>Loading ...</h1>;
  }
  if (isError) {
    return <h1>Unable to load Conversations.</h1>;
  }
  return (
    <Grid container alignItems={'center'} display='flex' direction='column'>
      <ConversationList
        selectedConversationId={selectedConversationId}
        handleConversation={(conversationId) => dispatch(setConversationId(conversationId))}
        conversations={data.conversations}
      />
      <CreateConversationForm />
    </Grid>
  );
};

export default React.memo(ConversationComponent);
