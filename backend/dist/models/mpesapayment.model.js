"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpesaPayment = exports.MpesaPaymentMethod = exports.MpesaPaymentStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var MpesaPaymentStatus;
(function (MpesaPaymentStatus) {
    MpesaPaymentStatus["PENDING"] = "pending";
    MpesaPaymentStatus["COMPLETED"] = "completed";
    MpesaPaymentStatus["FAILED"] = "failed";
})(MpesaPaymentStatus || (exports.MpesaPaymentStatus = MpesaPaymentStatus = {}));
var MpesaPaymentMethod;
(function (MpesaPaymentMethod) {
    MpesaPaymentMethod["MPESA"] = "mpesa";
})(MpesaPaymentMethod || (exports.MpesaPaymentMethod = MpesaPaymentMethod = {}));
const MpesapaymentSchema = new mongoose_1.Schema({
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'KES'
    },
    paymentMethod: {
        type: String,
        enum: Object.values(MpesaPaymentMethod),
        default: MpesaPaymentMethod.MPESA
    },
    status: {
        type: String,
        enum: Object.values(MpesaPaymentStatus),
        default: MpesaPaymentStatus.PENDING
    },
    transactionId: {
        type: String
    },
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    merchantRequestId: {
        type: String
    },
    checkoutRequestId: {
        type: String
    },
    resultCode: {
        type: Number
    },
    resultDesc: {
        type: String
    }
}, {
    timestamps: true
});
// Index for efficient searches
MpesapaymentSchema.index({ eventId: 1, userId: 1 });
MpesapaymentSchema.index({ transactionId: 1 });
MpesapaymentSchema.index({ merchantRequestId: 1 });
MpesapaymentSchema.index({ checkoutRequestId: 1 });
exports.MpesaPayment = mongoose_1.default.model('MpesaPayment', MpesapaymentSchema);
