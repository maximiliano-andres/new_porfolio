/* Portfolio content (content.js) in the visitor's language. Imported only by window chunks. */
import { useLang } from "../app/context.js";
import * as ES from "./content.js";
import * as EN from "./content.en.js";

export const contentFor = (lang) => (lang === "en" ? EN : ES);
export const useContent = () => contentFor(useLang().lang);
