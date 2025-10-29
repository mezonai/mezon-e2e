export const SELECTOR = {
    LIST: "~listClanPopup.list",
    CREATE_BUTTON: "~listClanPopup.createClanButton",

    ITEM_BY_ID: (id: string) =>
        driver.isIOS
            ? `//*[@name="listClanPopup.item.${id}"]`
            : `//*[@content-desc="listClanPopup.item.${id}"]`,
    GROUP_BY_ID: (id: string) =>
        driver.isIOS
            ? `//*[@name="listClanPopup.group.${id}"]`
            : `//*[@content-desc="listClanPopup.group.${id}"]`,
    PREVIEW_BY_TARGET_ID: (id: string) =>
        driver.isIOS
            ? `//*[@name="listClanPopup.groupPreview.${id}"]`
            : `//*[@content-desc="listClanPopup.groupPreview.${id}"]`,

    ANY_ITEM_CONTAINS: driver.isIOS
        ? `//*[contains(@name,"listClanPopup.item.")]`
        : `//*[contains(@content-desc,"listClanPopup.item.")]`,
    ANY_GROUP_CONTAINS: driver.isIOS
        ? `//*[contains(@name,"listClanPopup.group.")]`
        : `//*[contains(@content-desc,"listClanPopup.group.")]`,
    ANY_PREVIEW_CONTAINS: driver.isIOS
        ? `//*[contains(@name,"listClanPopup.groupPreview.")]`
        : `//*[contains(@content-desc,"listClanPopup.groupPreview.")]`,
};
