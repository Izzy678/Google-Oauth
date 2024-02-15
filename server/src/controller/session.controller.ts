import { Request, Response } from "express";
import config from "config";
import {
  createSession,
  findSessions,
  updateSession,
} from "../service/session.service";
import { findAndUpdateUser, getGoogleAuthToken, getGoogleUser, validatePassword } from "../service/user.service";
import { signJwt } from "../utils/jwt.utils";
import jwt from 'jsonwebtoken'
import { UserDocument } from "../models/user.model";

export async function createUserSessionHandler(req: Request, res: Response) {
  // Validate the user's password
  const user = await validatePassword(req.body);

  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  // create a session
  const session = await createSession(user._id, req.get("user-agent") || "");

  // create an access token

  const accessToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.get("accessTokenTtl") } // 15 minutes
  );

  // create a refresh token
  const refreshToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.get("refreshTokenTtl") } // 15 minutes
  );

  // return access & refresh tokens

  res.cookie("accessToken", accessToken, {
    maxAge: 900000, // 15 mins
    httpOnly: true,
    domain: "localhost",
    path: "/",
    sameSite: "strict",
    secure: false,
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: 3.154e10, // 1 year
    httpOnly: true,
    domain: "localhost",
    path: "/",
    sameSite: "strict",
    secure: false,
  });

  return res.send({ accessToken, refreshToken });
}

export async function getUserSessionsHandler(req: Request, res: Response) {
  const userId = res.locals.user._id;

  const sessions = await findSessions({ user: userId, valid: true });

  return res.send(sessions);
}

export async function deleteSessionHandler(req: Request, res: Response) {
  const sessionId = res.locals.user.session;

  await updateSession({ _id: sessionId }, { valid: false });

  return res.send({
    accessToken: null,
    refreshToken: null,
  });


}

export async function googleOauthHandler(req: Request, res: Response) {
  const code = req.query.code as unknown as string
   console.log("code",code);
   try {
    const {id_token, access_token} = await getGoogleAuthToken(code);
    const googleUser = await getGoogleUser(id_token,access_token);
    console.log("google-user",googleUser);
   // const googleUser = await jwt.decode(id_token);
   if(!googleUser.verified_email) res.status(400).send('Google account is not verified');

   const user = await findAndUpdateUser({
    email:googleUser.email},
    {email:googleUser.email,name:googleUser.name,picture:googleUser.picture},
    {upsert:true,new:true}
    );
    // create a session
  const session = await createSession(user._id, req.get("user-agent") || "");

  // create an access token

  const accessToken = signJwt(
    { ...user.toJSON(), session: session._id },
    { expiresIn: config.get("accessTokenTtl") } // 15 minutes
  );

  // create a refresh token
  const refreshToken = signJwt(
    { ...user.toJSON(), session: session._id },
    { expiresIn: config.get("refreshTokenTtl") } // 15 minutes
  );

  // return access & refresh tokens

  res.cookie("accessToken", accessToken, {
    maxAge: 900000, // 15 mins
    httpOnly: true,
    domain: "localhost",
    path: "/",
    sameSite: "strict",
    secure: false,
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: 3.154e10, // 1 year
    httpOnly: true,
    domain: "localhost",
    path: "/",
    sameSite: "strict",
    secure: false,
  });

   res.redirect(config.get("origin"));

   } catch (error) {
    console.log(error);
    const origin = config.get<string>('origin') 
    res.redirect(`${origin}/oauth/error`)
   }
  

}