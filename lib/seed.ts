import * as FileSystem from "expo-file-system";
import { ID } from 'react-native-appwrite';
import { appwriteConfig, storage, tablesDB } from './appwrite';
import dummyData from './data';

// ✅ Interfaces stay the same
interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[];
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

// ✅ Safe cast to ensure dummyData has correct type
const sampleData = dummyData as DummyData;

// ✅ Reusable delay function to avoid rate limit issues
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ✅ Clear a table safely, with logs
async function clearTable(tableId: string, tableName: string): Promise<void> {
    try {
        console.log(`🧹 Clearing ${tableName} table...`);
        const result = await tablesDB.listRows({
            databaseId: appwriteConfig.databaseId,
            tableId,
            queries: []
        });

        console.log(`Found ${result.rows.length} rows to delete in ${tableName}`);
        for (const row of result.rows) {
            await tablesDB.deleteRow({
                databaseId: appwriteConfig.databaseId,
                tableId,
                rowId: row.$id
            });
            console.log(`🗑️ Deleted ${tableName} row: ${row.$id}`);
            await wait(100); // ✅ Small delay to avoid spamming delete requests
        }

        console.log(`✅ ${tableName} cleared`);
    } catch (error) {
        console.error(`❌ Failed to clear ${tableName}:`, error);
        throw error;
    }
}

// ✅ Clear storage bucket
async function clearStorage(): Promise<void> {
    console.log("🧹 Clearing storage bucket...");
    const list = await storage.listFiles({
        bucketId: appwriteConfig.bucketId,
    });

    for (const file of list.files) {
        await storage.deleteFile({
            bucketId: appwriteConfig.bucketId,
            fileId: file.$id
        });
        console.log(`🗑️ Deleted file: ${file.$id}`);
        await wait(100);
    }

    console.log("✅ Storage cleared");
}

// ✅ Upload image to storage and return its view URL

// Upload image to storage and return its view URL as string

// export async function uploadImageToStorage(imageUrl: string): Promise<string> {
//   try {
//     console.log(`📦 Downloading: ${imageUrl}`);

//     // 1️⃣ Prepare local file path
//     const fileName = imageUrl.split("/").pop() || `file-${Date.now()}.png`;
//     const localUri = `${FileSystem.cacheDirectory}${fileName}`;

//     // 2️⃣ Download image to local cache
//     const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);
//     console.log(`✅ Downloaded to: ${downloadResult.uri}`);

//     // 3️⃣ Get file info
//     const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
//     if (!fileInfo.exists) throw new Error("Downloaded file does not exist");

//     // 4️⃣ Prepare Appwrite file object
//     const file = {
//       name: fileName,
//       type: "image/png",
//       size: fileInfo.size,
//       uri: downloadResult.uri,
//     };

//     // 5️⃣ Upload file to Appwrite
//     const uploadedFile = await storage.createFile({
//       bucketId: appwriteConfig.bucketId,
//       fileId: ID.unique(),
//       file,
//     });
//     console.log(`✅ Uploaded file with ID: ${uploadedFile.$id}`);

//     // 6️⃣ Get file URL (returns a string)
//     const fileUrl = storage.getFileView({
//       bucketId: appwriteConfig.bucketId,
//       fileId: uploadedFile.$id,
//     });

//     if (typeof fileUrl !== "string") {
//       throw new Error("Invalid file URL returned from Appwrite");
//     }

//     return fileUrl;

//   } catch (err) {
//     console.error("❌ uploadImageToStorage failed:", err);
//     throw err;
//   }
// }

