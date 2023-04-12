import type { Category, Item } from "@prisma/client";
import { Form, useFetcher } from "@remix-run/react";
import { Button } from "~/components/shared/button";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/shared/modal";
import { isFormProcessing } from "~/utils";
import { TrashIcon } from "../icons";

export const DeleteCategory = ({
  category,
}: {
  category: Pick<Category, "name" | "id">;
}) => {
  const fetcher = useFetcher();
  const disabled = isFormProcessing(fetcher.state);

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button
          disabled={disabled}
          variant="secondary"
          size="sm"
          type="submit"
          className="text-[12px]"
          icon={"trash"}
          title={"Delete"}
        />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 p-2 text-error-600">
            <TrashIcon />
          </span>
          <AlertDialogTitle>Delete {category.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this category? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Form method="delete" action="/categories">
            <input type="hidden" name="id" value={category.id} />
            <Button
              className="border-error-600 bg-error-600 hover:border-error-800 hover:bg-error-800"
              type="submit"
            >
              Delete
            </Button>
          </Form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
