import { CreateUserParams, SignInParams } from "@/type";
import { Account, Avatars, Client, ID, Query, TablesDB } from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!, // Your Appwrite Endpoint
  platform: "com.dev.food",
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!, // Your Appwrite Project ID
  databaseid: '68bdbcdf000ac963ba46',
  userCollectionId: 'user',
};

export const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
  .setProject(appwriteConfig.projectId) // Your project ID 
  .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: CreateUserParams) => {
  try {

    const newAccount = await account.create({
      userId: ID.unique(),
      email: email,
      password: password,
      name: name
    });
    if (!newAccount) throw Error;

    await signIn({ email, password });

    const avatarsUrl = avatars.getInitialsURL(name);

    return await tablesDB.createRow({
      databaseId: appwriteConfig.databaseid,
      tableId: appwriteConfig.userCollectionId,
      rowId: ID.unique(),
      data:
      {
        email: email,
        name: name,
        accountId: newAccount.$id,
        avatar: avatarsUrl
      },
      permissions:
        [
          // Permission.create(Role.any())
          // ,
          // Permission.read(Role.user(newAccount.$id)),
          // Permission.write(Role.user(newAccount.$id)),
        ]
    }
    );
    // return await databases.createDocument({
    //   databaseId: appwriteConfig.databaseid,
    //   collectionId: appwriteConfig.userCollectionId,
    //   documentId: ID.unique(),
    //   data: {
    //     email: email,
    //     name: name,
    //     accountId: newAccount.$id,
    //     avatar: avatarsUrl
    //   }
    // });
  }
  catch (e) {
    throw new Error(e as string);
  }
}

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    await account.deleteSession({
      sessionId: 'current'
    });
    const session = await account.createEmailPasswordSession({ email, password });
  }
  catch (e) {
    throw new Error(e as string);
  }
}

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw Error;

    const currentUser = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseid,
      tableId: appwriteConfig.userCollectionId,
      queries: [Query.equal('accountId', [currentAccount.$id])]
    });
    if (!currentUser) throw Error;
    return currentUser.rows[0];
  }
  catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
}
