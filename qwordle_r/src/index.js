import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import QApp from "./App_qwordle";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Home from "./Home";
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route path="/home" element={<Home />} />
      <Route path="/wordle" element={<App />} />
      <Route path='/qwordle' element={<QApp />} />
    </Route>
  )
);
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router = {router} />);

