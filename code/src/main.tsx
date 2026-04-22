// 入口 - 挂载 React + AntD v5 reset
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';
import './styles/animations.css';                              // 全局动画系统

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
