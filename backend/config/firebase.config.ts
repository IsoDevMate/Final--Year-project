import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as serviceAccount from '../comfybase-348d1-firebase-adminsdk-fbsvc-3a35a942ec.json';

// Only initialize if not already initialized
if (!admin.apps.length) {
  const params = {
    type: serviceAccount.type,
    projectId: serviceAccount.project_id,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccount.client_x509_cert_url
  };

  admin.initializeApp({
    credential: admin.credential.cert(params as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'gs://comfybase-348d1.appspot.com',
  });
}

export default admin;
