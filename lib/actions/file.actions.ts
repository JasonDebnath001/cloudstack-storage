"use server";

import { createAdminClient } from "../appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "../appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";

export const uploadFile = async ({
  file,
  ownerId,
  accountid,
  path,
}: UploadFileProps) => {
  const { storage, databases } = await createAdminClient();
  try {
    const inputFile = InputFile.fromBuffer(file, file.name);
    const bucketFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      inputFile
    );
    const fileDocument = {
      type: getFileType(bucketFile.name).type,
      name: bucketFile.name,
      url: constructFileUrl(bucketFile.$id),
      extension: getFileType(bucketFile.name).extension,
      size: bucketFile.sizeOriginal,
      owner: ownerId,
      accountid,
      users: [],
      bucketFileId: bucketFile.$id,
    };
    const newFile = await databases
      .createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollection,
        ID.unique(),
        fileDocument
      )
      .catch(async (error: unknown) => {
        await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
        console.log(error);
      });
    revalidatePath(path);
    return parseStringify(newFile);
  } catch (error) {
    console.log(error);
  }
};

const createQueries = (currentUser: Models.Document) => {
  const queries = [
    Query.or([
      Query.equal("owner", currentUser.$id), // Removed array brackets
      Query.search("users", currentUser.email), // Changed to search instead of contains
    ]),
  ];
  return queries;
};

export const getFiles = async ({
  types = [],
  sort = "$createdAt-desc",
  searchText = "",
  limit,
}: GetFilesProps) => {
  const { databases } = await createAdminClient();
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("User not found");
    }

    const queries = [
      Query.or([
        Query.equal("owner", currentUser.$id),
        Query.equal("accountid", currentUser.accountid),
        Query.contains("users", [currentUser.email]), // Changed from search to contains
      ]),
    ];

    if (types.length > 0) {
      queries.push(Query.equal("type", types));
    }

    if (searchText) {
      queries.push(Query.contains("name", searchText));
    }

    if (limit) {
      queries.push(Query.limit(limit));
    }

    // Handle different sort types
    const [field, direction] = sort.split("-");
    if (field && direction) {
      if (direction === "desc") {
        queries.push(Query.orderDesc(field));
      } else {
        queries.push(Query.orderAsc(field));
      }
    }

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollection,
      queries
    );

    if (!files || !files.documents) {
      throw new Error("No files returned from database");
    }

    return parseStringify(files);
  } catch (error) {
    console.error("Error in getFiles:", error);
    throw error;
  }
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
  const { databases } = await createAdminClient();
  try {
    const newName = `${name}.${extension}`;
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollection,
      fileId,
      { name: newName }
    );
    revalidatePath(path);
    return parseStringify(updatedFile);
  } catch (error) {
    console.log(error);
  }
};

export const updateFileUsers = async ({
  fileId,
  emails,
  path,
}: UpdateFileUsersProps) => {
  const { databases } = await createAdminClient();
  try {
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollection,
      fileId,
      { users: emails }
    );
    revalidatePath(path);
    return parseStringify(updatedFile);
  } catch (error) {
    console.log(error);
  }
};

export const deleteFile = async ({
  fileId,
  bucketFileId,
  path,
}: DeleteFileProps) => {
  const { databases, storage } = await createAdminClient();
  try {
    const deletedFile = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollection,
      fileId
    );
    if (deletedFile) {
      await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
    }
    revalidatePath(path);
    return parseStringify({ status: "success" });
  } catch (error) {
    console.log(error);
  }
};

export async function getTotalSpaceUsed() {
  const defaultTotalSpace = {
    image: { size: 0, latestDate: "" },
    document: { size: 0, latestDate: "" },
    video: { size: 0, latestDate: "" },
    audio: { size: 0, latestDate: "" },
    other: { size: 0, latestDate: "" },
    used: 0,
    all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
  };

  try {
    const { databases } = await createAdminClient(); // Changed from createSessionClient
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User is not authenticated.");

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollection,
      [
        Query.or([
          Query.equal("owner", currentUser.$id),
          Query.equal("accountid", currentUser.accountid),
          Query.contains("users", [currentUser.email]), // Changed from search to contains
        ]),
      ]
    );

    const totalSpace = { ...defaultTotalSpace };

    files.documents.forEach((file) => {
      const fileType = file.type as FileType;
      totalSpace[fileType].size += file.size;
      totalSpace.used += file.size;

      if (
        !totalSpace[fileType].latestDate ||
        new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
      ) {
        totalSpace[fileType].latestDate = file.$updatedAt;
      }
    });

    return parseStringify(totalSpace);
  } catch (error) {
    console.log(error);
    return parseStringify(defaultTotalSpace); // Return default values on error
  }
}
