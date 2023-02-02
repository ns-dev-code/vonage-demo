import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const vonageApi = createApi({
  reducerPath: 'vonageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:4000',
    prepareHeaders: async (headers) => {
      return headers;
    },
  }),
  endpoints: (builder) => ({}),
});