export async function uploadImageToStorage(imageUrl: string): Promise<string> {
  const fileName = imageUrl.split("/").pop() || `file-${Date.now()}.png`;
  const localUri = `${FileSystem.cacheDirectory}${fileName}`;

  // Download image locally
  const downloadRes = await FileSystem.downloadAsync(imageUrl, localUri);

  // Ensure file exists
  const fileInfo = await FileSystem.getInfoAsync(downloadRes.uri);
  if (!fileInfo.exists) throw new Error("Downloaded file does not exist");

  // Upload to Appwrite
  const uploadedFile = await storage.createFile({
    bucketId: appwriteConfig.bucketId,
    fileId: ID.unique(),
    file: {
      uri: downloadRes.uri,
      name: fileName,
      type: "image/png",
      size: fileInfo.size,
    },
  });

  console.log(`✅ Uploaded file with ID: ${uploadedFile.$id}`);

  // Construct URL string for 'url' column
  const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;

  return fileUrl; // safe for 'url' type column
}




// 🌱 Main seeding function
async function seed(): Promise<void> {
    try {
        console.log('🌱 Starting seeding process...');

        const data = sampleData;
        console.log('📊 Data check:', {
            categoriesCount: data.categories?.length || 0,
            customizationsCount: data.customizations?.length || 0,
            menuCount: data.menu?.length || 0
        });

        // Step 1: Clear everything
        console.log('🧹 Step 1: Clearing all tables + storage...');
        await clearTable(appwriteConfig.menu_customizationsTableId, 'menu_customizations');
        await clearTable(appwriteConfig.menuTableId, 'menu');
        await clearTable(appwriteConfig.customizationsTableId, 'customizations');
        await clearTable(appwriteConfig.categoriesTableId, 'categories');
        await clearStorage();

        // Step 2: Create categories
        console.log('📂 Step 2: Creating categories...');
        const categoryMap: Record<string, string> = {};
        for (const cat of data.categories) {
            const row = await tablesDB.createRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.categoriesTableId,
                rowId: ID.unique(),
                data: { name: cat.name, description: cat.description }
            });
            categoryMap[cat.name] = row.$id;
            console.log(`✅ Created category: ${cat.name}`);
            await wait(200);
        }

        // Step 3: Create customizations
        console.log('🛠️ Step 3: Creating customizations...');
        const customizationMap: Record<string, string> = {};
        for (const cus of data.customizations) {
            const row = await tablesDB.createRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.customizationsTableId,
                rowId: ID.unique(),
                data: { name: cus.name, price: cus.price, type: cus.type }
            });
            customizationMap[cus.name] = row.$id;
            console.log(`✅ Created customization: ${cus.name}`);
            await wait(200);
        }

        // Step 4: Create menu items
        console.log('🍽️ Step 4: Creating menu items...');
        const menuMap: Record<string, string> = {};
        for (const item of data.menu) {
            console.log(`➡️ Creating menu item: ${item.name}`);

            const uploadedImageUrl = await uploadImageToStorage(item.image_url);

            const row = await tablesDB.createRow({
                databaseId: appwriteConfig.databaseId,
                tableId: appwriteConfig.menuTableId,
                rowId: ID.unique(),
                data: {
                    name: item.name,
                    description: item.description,
                    image_url: uploadedImageUrl,
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                    categories: categoryMap[item.category_name]
                }
            });

            menuMap[item.name] = row.$id;
            console.log(`✅ Created menu item: ${item.name}`);

            // Step 5: Link customizations
            for (const cusName of item.customizations) {
                if (customizationMap[cusName]) {
                    await tablesDB.createRow({
                        databaseId: appwriteConfig.databaseId,
                        tableId: appwriteConfig.menu_customizationsTableId,
                        rowId: ID.unique(),
                        data: { menu: row.$id, customizations: customizationMap[cusName] }
                    });
                    console.log(`🔗 Linked ${item.name} with ${cusName}`);
                    await wait(100);
                } else {
                    console.warn(`⚠️ Customization '${cusName}' not found for ${item.name}`);
                }
            }

            await wait(300);
        }

        console.log("🎉 Seeding completed successfully!");
        console.log("📊 Summary:", {
            categories: Object.keys(categoryMap).length,
            customizations: Object.keys(customizationMap).length,
            menuItems: Object.keys(menuMap).length
        });

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

export default seed;

