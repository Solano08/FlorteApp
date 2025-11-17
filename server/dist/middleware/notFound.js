"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
};
exports.notFoundHandler = notFoundHandler;
