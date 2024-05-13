import { Account, Avatars, Client, Databases, ID, Query } from 'react-native-appwrite';

export const appwrite = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.jsm.aoraandroidjaggi",
    projectId: "",
    storageId : "",
    databaseId: "",
    userCollectionId: "",
    videoCollectionId: "",
}

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(appwrite.endpoint) // Your Appwrite Endpoint
    .setProject(appwrite.projectId) // Your project ID
    .setPlatform(appwrite.platform) ;

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (
    email,
    password,
    username
) => {
    console.log(email,password,username)
    try{
        
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        )

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username);

        await signIn(email,password);

        const newUser = await databases.createDocument(
            appwrite.databaseId,
            appwrite.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email: email,
                username: username,
                avatar: avatarUrl,
            }
        );
        return newUser;
    }
    catch(err){
        console.log(err);
        throw new Error(err);
    }
}

export async function signIn( email, password)  {
    try{
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    }catch(err){
        throw new Error(err);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) throw Error;
    
        const currentUser = await databases.listDocuments(
            appwrite.databaseId,
            appwrite.userCollectionId,
          [Query.equal("accountId", currentAccount.$id)]
        );
    
        if (!currentUser) throw Error;
    
        return currentUser.documents[0];
      } catch (error) {
        console.log(error);
        return null;
      }
}

// Get all video Posts
export async function getAllPosts() {
    try {
      const posts = await databases.listDocuments(
        appwrite.databaseId,
        appwrite.videoCollectionId
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }

  export async function getLatestPosts() {
    try {
      const posts = await databases.listDocuments(
        appwrite.databaseId,
        appwrite.videoCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(7)]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }


  export async function searchPosts(query) {
    try {
      const posts = await databases.listDocuments(
        appwrite.databaseId,
        appwrite.videoCollectionId,
        [Query.search("title", query)]
      );
  
      if (!posts) throw new Error("Something went wrong");
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }

  export async function getUserPosts(userId) {
    try {
      const posts = await databases.listDocuments(
        appwrite.databaseId,
        appwrite.videoCollectionId,
        [Query.equal("creator", userId)]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }

  export async function signOut() {
    try {
      const session = await account.deleteSession("current");
  
      return session;
    } catch (error) {
      throw new Error(error);
    }
  }

  export async function uploadFile(file, type) {
    if (!file) return;
  
    const { mimeType, ...rest } = file;
    const asset = { type: mimeType, ...rest };
  
    try {
      const uploadedFile = await storage.createFile(
        appwrite.storageId,
        ID.unique(),
        asset
      );
  
      const fileUrl = await getFilePreview(uploadedFile.$id, type);
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get File Preview
  export async function getFilePreview(fileId, type) {
    let fileUrl;
  
    try {
      if (type === "video") {
        fileUrl = storage.getFileView(appwrite.storageId, fileId);
      } else if (type === "image") {
        fileUrl = storage.getFilePreview(
          appwrite.storageId,
          fileId,
          2000,
          2000,
          "top",
          100
        );
      } else {
        throw new Error("Invalid file type");
      }
  
      if (!fileUrl) throw Error;
  
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
  }

  export async function createVideoPost(form) {
    try {
      const [thumbnailUrl, videoUrl] = await Promise.all([
        uploadFile(form.thumbnail, "image"),
        uploadFile(form.video, "video"),
      ]);
  
      const newPost = await databases.createDocument(
        appwrite.databaseId,
        appwrite.videoCollectionId,
        ID.unique(),
        {
          title: form.title,
          thumbnail: thumbnailUrl,
          video: videoUrl,
          prompt: form.prompt,
          creator: form.userId,
        }
      );
  
      return newPost;
    } catch (error) {
      throw new Error(error);
    }
  }