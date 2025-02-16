
import React, { StrictMode } from "react";
import { createRoot } from 'react-dom/client';
import App from "./Mine3dApp";
import "./index.css";
import { ThemeProvider } from "@itwin/itwinui-react";

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
    <StrictMode>
      <ThemeProvider style={{height: '100vh'}}>
        <App />
      </ThemeProvider>
    </StrictMode>
  );