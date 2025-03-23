// setup-stripe-products.ts (run once during setup)
import Stripe from 'stripe';
import config from '../config/config';

const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: '2023-10-16'
});

async function setupStripeProducts() {
  try {
    // Create Basic product
    const basicProduct = await stripe.products.create({
      name: 'Basic Streaming Plan',
      description: 'Up to 60 minutes streaming with 100 max viewers',
      metadata: {
        planType: 'basic'
      }
    });

    const basicPrice = await stripe.prices.create({
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
    const premiumProduct = await stripe.products.create({
      name: 'Premium Streaming Plan',
      description: 'Up to 120 minutes streaming with 500 max viewers and analytics',
      metadata: {
        planType: 'premium'
      }
    });

    const premiumPrice = await stripe.prices.create({
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
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Streaming Plan',
      description: 'Up to 240 minutes streaming with 2000 max viewers and advanced analytics',
      metadata: {
        planType: 'enterprise'
      }
    });

    const enterprisePrice = await stripe.prices.create({
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

  } catch (error) {
    console.error('Error setting up Stripe products:', error);
  }
}

setupStripeProducts();
