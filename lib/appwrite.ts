import { CreateUserParams, SignInParams } from "@/type";
import { Account, Avatars, Client, ID, Query, TablesDB } from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!, // Your Appwrite Endpoint
  platform: "com.dev.food",  // bundle identifier / app‑id
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!, // Your Appwrite Project ID
  databaseId: '68bdbcdf000ac963ba46',
  userTableId: 'user',  // renamed from “userCollectionId” for clarity
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const tablesDB = new TablesDB(client);
const avatars = new Avatars(client);

// ◀ Added helper function to check if user is logged in (session exists)
async function isLoggedIn(): Promise<boolean> {
  try {
    const user = await account.get();
    return !!user;
  } catch (err) {
    // If error is “missing scope(account)” or unauthorized, user is not logged in
    return false;
  }
}

export const createUser = async ({ email, password, name }: CreateUserParams) => {
  try {
    // Create user account
    const newAccount = await account.create({
      userId: ID.unique(),
      email: email,
      password: password,
      name: name
    });
    if (!newAccount) throw new Error("User creation failed");

    // Directly sign in after create
    await signIn({ email, password });  // ◀ Change: ensure a session is created right away

    // Now session should be active
    const avatarsUrl = avatars.getInitialsURL(name);

    const row = await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.userTableId,
      rowId: ID.unique(),
      data: {
        email: email,
        name: name,
        accountId: newAccount.$id,
        avatar: avatarsUrl
      },
      permissions: [
        // ◀ Permissions commented out – you’ll define based on roles/users
      ]
    });

    return { account: newAccount, row };
  }
  catch (e: any) {
    console.error("createUser error:", e);  // ◀ Added log for better debugging
    throw new Error(e.message || "createUser unknown error");
  }
};

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    // Try deleting existing session, but catch if none exists
    try {
      await account.deleteSession({ sessionId: "current" });  // ◀ Change: wrap session deletion to avoid errors if no session
    } catch (err) {
      console.log("No current session to delete:", err);  // ◀ Added fallback log
    }

    const session = await account.createEmailPasswordSession({
      email,
      password
    });

    // ◀ Optional: store session data if needed (depending on SDK/platform)
    // e.g. AsyncStorage.setItem('appwriteSession', JSON.stringify(session));

    return session;
  }
  catch (e: any) {
    console.error("signIn error:", e);  // ◀ Added log
    throw new Error(e.message || "signIn unknown error");
  }
};

export const getCurrentUserData = async () => {
  try {
    // Ensure user is authenticated before fetching account or rows
    const currentAccount = await account.get();  // ◀ This will fail if guest / no session
    if (!currentAccount) {
      throw new Error("No authenticated user");
    }

    const result = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.userTableId,
      queries: [ Query.equal('accountId', [currentAccount.$id]) ]
    });

    if (!result || result.rows.length === 0) {
      throw new Error("User data not found in table");
    }

    const userRow = result.rows[0];
    return { account: currentAccount, data: userRow };
  } catch (e: any) {
    console.error("getCurrentUserData error:", e);  // ◀ Added log
    throw new Error(e.message || "getCurrentUserData unknown error");
  }
};

// Optional: function to restore session state, e.g. on app startup
export const restoreSession = async (): Promise<boolean> => {
  try {
    const user = await account.get();  // ◀ Try‐get account; if succeeds, session active
    return !!user;
  } catch (err) {
    return false;
  }
};
