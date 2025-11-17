"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const generateAccessToken = (payload) => {
    const expiresIn = env_1.env.jwtAccessExpiry;
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtAccessSecret, { expiresIn });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    const expiresIn = env_1.env.jwtRefreshExpiry;
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtRefreshSecret, { expiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtAccessSecret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwtRefreshSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
