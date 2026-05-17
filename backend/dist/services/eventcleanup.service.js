"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCleanupService = void 0;
const event_model_1 = require("../models/event.model");
class EventCleanupService {
    static cleanupPastEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDate = new Date();
            // Mark past events as completed
            yield event_model_1.Event.updateMany({ endDate: { $lt: currentDate }, status: { $ne: 'completed' } }, { $set: { status: 'completed' } });
            // Delete events with status 'completed'
            yield event_model_1.Event.deleteMany({ status: 'completed' });
            console.log(`Past events marked as completed and deleted at ${currentDate}`);
        });
    }
}
exports.EventCleanupService = EventCleanupService;
