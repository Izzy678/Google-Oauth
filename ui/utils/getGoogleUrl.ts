function getGoogleOAuthURL() {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: 'http://localhost:1337/api/sessions/oauth/google',
      client_id: '1091996600549-q6nkvaa86lt5smh4gp4jqssbourdvk5v.apps.googleusercontent.com',
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };
    
    const qs = new URLSearchParams((options));
    console.log("ssss",qs);
    const params =  `${rootUrl}?${qs.toString()}`;
    console.log("params",params)
    return params;
  }
  
  export default getGoogleOAuthURL;