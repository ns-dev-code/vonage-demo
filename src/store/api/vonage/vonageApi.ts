import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const vonageApi = createApi({
  reducerPath: 'vonageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.BASE_URL,
    prepareHeaders: async (headers) => {
      return headers;
    },
  }),
  endpoints: (builder) => ({}),
});
