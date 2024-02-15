import { DocumentDefinition, FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { omit } from "lodash";
import UserModel, { UserDocument } from "../models/user.model";
import qs from 'qs'
import axios from 'axios'
import config from 'config'
import log from "../utils/logger";

export async function createUser(
  input: DocumentDefinition<
    Omit<UserDocument, "createdAt" | "updatedAt" | "comparePassword">
  >
) {
  try {
    const user = await UserModel.create(input);

    return omit(user.toJSON(), "password");
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function validatePassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await UserModel.findOne({ email });

  if (!user) {
    return false;
  }

  const isValid = await user.comparePassword(password);

  if (!isValid) return false;

  return omit(user.toJSON(), "password");
}

export async function findUser(query: FilterQuery<UserDocument>) {
  return UserModel.findOne(query).lean();
}

export async function getGoogleAuthToken(code:string){
  //base url
  const url = 'https://oauth2.googleapis.com/token';
  
  try {
      //set query value 
  const value = {
    code,
    client_id:config.get("googleClientId"),
    client_secret:config.get("goggleClientSecret"),
    redirect_uri:config.get("googleOauthRedirectUrl"),
    grant_type:'authorization_code'
  }

    const res = await axios.post(url,qs.stringify(value),{
      headers:{
        "Content-Type":"application/x-www-form-urlencoded"
      }
    });
    console.log(res)
    return res.data;
  } catch (error:any) {
    log.error("error fetching google auth token")
    throw new Error(error)
  }
 
}

interface GoogleUserResult {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}


export async function getGoogleUser(id_token:string,access_token:string):Promise<GoogleUserResult>{
  try {
    const res = await axios.get<GoogleUserResult>(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
    {
      headers:{
        Authorization: `Bearer ${id_token}`
      }
    }
    )
    return res.data;
  } catch (error) {
    throw new Error("error getting google user");
  }
}

export async function findAndUpdateUser(query:FilterQuery<UserDocument>,update:UpdateQuery<UserDocument>, options:QueryOptions={}){
 const user = UserModel.findOneAndUpdate(query,update,options);
 return user;
}