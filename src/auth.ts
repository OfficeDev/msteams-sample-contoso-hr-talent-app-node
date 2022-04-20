import { RequestHandler, Request, Response, NextFunction } from 'express';
import jwt, { GetPublicKeyOrSecret, JwtPayload } from 'jsonwebtoken';
import jwksClient, {CertSigningKey, RsaSigningKey} from 'jwks-rsa';

// Express middleware used to authenticate AAD signed, bot service tokens
export const botFrameworkAuth : RequestHandler = (req, res, next) => {
    
    const token = getTokenFromHeader(req);

    if (!token) {
        return res.sendStatus(401);
    }

    commonAuth(
        token, 
        res, 
        "https://api.botframework.com", 
        getSigningKeyCallback("https://login.botframework.com/v1/.well-known/keys"), 
        next);
};

// Express middleware used to authenticate our client requested user token
export const aadAppAuth : RequestHandler = (req, res, next) => {

    const token = getTokenFromHeader(req);

    if (!token) {
        return res.sendStatus(401);
    }

    const decoded = <JwtPayload>jwt.decode(token);

    if (!decoded.tid) {
        res.status(403).send("No tenant id in token");
        return;
    }

    commonAuth(
        token, 
        res, 
        `https://login.microsoftonline.com/${decoded.tid}/v2.0`, 
        getSigningKeyCallback(`https://login.microsoftonline.com/${decoded.tid}/discovery/v2.0/keys`), 
        next);
};

const getSigningKeyCallback: (jwksUri: string) => GetPublicKeyOrSecret = (jwksUri) => {
    
    const getSigningKey: GetPublicKeyOrSecret = (header, callback) => {
        jwksClient({
            jwksUri
        }).getSigningKey(header.kid, (err, key) => {
            const signingKey = (<CertSigningKey>key).publicKey || (<RsaSigningKey>key).rsaPublicKey;
            callback(null, signingKey);
        });
    };

    return getSigningKey;
}

const commonAuth : (token: string, res: Response, issuer: string, getSigningKeys: GetPublicKeyOrSecret, next: NextFunction) => void = (token, res, issuer, getSigningKeys, next) => {

    if (!token) {
        res.status(401);
        return undefined;
    }

    const validationOptions = {
        audience: process.env.MicrosoftAppId,
        issuer,
        clockTolerance: 5 // Set clock skew to 5 seconds
    }

    jwt.verify(token, getSigningKeys, validationOptions, (err, payload) => {
        if (err) {
            console.log(err);
            return res.sendStatus(403);
        }

        next();
    });
};


const getTokenFromHeader : (req: Request) => string | undefined = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return undefined;
    }

    if (!authHeader.toLowerCase().startsWith("bearer ")) {
        return undefined;
    }

    return authHeader.split(" ")[1];
}