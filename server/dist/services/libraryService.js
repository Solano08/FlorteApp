"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.libraryService = void 0;
const libraryRepository_1 = require("../repositories/libraryRepository");
const appError_1 = require("../utils/appError");
exports.libraryService = {
    async createResource(input) {
        if (!input.title.trim()) {
            throw new appError_1.AppError('El título es obligatorio', 400);
        }
        return await libraryRepository_1.libraryRepository.createResource(input);
    },
    async listResources() {
        return await libraryRepository_1.libraryRepository.listResources();
    },
    async searchResources(term) {
        if (!term.trim()) {
            return await libraryRepository_1.libraryRepository.listResources();
        }
        return await libraryRepository_1.libraryRepository.searchResources(term);
    },
    async listByUser(userId) {
        return await libraryRepository_1.libraryRepository.listByUser(userId);
    }
};
