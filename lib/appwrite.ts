import { Category, CreateUserParams, GetMenuParams, MenuItem, SignInParams } from "@/type";
import { Account, Avatars, Client, ID, Query, Storage, TablesDB } from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!, // Your Appwrite Endpoint
  platform: "com.dev.food",  // bundle identifier / app‑id
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!, // Your Appwrite Project ID
  databaseId: '68bdbcdf000ac963ba46',
  bucketId: '68c59ae80039d1cacf51', // for storage
  userTableId: 'user',  // renamed from “userCollectionId” for clarity
  categoriesTableId: 'categories',
  menuTableId: 'menu',
  customizationsTableId: 'customizations',
  menu_customizationsTableId: 'menu_customizations',
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
const avatars = new Avatars(client);
export const storage = new Storage(client);

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
    // 1️⃣ Check if session exists
    const isAuthenticated = await restoreSession();
    if (!isAuthenticated) {
      throw new Error("No authenticated session");
    }

    // 2️⃣ Now get account info
    const currentAccount = await account.get();

    // 3️⃣ Fetch user row from tablesDB
    const result = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.userTableId,
      queries: [Query.equal('accountId', [currentAccount.$id])]
    });

    if (!result || result.rows.length === 0) {
      throw new Error("User data not found in table");
    }

    return { account: currentAccount, data: result.rows[0] };
  } catch (err: any) {
    console.error("getCurrentUserData error:", err);
    throw new Error(err.message || "getCurrentUserData unknown error");
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

export const signOut = async () => {
  try {
    await account.deleteSession({ sessionId: "current" });  // ◀ Change: wrap session deletion to avoid errors if no session
  } catch (err) {
    console.log("No current session to delete:", err);  // ◀ Added fallback log
  }
};

// export const getMenu = async ({ category, query, limit }: GetMenuParams): Promise<MenuItem[]> => {
//   try {
//     const queries: string[] = [];

//     if (category) queries.push(Query.equal("categories", category));
//     if (query) queries.push(Query.search("name", query));
//     if (limit) queries.push(Query.limit(limit));

//     const menus = await tablesDB.listRows({
//       databaseId: appwriteConfig.databaseId,
//       tableId: appwriteConfig.menuTableId,
//       queries,
//     });

//     return menus.rows.map((row) => {
//       const fileId = row.image_url; // file ID stored in DB
//       const bucketId = appwriteConfig.bucketId;
//       const base = appwriteConfig.endpoint.replace(/\/v1$/, ""); // remove trailing /v1 if present
//       const url = `${base}/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;

//       const menuItem: MenuItem = {
//         $id: row.$id,
//         $createdAt: row.$createdAt,
//         $updatedAt: row.$updatedAt,
//         $permissions: row.$permissions,
//         name: row.name,
//         price: row.price,
//         image_url: url, // this URL should now work
//         description: row.description,
//         calories: row.calories,
//         protein: row.protein,
//         rating: row.rating,
//         type: row.type,
//       };

//       return menuItem;
//     });

//   } catch (e) {
//     throw new Error(e as string);
//   }
// };

export const getMenu = async ({ category, query, limit }: GetMenuParams): Promise<MenuItem[]> => {
  try {
    const queries: any[] = [];
    if (category) queries.push(Query.equal("categories", category));
    if (query) queries.push(Query.search("name", query));
    if (limit) queries.push(Query.limit(limit));

    const menus = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.menuTableId,
      queries,
    });

    return menus.rows.map((row) => {
      const base = appwriteConfig.endpoint.replace(/\/v1$/, "");
      const bucketId = appwriteConfig.bucketId;

      // If row.image_url already has full URL, use it. Otherwise, construct public URL.
      const image_url = row.image_url.startsWith("http")
        ? row.image_url
        : `${base}/storage/buckets/${bucketId}/files/${row.image_url}/view?project=${appwriteConfig.projectId}`;

      return {
        $id: row.$id,
        $createdAt: row.$createdAt,
        $updatedAt: row.$updatedAt,
        $permissions: row.$permissions,
        name: row.name,
        price: row.price,
        image_url,  // ✅ public URL
        description: row.description,
        calories: row.calories,
        protein: row.protein,
        rating: row.rating,
        type: row.type,
      } as MenuItem;
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to fetch menu");
  }
};





// export const getCategories = async () => {
//   try {
//     const categories = await tablesDB.listRows({

//       databaseId: appwriteConfig.databaseId,
//       tableId: appwriteConfig.categoriesTableId,
//     });
//     return categories.rows;
//   }
// catch (e) {
//   console.error('Error fetching categories:', e);
//   throw new Error(e instanceof Error ? e.message : String(e));
// }
// }

export const getCategories = async (): Promise<Category[]> => {
  try {
    const categories = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.categoriesTableId,
    });

    return categories.rows.map((row) => {
      return {
        $id: row.$id,
        name: row.name,
        description: row.description,
      } as Category;
    });
  } catch (e: any) {
    console.error('Error fetching categories:', e);
    throw new Error(e instanceof Error ? e.message : String(e));
  }
};

