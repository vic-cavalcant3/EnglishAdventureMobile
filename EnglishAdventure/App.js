import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppRoutes from './routes';

export default function App() {
  return (
    <>
      <AppRoutes />
      <StatusBar style="auto" />
    </>
  );
}