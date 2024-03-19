var admin = require("firebase-admin");

exports.initFirebase = () => {
    const serviceAccount = require("./devops-kb-indexer-firebase-adminsdk-1virk-e7cef204be.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

exports.verifyToken = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    const token = authHeader.split(' ')[1];
    try {
      await admin.auth().verifyIdToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }

exports.verifyTokenString = async (token) => {
  try {
    await admin.auth().verifyIdToken(token.split(' ')[1]);
    return true;
  } catch (error) {
    return false;
  }
}



