"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Models } from "node-appwrite";
import { actionsDropdownItems } from "@/constants";
import Link from "next/link";
import { constructDownloadUrl } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  deleteFile,
  renameFile,
  updateFileUsers,
} from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { FileDetails, ShareInput } from "./ActionsModalContent";

const ActionDropDown = ({ file }: { file: Models.Document }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null as ActionType | null,
  });
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);

  const path = usePathname();

  const resetState = useCallback(() => {
    setModalState({ isOpen: false, action: null });
    setDropdownOpen(false);
    setEmails([]);
    setName(file.name);
    setIsLoading(false);
  }, [file.name]);

  const handleModalClose = useCallback(() => {
    resetState();
  }, [resetState]);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  const handleAction = async () => {
    if (!modalState.action) return;
    setIsLoading(true);
    let success = false;
    const actions = {
      rename: async () => {
        const result = await renameFile({
          fileId: file.$id,
          name: name,
          extension: file.extension,
          path,
        });
        return !!result;
      },
      share: async () => {
        const result = await updateFileUsers({
          fileId: file.$id,
          emails,
          path,
        });
        return !!result;
      },
      delete: async () => {
        const result = await deleteFile({
          fileId: file.$id,
          path,
          bucketFileId: file.bucketFileId,
        });
        return !!result;
      },
    };

    try {
      if (modalState.action.value in actions) {
        success =
          await actions[modalState.action.value as keyof typeof actions]();
        if (success) {
          resetState();
        }
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (emailToRemove: string) => {
    const updatedEmails = file.users.filter((email) => email !== emailToRemove);
    const success = await updateFileUsers({
      fileId: file.$id,
      emails: updatedEmails,
      path,
    });
    if (success) {
      setEmails(updatedEmails);
    }
  };

  const renderDialogContent = () => {
    if (!modalState.action) return null;
    const { value, label } = modalState.action;
    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {value === "share" && (
            <ShareInput
              file={file}
              onInputChange={setEmails}
              onRemove={handleRemoveUser}
            />
          )}
          {value === "delete" && (
            <p className="delete-confirmation">
              Are You Sure You Want To Delete{" "}
              <span className="delete-file-name">{file.name}</span> ?
            </p>
          )}
          {value === "details" && <FileDetails file={file} />}
        </DialogHeader>
        {["rename", "delete", "share"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={resetState} className="modal-cancel-button">
              Cancel
            </Button>
            <Button onClick={handleAction} className="modal-submit-button">
              <p className="capitalize">{value}</p>{" "}
              {isLoading && (
                <Image
                  src={"/assets/icons/loader.svg"}
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src={"/assets/icons/dots.svg"}
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionsDropdownItems.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="shad-dropdown-item"
              onClick={() => {
                setModalState({
                  isOpen: ["rename", "share", "delete", "details"].includes(
                    actionItem.value
                  ),
                  action: actionItem,
                });
                setDropdownOpen(false);
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={constructDownloadUrl(file.bucketFileId)}
                  download={file.name}
                  className="flex items-center gap-2"
                >
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={modalState.isOpen}
        onOpenChange={(open) => {
          if (!open) handleModalClose();
          setModalState((prev) => ({ ...prev, isOpen: open }));
        }}
      >
        {modalState.isOpen && renderDialogContent()}
      </Dialog>
    </>
  );
};

export default ActionDropDown;
