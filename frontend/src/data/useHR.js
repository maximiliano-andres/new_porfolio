/* Plain-language RRHH content (hr.js) in the visitor's language. Imported only by the RRHH window chunk. */
import { useLang } from "../app/context.js";
import * as ES from "./hr.js";
import * as EN from "./hr.en.js";

export const hrFor = (lang) => (lang === "en" ? EN : ES);
export const useHR = () => hrFor(useLang().lang);
