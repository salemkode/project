import React, { useState } from 'react';
import TicketQueue from './components/TicketQueue';
import Auth from './components/Auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return isAuthenticated ? (
    <TicketQueue />
  ) : (
    <Auth onAuth={setIsAuthenticated} />
  );
}

export default App;