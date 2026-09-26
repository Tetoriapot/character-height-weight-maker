import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CharacterMaker from "../app/components/CharacterMaker";
import "../app/globals.css";
import "../app/maker-expansion.css";

createRoot(document.getElementById("root")!).render(<StrictMode><CharacterMaker /></StrictMode>);
