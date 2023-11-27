/*
Copyright 2019, 2021 The Matrix.org Foundation C.I.C.
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";

import { Icon as FileIcon } from "../../../../res/img/feather-customised/files.svg";
import { _t } from "../../../languageHandler";
import Modal from "../../../Modal";
import BuyCredits2 from "../settings/BuyCredits2";
import ErrorDialog from "./ErrorDialog";
import { getBlobSafeMimeType } from "../../../utils/blobs";
import BaseDialog from "./BaseDialog";
import axios from "axios";
import { MatrixClientPeg } from "../../../MatrixClientPeg";
import { extractWalletAddress } from "../../../paymentServices";
import SdkConfig from "../../../SdkConfig";
import DialogButtons from "../elements/DialogButtons";
import { fileSize } from "../../../utils/FileUtils";

interface IProps {
    file: File;
    currentIndex: number;
    totalFiles: number;
    onFinished: (uploadConfirmed: boolean, uploadAll?: boolean) => void;
}

export default class UploadConfirmDialog extends React.Component<IProps> {
    private readonly objectUrl: string;
    private readonly mimeType: string;

    public static defaultProps: Partial<IProps> = {
        totalFiles: 1,
        currentIndex: 0,
    };

    public constructor(props: IProps) {
        super(props);

        // Create a fresh `Blob` for previewing (even though `File` already is
        // one) so we can adjust the MIME type if needed.
        this.mimeType = getBlobSafeMimeType(props.file.type);
        const blob = new Blob([props.file], { type: this.mimeType });
        this.objectUrl = URL.createObjectURL(blob);
    }

    public componentWillUnmount(): void {
        if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    }

    private onCancelClick = (): void => {
        this.props.onFinished(false);
    };

    private onUploadClick = async (): Promise<void> => {
        const cli = MatrixClientPeg.get();
        let toSend = true;
        await axios
            .post(`${SdkConfig.get("backend_url")}/chat-webhook`, {
                service: "sms_mms",
                type: "send",
                address: extractWalletAddress(cli.getUserId()),
                password: "demo123",
            })
            .catch((e) => {
                Modal.createDialog(ErrorDialog, {
                    title: _t("Insufficient credits message"),
                    description: <BuyCredits2 />,
                });
                toSend = false;
                console.log("TTTTTTTTTTTTTT", e);
            });
        this.props.onFinished(toSend);
    };

    private onUploadAllClick = async (): Promise<void> => {
        // const cli = MatrixClientPeg.get();
        // await axios.post(`${SdkConfig.get("backend_url")}/chat-webhook`, {
        //     service: "intra_app",
        //     type: "send",
        //     address: extractWalletAddress(cli.getUserId()),
        //     password: "demo123",
        // });
        this.props.onFinished(true, true);
    };

    public render(): React.ReactNode {
        let title: string;
        if (this.props.totalFiles > 1 && this.props.currentIndex !== undefined) {
            title = _t("Upload files (%(current)s of %(total)s)", {
                current: this.props.currentIndex + 1,
                total: this.props.totalFiles,
            });
        } else {
            title = _t("Upload files");
        }

        const fileId = `mx-uploadconfirmdialog-${this.props.file.name}`;
        let preview: JSX.Element | undefined;
        let placeholder: JSX.Element | undefined;
        if (this.mimeType.startsWith("image/")) {
            preview = (
                <img className="mx_UploadConfirmDialog_imagePreview" src={this.objectUrl} aria-labelledby={fileId} />
            );
        } else if (this.mimeType.startsWith("video/")) {
            preview = (
                <video
                    className="mx_UploadConfirmDialog_imagePreview"
                    src={this.objectUrl}
                    playsInline
                    controls={false}
                />
            );
        } else {
            placeholder = <FileIcon className="mx_UploadConfirmDialog_fileIcon" height={18} width={18} />;
        }

        let uploadAllButton: JSX.Element | undefined;
        if (this.props.currentIndex + 1 < this.props.totalFiles) {
            uploadAllButton = <button onClick={this.onUploadAllClick}>{_t("Upload all")}</button>;
        }

        return (
            <BaseDialog
                className="mx_UploadConfirmDialog"
                fixedWidth={false}
                onFinished={this.onCancelClick}
                title={title}
                contentId="mx_Dialog_content"
            >
                <div id="mx_Dialog_content">
                    <div className="mx_UploadConfirmDialog_previewOuter">
                        <div className="mx_UploadConfirmDialog_previewInner">
                            {preview && <div>{preview}</div>}
                            <div id={fileId}>
                                {placeholder}
                                {this.props.file.name} ({fileSize(this.props.file.size)})
                            </div>
                        </div>
                    </div>
                </div>

                <DialogButtons
                    primaryButton={_t("Upload")}
                    hasCancel={false}
                    onPrimaryButtonClick={this.onUploadClick}
                    focus={true}
                >
                    {uploadAllButton}
                </DialogButtons>
            </BaseDialog>
        );
    }
}
