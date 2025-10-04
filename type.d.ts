// import { Models } from "react-native-appwrite";

// export interface MenuItem extends Models.Document {
//     name: string;
//     price: number;
//     image_url: string;
//     description: string;
//     calories: number;
//     protein: number;
//     rating: number;
//     type: string;
// }

// export interface Category extends Models.Document {
//     name: string;
//     description: string;
// }

// export interface User extends Models.Document {
//     name: string;
//     email: string;
//     avatar: string;
// }

// export interface CartCustomization {
//     id: string;
//     name: string;
//     price: number;
//     type: string;
// }

// export interface CartItemType {
//     id: string; // menu item id
//     name: string;
//     price: number;
//     image_url: string;
//     quantity: number;
//     customizations?: CartCustomization[];
// }

// export interface CartStore {
//     items: CartItem[];
//     addItem: (item: Omit<CartItem, "quantity">) => void;
//     removeItem: (id: string, customizations: CartCustomization[]) => void;
//     increaseQty: (id: string, customizations: CartCustomization[]) => void;
//     decreaseQty: (id: string, customizations: CartCustomization[]) => void;
//     clearCart: () => void;
//     getTotalItems: () => number;
//     getTotalPrice: () => number;
// }

// interface TabBarIconProps {
//     focused: boolean;
//     icon: ImageSourcePropType;
//     title: string;
// }

// interface PaymentInfoStripeProps {
//     label: string;
//     value: string;
//     labelStyle?: string;
//     valueStyle?: string;
// }

// interface CustomButtonProps {
//     onPress?: () => void;
//     title?: string;
//     style?: string;
//     leftIcon?: React.ReactNode;
//     textStyle?: string;
//     isLoading?: boolean;
// }

// interface CustomHeaderProps {
//     title?: string;
// }

// interface CustomInputProps {
//     placeholder?: string;
//     value?: string;
//     onChangeText?: (text: string) => void;
//     label: string;
//     secureTextEntry?: boolean;
//     keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
// }

// interface ProfileFieldProps {
//     label: string;
//     value: string;
//     icon: ImageSourcePropType;
// }

// interface CreateUserParams {
//     email: string;
//     password: string;
//     name: string;
// }

// interface SignInParams {
//     email: string;
//     password: string;
// }

// interface GetMenuParams {
//     category: string;
//     query: string;
//     limit: number;
// }


import { ID, Models, Query } from "react-native-appwrite";

// TablesDB still uses Models.Document as the base type for rows
// The terminology changed (documents -> rows) but the type structure remains the same

// MenuItem Row - extends Models.Document
export interface MenuItem {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    name: string;
    price: number;
    image_url: string;
    description: string;
    calories?: number;
    protein?: number;
    rating?: number;
    type?: string;
}

// Category Row - extends Models.Document
export interface Category extends Models.Document {
    $id: string;
    name: string;
    description: string;
}

// User Row - extends Models.Document
export interface User extends Models.Document {
    name: string;
    email: string;
    avatar: string;
}

export interface CartCustomization {
    id: string;
    name: string;
    price: number;
    type: string;
}

export interface CartItemType {
    id: string; // menu item id
    name: string;
    price: number;
    image_url: string;
    quantity: number;
    customizations?: CartCustomization[];
}

export interface CartItem extends CartItemType { }

export interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity">) => void;
    removeItem: (id: string, customizations: CartCustomization[]) => void;
    increaseQty: (id: string, customizations: CartCustomization[]) => void;
    decreaseQty: (id: string, customizations: CartCustomization[]) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
}

interface CustomHeaderProps {
    title?: string;
}

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType;
}

interface CreateUserParams {
    email: string;
    password: string;
    name: string;
}

interface SignInParams {
    email: string;
    password: string;
}

export type GetMenuParams = {
    category?: string
    query?: string
    limit?: number
}


// TablesDB Response Type - uses Models.DocumentList
export interface RowsList<T extends Models.Document> extends Models.DocumentList<T> {
    // total: number (from Models.DocumentList)
    // documents: T[] (from Models.DocumentList)
}

// Example usage with TablesDB
export class AppwriteService {
    constructor(
        private tablesDB: any, // Replace with proper TablesDB type from SDK
        private databaseId: string
    ) { }

    // Menu Items methods using TablesDB
    async getMenuItems(params: GetMenuParams): Promise<Models.DocumentList<MenuItem>> {
        const queries = [
            Query.limit(params.limit),
        ];

        if (params.category) {
            queries.push(Query.equal("type", params.category));
        }

        if (params.query) {
            queries.push(Query.search("name", params.query));
        }

        // Using listRows instead of listDocuments
        return this.tablesDB.listRows<MenuItem>(
            this.databaseId,
            "menu_items", // tableId (previously collectionId)
            queries
        );
    }

    async getMenuItemById(id: string): Promise<MenuItem> {
        // Using getRow instead of getDocument
        return this.tablesDB.getRow<MenuItem>(
            this.databaseId,
            "menu_items",
            id // rowId (previously documentId)
        );
    }

