import { SELECTOR } from "./constants/index.js";
import {
    MezonInputObject,
    MezonButtonUIObject,
} from "../../../../component-ui-object/index.js";
import { Upload } from "../../../../utils/index.js";
import { Media, sleep } from "../../../../utils/index.js";
import path from "path";
import { Step } from "../../../../decorators/index.js";

export class CreateClanModalComponent {
    private DEFAULT_TIMEOUT = 15000;
    private mezonInput: MezonInputObject;
    private mezonButton: MezonButtonUIObject;

    private constructor() {
        this.mezonInput = MezonInputObject.init();
        this.mezonButton = MezonButtonUIObject.init();
    }

    static init(): CreateClanModalComponent {
        return new CreateClanModalComponent();
    }

    static async using<T>(
        fn: (component: CreateClanModalComponent) => Promise<T>
    ): Promise<T> {
        return fn(CreateClanModalComponent.init());
    }

    async waitForVisible(timeout = this.DEFAULT_TIMEOUT) {
        await this.show(SELECTOR.CLOSE_BUTTON, timeout);
        await this.mezonInput.waitForVisible();
        await this.mezonButton.waitForVisible();
    }

    private async show(selector: SELECTOR, timeout = this.DEFAULT_TIMEOUT) {
        const el = $(selector);
        await el.waitForExist({ timeout });
        await el.waitForDisplayed({ timeout });
        return el;
    }

    @Step("Is Modal Visible")
    async isModalVisible(timeout = this.DEFAULT_TIMEOUT): Promise<boolean> {
        const modal = await this.show(SELECTOR.CLOSE_BUTTON, timeout);
        return await modal.isDisplayed();
    }

    @Step("Close")
    async close(): Promise<CreateClanModalComponent> {
        const closeButton = await this.show(SELECTOR.CLOSE_BUTTON);
        await closeButton.click();
        return this;
    }

    @Step("Set Clan Name")
    async setClanName(name: string): Promise<CreateClanModalComponent> {
        await this.mezonInput.setInput(name);
        return this;
    }

    @Step("Get Clan Name")
    async getClanName(): Promise<string> {
        const input = await this.mezonInput.input;
        return await input.getValue();
    }

    @Step("Upload Image")
    async uploadImage(
        callbackUploadImage: (upload: Upload) => Promise<string>
    ): Promise<CreateClanModalComponent> {
        const mediaPath = await Upload.using(callbackUploadImage);
        await this.uploadImageFromLibrary(mediaPath);
        return this;
    }

    @Step("Upload Image From Library")
    async uploadImageFromLibrary(
        localImagePath: string
    ): Promise<CreateClanModalComponent> {
        const abs = path.isAbsolute(localImagePath)
            ? localImagePath
            : path.resolve(process.cwd(), localImagePath);
        const { filename } = await Media.addPhotoToDevice({ localPath: abs });
        const uploadButton = await this.show(SELECTOR.UPLOAD_IMAGE_BUTTON);
        await uploadButton.click();
        await Media.selectImageInNativePicker(filename);
        return this;
    }

    @Step("Create Clan")
    async createClan(): Promise<void> {
        await this.mezonButton.click();
    }

    get clanNameInput() {
        return this.mezonInput.input;
    }

    get createClanButton() {
        return this.mezonButton.button;
    }

    @Step("Wait For Preview")
    async waitForPreview(timeout = this.DEFAULT_TIMEOUT) {
        const el = await this.show(SELECTOR.PREVIEW, timeout);
        return el;
    }
}
