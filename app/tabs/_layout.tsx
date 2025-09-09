import { Redirect } from 'expo-router';
import React from 'react';

const _Layout = () => {
    const isAuthenticated = true;
    if(!isAuthenticated)return <Redirect href="/sign-in" />
  return 
}
export default _Layout