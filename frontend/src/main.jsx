import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // اضافه کردن Router
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router> {/* قرار دادن App داخل Router */}
      <App />
    </Router>
  </React.StrictMode>
);
