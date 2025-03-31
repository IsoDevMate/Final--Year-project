import axios from 'axios';
import { AppError } from '../utils/errors.utils';

export interface MpesaInitiatePaymentDto {
  phoneNumber: string;
  amount: number;
  callbackUrl: string;
  accountReference: string;
  description: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: string;
}
export interface MpesaCallbackDto {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value?: string | number;
        }>;
      };
    };
  };
}

export class MpesaService {
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly passkey: string;
  private readonly shortcode: string;
  private readonly baseUrl: string;
  private readonly callbackBaseUrl: string;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.shortcode = process.env.MPESA_SHORTCODE || '';
    this.baseUrl = process.env.MPESA_API_URL || 'https://sandbox.safaricom.co.ke';
    this.callbackBaseUrl = process.env.APP_CALLBACK_URL || 'https://final-year-project-3qr3.onrender.com/api/v1/mpesa/callback/:eventId/:userId';

    if (!this.consumerKey || !this.consumerSecret || !this.passkey || !this.shortcode) {
      console.warn('M-Pesa credentials are not properly configured');
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
       console.log("Auth string generated (first 10 chars):", auth.substring(0, 10) + "...");

      const response = await axios.get<TokenResponse>(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

       if (!response.data || !response.data.access_token) {
        throw new Error('Failed to retrieve access token from M-Pesa API');
      }

      return response.data.access_token;
    } catch (error:any) {
      console.error('Error getting M-Pesa access token:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', JSON.stringify(error.response.headers));
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error config:', error.config);
      }

      throw new Error(`Failed to generate M-Pesa token: ${error.message}`);
    }
  }

  async initiateSTKPush(paymentData: MpesaInitiatePaymentDto): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      // Format phone number to required format (2547XXXXXXXX)
      const formattedPhone = paymentData.phoneNumber.startsWith('+')
        ? paymentData.phoneNumber.substring(1)
        : paymentData.phoneNumber;

      // Generate timestamp
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: paymentData.amount,
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: "https://final-year-project-3qr3.onrender.com/api/v1/mpesa/callback/:eventId/:userId",
        AccountReference: paymentData.accountReference,
        TransactionDesc: paymentData.description
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error initiating M-Pesa STK push:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new AppError(`M-Pesa error: ${error.response.data.errorMessage || 'Payment processing failed'}`, 400);
      }
      throw new AppError('Failed to process payment', 500);
    }
  }
  parseCallbackData(callbackData: MpesaCallbackDto): {
    success: boolean;
    transactionId?: string;
    phoneNumber?: string;
    amount?: number;
    resultCode: number;
    resultDesc: string;
  } {
    console.log('Parsing M-Pesa callback data:', JSON.stringify(callbackData, null, 2));

    const { stkCallback } = callbackData.Body;
    console.log('Extracted stkCallback:', JSON.stringify(stkCallback, null, 2));

    const result = {
      success: stkCallback.ResultCode === 0,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc
    };

    console.log('Parsed result:', JSON.stringify(result, null, 2));

    // If payment was successful, extract transaction details
    if (result.success && stkCallback.CallbackMetadata) {
      console.log('Payment was successful. Extracting metadata...');
      const metadata: any = {};

      stkCallback.CallbackMetadata.Item.forEach(item => {
        console.log(`Processing metadata item: ${item.Name} = ${item.Value}`);
        if (item.Name === 'MpesaReceiptNumber') {
          metadata.transactionId = item.Value;
        } else if (item.Name === 'PhoneNumber') {
          metadata.phoneNumber = item.Value;
        } else if (item.Name === 'Amount') {
          metadata.amount = item.Value;
        }
      });

      console.log('Extracted metadata:', JSON.stringify(metadata, null, 2));
      return { ...result, ...metadata };
    }

    console.log('Payment was not successful or no metadata found.');
    return result;

  }

  async getPaymentStatus(transactionId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const requestData = {
        Initiator: this.consumerKey,
        SecurityCredential: this.consumerSecret,
        CommandID: 'TransactionStatusQuery',
        TransactionID: transactionId,
        PartyA: this.shortcode,
        IdentifierType: '1', // 1 for MSISDN
        ResultURL: `${this.callbackBaseUrl}/result`,
        QueueTimeOutURL: `${this.callbackBaseUrl}/timeout`,
        Remarks: 'Transaction status query'
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting M-Pesa payment status:', error);
      throw new AppError('Failed to get payment status', 500);
    }
  }

}
