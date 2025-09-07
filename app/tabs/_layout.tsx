import { Redirect } from 'expo-router';
import React from 'react';

const _Layout = () => {
    const isAuthenticated = false;
    if(!isAuthenticated)return <Redirect href="/sign-in" />
  return 
}