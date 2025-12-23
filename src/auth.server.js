import { SvelteKitAuth } from "@auth/sveltekit";
import { ZodError } from "zod";
import Credentials from "@auth/sveltekit/providers/credentials";
import { signInSchema } from "$lib/zod";

async function getUserFromWS(email, password) {

  const response = await fetch("https://dealeredge.docscloud.net/auth/sign_in", {
  // const response = await fetch("http://localhost:3000/auth/sign_in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user: { email, password } }),
  });
  
  const result = await response;
  const body = await result.json();
  const headers = result.headers;
  console.log("Headers:", headers);
  console.log("Body:", body);
  
  if (!response.ok) {
    throw new Error("Invalid credentials.");
  }
  
  const user = body.user;
  if (!user || !user.email) {
    throw new Error("Invalid credentials.");
  }

  // Get authorization header if available
  const authHeader = headers.get('authorization');
  const accessToken = authHeader ? authHeader.split(' ')[1] : null;
  const expiry = headers.get('expiry');

  // Handle case where scopeable_type might be null
  const scopeableType = user.scopeable_type || 'User';
  const userTypes = ["User", "Admin", "Tenant", "Workspace"];
  if (!userTypes.includes(scopeableType)) {
    // Default to User if not a valid type
    console.warn(`Invalid user type: ${scopeableType}, defaulting to User`);
  }

  // Return user data along with tokens as flat fields
  return {
    id: user.id || user.email, // Use email as ID if id is null
    email: user.email,
    name: user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.email.split('@')[0], // Use email prefix if no name
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    scopeable_type: scopeableType,
    accessToken: accessToken, // Flat field
    expiry: expiry ? parseInt(expiry) : null,           // Flat field
  };

}

const providers = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "text", placeholder: "Email" },
      password: { label: "Password", type: "password", placeholder: "Password" },
    },
    authorize: async (credentials) => {
      try {
        const { email, password } = await signInSchema.parseAsync(credentials);

        const user = await getUserFromWS(email, password);
        if (!user || !user.email) {
          throw new Error("Invalid credentials.");
        }
        console.log("User returned by authorize:", user); // Debugging log
        
        // Handle user type validation - allow null/undefined and default to User
        const userTypes = ["User", "Admin", "Tenant", "Workspace"];
        const userType = user.scopeable_type || "User";
        if (!userTypes.includes(userType)) {
          console.log("User type:", userType, "- defaulting to User");
        }

        const userData = {
          id: user.id || user.email, // Use email as fallback ID
          email: user.email,
          name: user.name || user.email.split('@')[0], // Use email prefix if no name
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          user_type: userType,
          scopeable_type: userType,
          accessToken: user.accessToken || null,
          expiry: user.expiry || null
        };

        console.log("User data returned by authorize:", userData); // Debugging log
        return userData;

      } catch (error) {
        if (error instanceof ZodError) {
          return null;
        }
        console.error("Error in authorize:", error);
        return null;
      }
    },
  }),
];

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers,
  session: {
    strategy: "jwt",
    // set the maxAge max of 30 minutes
    maxAge: 1800
  },
  pages: {
    signIn: "/auth/login",
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.accessToken = user.accessToken;
        token.scopeable_type = user.scopeable_type;
        token.expiry = user.expiry;
      }
      
      return token;
    },
    async session({ session, token }) {      
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.first_name = token.first_name;
        session.user.last_name = token.last_name;
        session.user.accessToken = token.accessToken;
        session.user.scopeable_type = token.scopeable_type;
        session.user.expiry = token.expiry;
        
        // Calculate the remaining time until token expiration
        if (token.expiry) {
          const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
          const maxAge = token.expiry - currentTime > 0 ? token.expiry - currentTime : 1800; // Default to 30 min
          
          // Set session.maxAge and session.expires based on token.expiry
          session.maxAge = maxAge; // Duration in seconds
          session.expires = new Date(token.expiry * 1000).toISOString(); // Convert to ISO string
        } else {
          // Default session expiry if no token expiry
          session.maxAge = 1800; // 30 minutes
          session.expires = new Date(Date.now() + 1800 * 1000).toISOString();
        }
      }
      
      return session;
    },
  },    
});
