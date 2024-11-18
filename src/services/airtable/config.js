"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.base = void 0;
var airtable_1 = __importDefault(require("airtable"));
// Configure Airtable with Personal Access Token
var base = new airtable_1["default"]({
    apiKey: import.meta.env.VITE_AIRTABLE_PAT,
    endpointUrl: 'https://api.airtable.com'
}).base('apphYtwSYRt7UDukL');
exports.base = base;