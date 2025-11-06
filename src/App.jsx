import { createRoot } from 'react-dom/client';
import Island from './Island';
import './App.css';

const App = () =>{
    return (
        <>
        <Island/>
        </>
    )
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App/>);
