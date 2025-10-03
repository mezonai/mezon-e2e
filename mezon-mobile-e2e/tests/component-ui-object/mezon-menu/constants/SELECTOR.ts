export enum SELECTOR {
    CONTAINER = "~mezonMenu.container",
    SECTION_TITLE = "~mezonMenuSection.sectionTitle.",
    ITEM_BTN_PREFIX = "~mezonMenuItem.btn.",
    ITEM_TEXT_WRAPPER_PREFIX = "~mezonMenuItem.btnTextWrapper.",
}

export const ITEM_BTN = (title: string) => `${SELECTOR.ITEM_BTN_PREFIX}${title}`;
export const ITEM_TEXT_WRAPPER = (title: string) => `${SELECTOR.ITEM_TEXT_WRAPPER_PREFIX}${title}`;


