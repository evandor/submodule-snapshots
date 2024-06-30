import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {Tab} from "src/tabsets/models/Tab";
import {useNotificationHandler} from "src/core/services/ErrorHandler";
import TabsetService from "src/tabsets/services/TabsetService";
import ContentUtils from "src/core/utils/ContentUtils";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {BlobType} from "src/snapshots/models/BlobMetadata";

const {handleSuccess, handleError} = useNotificationHandler()


export class SavePdfCommand implements Command<any> {

    public readonly chromeTabId: number | undefined;

    constructor(
        public tab: Tab,
        public remark: string | undefined = undefined) {
        this.chromeTabId = this.tab.url ? TabsetService.chromeTabIdFor(this.tab.url) : undefined
    }

    async execute(): Promise<ExecutionResult<any>> {
        // if (!usePermissionsStore().hasPermission('pageCapture')) {
        //     handleError("missing permission pageCapture")
        //     return Promise.reject("xxx")
        // }
        if (!this.chromeTabId) {
            return Promise.reject("could not find chromeTabId for tab")
        }
        console.log("capturing tab id", this.chromeTabId)

        chrome.tabs.sendMessage(
            this.chromeTabId || 0,
            "getContent",
            {},
            (res) => {
                console.log("getContent returned result with length", res?.content?.length, this.chromeTabId)
                let html = ContentUtils.setBaseHref(this.tab.url || '', res.content)
                return useSnapshotsService().convertFrom(html)
                    .then((res: any) => {
                        console.log("res", res, typeof res)
                        console.log("res2", typeof res.data)

                        // useSnapshotsService().saveBlob(this.tab.id, this.tab.url || '', res.data, BlobType.PDF, this.remark)


                        handleSuccess(
                            new ExecutionResult(
                                "done",
                                "PDF created"))
                    }).catch((err: any) => {
                        return handleError(err)
                    })


            })

        return Promise.resolve(
            new ExecutionResult("dummy", "this should not be called from UI"))

    }

}


SavePdfCommand.prototype.toString = function cmdToString() {
    return `SavePdfCommand: {tabId=${this.tab.id}, chromeTabId=${this.chromeTabId}}`;
};
