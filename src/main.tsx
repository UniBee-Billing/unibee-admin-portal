import 'antd/dist/reset.css'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './global.css'
import './main.css'

const BASE_URL = import.meta.env.BASE_URL

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={BASE_URL}>
    <App />
  </BrowserRouter>
)
