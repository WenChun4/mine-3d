/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  BrowserAuthorizationClient,
  BrowserAuthorizationClientConfiguration
} from "@itwin/browser-authorization";
import { createContext } from "react";

// This is a thin wrapper class on BrowserAuthorizationClient to validate OIDC configuration
class AuthorizationClient extends BrowserAuthorizationClient {

  constructor(configuration: BrowserAuthorizationClientConfiguration) {
    console.log(configuration);
    super(configuration);
    this.validateConfiguration(configuration);
  }

  private validateConfiguration(configuration: BrowserAuthorizationClientConfiguration) {
    if (!configuration.clientId) {
      throw new Error("Please add a valid OIDC client id to the .env file and restart the application. See the README for more information.");
    }
    if (!configuration.scope) {
      throw new Error("Please add valid scopes for your OIDC client to the .env file and restart the application. See the README for more information.");
    }
    if (!configuration.redirectUri) {
      throw new Error("Please add a valid redirect URI to the .env file and restart the application. See the README for more information.");
    }
  }

  // This method combines sign-in and redirect callback handling. Initially it tries to handleSigninCallback,
  // if current url does not match redirectUri (this is the case on the first launch), it returns immediately and executes signIn which initiates oauth authorization flow.
  // Once authorization flow completes, authority server makes a redirect to redirectUri. It reloads the App and handleSigninCallback does it job reading access token.
  // Sandbox accomplish authorization in the background before executing the code, therefore signIn gets already available token from the localStore cache.
  // Full interactive sign-in flow kicks in if you export the project from the Sandbox and run it locally.
  public async signIn() {
    console.log("signIn...");
    return super.handleSigninCallback()
      .then(async () => super.signIn())
      .catch((error) => console.error(error));
  }

  public async getUserFullName():Promise<string> {
    if(super.isAuthorized === false) {
      return "Unknown User";
    }
    
    const userInfo = await this.getAccessToken();
    const decodedToken = parseJwt(userInfo);
    return `${decodedToken?.given_name} ${decodedToken?.family_name}`;
  }
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error("Failed to parse JWT Token", error);
    return null;
  }
}

// Authorization Client configuration values are provided by the Sandbox runtime
// If this Sandbox is exported, configuration must be provided in
// the .env file of the project. Please visit developer.bentley.com to
// register Application and get Authorization Client details
const authClient = new AuthorizationClient({
  scope: process.env.REACT_APP_IMJS_AUTH_CLIENT_SCOPES || "",
  clientId: process.env.REACT_APP_IMJS_AUTH_CLIENT_CLIENT_ID || "",
  redirectUri: process.env.REACT_APP_IMJS_AUTH_CLIENT_REDIRECT_URI || "",
  postSignoutRedirectUri: process.env.REACT_APP_IMJS_AUTH_CLIENT_LOGOUT_URI,
  responseType: "code",
  authority: process.env.REACT_APP_IMJS_AUTH_AUTHORITY,
});

export const authContext = createContext(authClient);