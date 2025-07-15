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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// setup-stripe-products.ts (run once during setup)
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../config/config"));
const stripe = new stripe_1.default(config_1.default.stripe.secretKey, {
    apiVersion: '2023-10-16'
});
function setupStripeProducts() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create Basic product
            const basicProduct = yield stripe.products.create({
                name: 'Basic Streaming Plan',
                description: 'Up to 60 minutes streaming with 100 max viewers',
                metadata: {
                    planType: 'basic'
                }
            });
            const basicPrice = yield stripe.prices.create({
                product: basicProduct.id,
                unit_amount: 999, // $9.99
                currency: 'usd',
                recurring: {
                    interval: 'month'
                },
                metadata: {
                    planType: 'basic'
                }
            });
            // Create Premium product
            const premiumProduct = yield stripe.products.create({
                name: 'Premium Streaming Plan',
                description: 'Up to 120 minutes streaming with 500 max viewers and analytics',
                metadata: {
                    planType: 'premium'
                }
            });
            const premiumPrice = yield stripe.prices.create({
                product: premiumProduct.id,
                unit_amount: 1999, // $19.99
                currency: 'usd',
                recurring: {
                    interval: 'month'
                },
                metadata: {
                    planType: 'premium'
                }
            });
            // Create Enterprise product
            const enterpriseProduct = yield stripe.products.create({
                name: 'Enterprise Streaming Plan',
                description: 'Up to 240 minutes streaming with 2000 max viewers and advanced analytics',
                metadata: {
                    planType: 'enterprise'
                }
            });
            const enterprisePrice = yield stripe.prices.create({
                product: enterpriseProduct.id,
                unit_amount: 4999, // $49.99
                currency: 'usd',
                recurring: {
                    interval: 'month'
                },
                metadata: {
                    planType: 'enterprise'
                }
            });
            console.log('Stripe setup complete:');
            console.log('Basic Price ID:', basicPrice.id);
            console.log('Premium Price ID:', premiumPrice.id);
            console.log('Enterprise Price ID:', enterprisePrice.id);
            console.log('Add these IDs to your config file');
        }
        catch (error) {
            console.error('Error setting up Stripe products:', error);
        }
    });
}
setupStripeProducts();
