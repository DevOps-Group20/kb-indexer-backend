var admin = require("firebase-admin");

export function initFirebase(){
    const serviceAccount = require("./devops-kb-indexer-firebase-adminsdk-1virk-e7cef204be.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export async function verifyToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }
    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken; // Return decoded user information
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new Error('Forbidden');
    }
  }