    async createMenuItem(data: Omit<MenuItem, keyof Models.Document>): Promise<MenuItem> {
        // Using createRow instead of createDocument
        return this.tablesDB.createRow<MenuItem>(
            this.databaseId,
            "menu_items",
            ID.unique(), // rowId
            data
        );
    }

    async updateMenuItem(
        id: string,
        data: Partial<Omit<MenuItem, keyof Models.Document>>
    ): Promise<MenuItem> {
        // Using updateRow instead of updateDocument
        return this.tablesDB.updateRow<MenuItem>(
            this.databaseId,
            "menu_items",
            id,
            data
        );
    }

    async deleteMenuItem(id: string): Promise<void> {
        // Using deleteRow instead of deleteDocument
        return this.tablesDB.deleteRow(
            this.databaseId,
            "menu_items",
            id
        );
    }

    // Bulk operations (new in TablesDB)
    async createMenuItems(items: Array<Omit<MenuItem, keyof Models.Document>>): Promise<Models.DocumentList<MenuItem>> {
        const rows = items.map(item => ({
            $id: ID.unique(),
            data: item
        }));

        return this.tablesDB.createRows<MenuItem>(
            this.databaseId,
            "menu_items",
            rows
        );
    }

    async updateMenuItemsByQuery(
        queries: string[],
        data: Partial<Omit<MenuItem, keyof Models.Document>>
    ): Promise<Models.DocumentList<MenuItem>> {
        return this.tablesDB.updateRows<MenuItem>(
            this.databaseId,
            "menu_items",
            data,
            queries
        );
    }

    // Upsert (create or update)
    async upsertMenuItem(
        id: string,
        data: Omit<MenuItem, keyof Models.Document>
    ): Promise<MenuItem> {
        return this.tablesDB.upsertRow<MenuItem>(
            this.databaseId,
            "menu_items",
            id,
            data
        );
    }

    // Categories methods
    async getCategories(): Promise<Models.DocumentList<Category>> {
        return this.tablesDB.listRows<Category>(
            this.databaseId,
            "categories"
        );
    }

    async getCategoryById(id: string): Promise<Category> {
        return this.tablesDB.getRow<Category>(
            this.databaseId,
            "categories",
            id
        );
    }

    async createCategory(data: Omit<Category, keyof Models.Document>): Promise<Category> {
        return this.tablesDB.createRow<Category>(
            this.databaseId,
            "categories",
            ID.unique(),
            data
        );
    }

    async updateCategory(
        id: string,
        data: Partial<Omit<Category, keyof Models.Document>>
    ): Promise<Category> {
        return this.tablesDB.updateRow<Category>(
            this.databaseId,
            "categories",
            id,
            data
        );
    }

    async deleteCategory(id: string): Promise<void> {
        return this.tablesDB.deleteRow(
            this.databaseId,
            "categories",
            id
        );
    }

    // User methods
    async getUserById(id: string): Promise<User> {
        return this.tablesDB.getRow<User>(
            this.databaseId,
            "users",
            id
        );
    }

    async updateUser(
        id: string,
        data: Partial<Omit<User, keyof Models.Document>>
    ): Promise<User> {
        return this.tablesDB.updateRow<User>(
            this.databaseId,
            "users",
            id,
            data
        );
    }

    // Atomic operations (new in TablesDB)
    async incrementRating(menuItemId: string, amount: number = 1): Promise<MenuItem> {
        return this.tablesDB.incrementRowColumn<MenuItem>(
            this.databaseId,
            "menu_items",
            menuItemId,
            "rating",
            amount,
            5 // max rating
        );
    }

    async decrementRating(menuItemId: string, amount: number = 1): Promise<MenuItem> {
        return this.tablesDB.decrementRowColumn<MenuItem>(
            this.databaseId,
            "menu_items",
            menuItemId,
            "rating",
            amount,
            0 // min rating
        );
    }
}

// Migration Guide: Database -> TablesDB
export const MIGRATION_GUIDE = {
    // Service initialization
    OLD: "const databases = new Databases(client);",
    NEW: "const tablesDB = new TablesDB(client);",

    // Method names
    methods: {
        listDocuments: "listRows",
        getDocument: "getRow",
        createDocument: "createRow",
        updateDocument: "updateRow",
        deleteDocument: "deleteRow",
    },

    // Parameter names
    parameters: {
        collectionId: "tableId",
        documentId: "rowId",
    },

    // Return types (unchanged)
    types: {
        note: "Models.Document and Models.DocumentList are still used",
        document: "Models.Document - base interface for rows",
        documentList: "Models.DocumentList<T> - response from listRows()",
    },

    // New features in TablesDB
    newFeatures: [
        "createRows() - bulk create",
        "updateRows() - bulk update with queries",
        "upsertRow() / upsertRows() - create or update",
        "incrementRowColumn() - atomic increment",
        "decrementRowColumn() - atomic decrement",
    ],
} as const;