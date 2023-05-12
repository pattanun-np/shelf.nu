import type { Category, Note, Prisma, Qr } from "@prisma/client";
import { ErrorCorrection } from "@prisma/client";
import type { Item, User } from "~/database";
import { db } from "~/database";
import { dateTimeInUnix, oneDayFromNow } from "~/utils";
import { createSignedUrl, parseFileFormData } from "~/utils/storage.server";
import { getQr } from "../qr";

export async function getItem({
  userId,
  id,
}: Pick<Item, "id"> & {
  userId: User["id"];
}) {
  return db.item.findFirst({
    where: { id, userId },
    include: {
      category: true,
      notes: {
        orderBy: { createdAt: "desc" },
      },
      qrCodes: true,
    },
  });
}

export async function getItems({
  userId,
  page = 1,
  perPage = 8,
  search,
  categoriesIds,
}: {
  userId: User["id"];

  /** Page number. Starts at 1 */
  page: number;

  /** Items to be loaded per page */
  perPage?: number;

  search?: string | null;

  categoriesIds?: Category["id"][] | null;
}) {
  const skip = page > 1 ? (page - 1) * perPage : 0;
  const take = perPage >= 1 && perPage <= 25 ? perPage : 8; // min 1 and max 25 per page

  /** Default value of where. Takes the items belonging to current user */
  let where: Prisma.ItemWhereInput = { userId };

  /** If the search string exists, add it to the where object */
  if (search) {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (categoriesIds && categoriesIds.length > 0) {
    where.categoryId = {
      in: categoriesIds,
    };
  }

  const [items, totalItems] = await db.$transaction([
    /** Get the items */
    db.item.findMany({
      skip,
      take,
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),

    /** Count them */
    db.item.count({ where }),
  ]);

  return { items, totalItems };
}

export async function createItem({
  title,
  description,
  userId,
  categoryId,
  qrId,
}: Pick<Item, "description" | "title" | "categoryId"> & {
  userId: User["id"];
  qrId?: Qr["id"];
}) {
  /** User connction data */
  const user = {
    connect: {
      id: userId,
    },
  };

  /**
   * If a qr code is passsed, link to that QR
   * Otherwise, create a new one
   * Here we also need to double check:
   * 1. If the qr code exists
   * 2. If the qr code belongs to the current user
   * 3. If the qr code is not linked to an item
   */
  const qr = qrId ? await getQr(qrId) : null;
  const qrCodes =
    qr && qr.userId === userId && qr.itemId === null
      ? { connect: { id: qrId } }
      : {
          create: [
            {
              version: 0,
              errorCorrection: ErrorCorrection["L"],
              user,
            },
          ],
        };

  /** Data object we send via prisma to create Asset */
  const data = {
    title,
    description,
    user,
    qrCodes,
  };

  /** If a categoryId is passed, link the category to the asset. */
  if (categoryId) {
    Object.assign(data, {
      category: {
        connect: {
          id: categoryId,
        },
      },
    });
  }

  return db.item.create({
    data,
  });
}

interface UpdateItemPayload {
  id: Item["id"];
  title?: Item["title"];
  description?: Item["description"];
  categoryId?: Item["categoryId"];
  mainImage?: Item["mainImage"];
  mainImageExpiration?: Item["mainImageExpiration"];
}

export async function updateItem(payload: UpdateItemPayload) {
  const { categoryId, id } = payload;
  /** Delete the category id from the payload so we can use connect syntax from prisma */
  delete payload.categoryId;

  if (categoryId) {
    Object.assign(payload, {
      category: {
        connect: {
          id: categoryId,
        },
      },
    });
  }

  return db.item.update({
    where: { id },
    data: payload,
  });
}

export async function deleteItem({
  id,
  userId,
}: Pick<Item, "id"> & { userId: User["id"] }) {
  return db.item.deleteMany({
    where: { id, userId },
  });
}

export async function updateItemMainImage({
  request,
  itemId,
  userId,
}: {
  request: Request;
  itemId: string;
  userId: User["id"];
}) {
  const fileData = await parseFileFormData({
    request,
    bucketName: "items",
    newFileName: `${userId}/${itemId}/main-image-${dateTimeInUnix(Date.now())}`,
    resizeOptions: {
      width: 800,
      withoutEnlargement: true,
    },
  });

  const image = fileData.get("mainImage") as string;

  if (!image) return { error: "Couldn't upload image" };

  const signedUrl = await createSignedUrl({ filename: image });

  if (typeof signedUrl !== "string") return signedUrl;

  return await updateItem({
    id: itemId,
    mainImage: signedUrl,
    mainImageExpiration: oneDayFromNow(),
  });
}

export async function createNote({
  content,
  userId,
  itemId,
}: Pick<Note, "content"> & {
  userId: User["id"];
  itemId: Item["id"];
}) {
  const data = {
    content,
    user: {
      connect: {
        id: userId,
      },
    },
    item: {
      connect: {
        id: itemId,
      },
    },
  };

  return db.note.create({
    data,
  });
}

export async function deleteNote({
  id,
  userId,
}: Pick<Note, "id"> & { userId: User["id"] }) {
  return db.note.deleteMany({
    where: { id, userId },
  });
}
