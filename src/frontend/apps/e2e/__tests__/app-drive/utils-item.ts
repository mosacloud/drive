import { expect, Page } from "@playwright/test";
import { getRowItem } from "./utils-embedded-grid";

export const createFolder = async (page: Page, folderName: string) => {
  await page.getByRole("button", { name: "Create Folder" }).click();
  await page.getByRole("textbox", { name: "Folder name" }).click();
  await page.getByRole("textbox", { name: "Folder name" }).fill(folderName);
  await page.getByRole("button", { name: "Create" }).click();
};

export const createFolderInCurrentFolder = async (
  page: Page,
  folderName: string,
) => {
  await page.getByTestId("create-folder-button").click();
  await page.getByTestId("create-folder-input").click();
  await page.getByTestId("create-folder-input").fill(folderName);
  await page.getByRole("button", { name: "Create" }).click();
  const folderItem = await getRowItem(page, folderName);
  await expect(folderItem).toBeVisible();
  return folderItem;
};

export const deleteCurrentFolder = async (page: Page) => {
  const breadcrumbs = page.getByTestId("explorer-breadcrumbs");
  await expect(breadcrumbs).toBeVisible();
  const lastBreadcrumbButton = breadcrumbs
    .getByTestId("breadcrumb-button")
    .last();
  await lastBreadcrumbButton.click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
};
