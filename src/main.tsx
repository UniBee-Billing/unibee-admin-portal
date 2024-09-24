import 'antd/dist/reset.css'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './global.css'
import './main.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
// react-beautiful-dnd throw errors if StrictMode is on
/* <React.StrictMode> */
/* </React.StrictMode> */
