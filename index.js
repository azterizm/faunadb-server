"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const faunadb_1 = __importStar(require("faunadb"));
const cors_1 = __importDefault(require("cors"));
require('dotenv/config');
const app = express_1.default();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 5000;
const client = new faunadb_1.default.Client({ secret: (_b = process.env.DB_LOGIN_KEY) !== null && _b !== void 0 ? _b : '' });
console.log(process.env);
const { Create, Collection, CurrentIdentity, Call, Function, Map, Paginate, Match, Index, Lambda, Get, Select } = faunadb_1.query;
app.use(express_1.default.json());
app.use(cors_1.default());
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const token = yield client.query(Call(Function('login_user'), { email, password }));
        return res.status(200).send(token);
    }
    catch (error) {
        return res.status(404).send(error);
    }
}));
// TODO: Add authorization middleware
app.post('/add', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.sendStatus(401);
    }
    const { 1: token } = authorization.split('Bearer ');
    const client = new faunadb_1.default.Client({ secret: token });
    try {
        const { title } = req.body;
        yield client.query(Create(Collection('Todo'), {
            data: {
                title,
                completed: false,
                user: CurrentIdentity()
            }
        }));
        res.sendStatus(200);
    }
    catch (error) {
        return res.status(400).send(error);
    }
}));
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.sendStatus(401);
    }
    const { 1: token } = authorization.split('Bearer ');
    const client = new faunadb_1.default.Client({ secret: token });
    try {
        const data = yield client.query(Map(Paginate(Match(Index('allTodos'))), Lambda(x => Select('title', Select('data', Get(x))))));
        return res.send(data);
    }
    catch (error) {
        return res.status(400).send(error);
    }
}));
app.listen(PORT, () => console.log(`Server at ${PORT}`));
