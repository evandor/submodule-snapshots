import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useNotificationHandler} from "src/core/services/ErrorHandler";
import ContentUtils from "src/core/utils/ContentUtils";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";

const {handleSuccess, handleError} = useNotificationHandler()

export class SavePngCommand implements Command<any> {

    public readonly chromeTabId: number | undefined;

    constructor(
      public chromeTab: chrome.tabs.Tab,
      public saveAsId: string,
      public remark: string | undefined = undefined) {
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
                let html = ContentUtils.setBaseHref(this.chromeTab.url || '', res.content)
                return useSnapshotsService().screenshotFrom(html)
                    .then((res:any) => {
                        console.log("res", res, typeof res)
                        console.log("res2", typeof res.data)

                        useSnapshotsService().savePng(this.saveAsId, this.chromeTab.url || '', res.data, this.remark)
                       // useSnapshotsService().saveHTML(this.saveAsId, this.chromeTab.url || '', html, this.remark)

                        handleSuccess(
                            new ExecutionResult(
                                "done",
                                "Snapshot created"))
                    }).catch((err:any) => {
                        return handleError(err)
                    })


            })


        return Promise.resolve(
            new ExecutionResult("dummy", "this should not be called from UI"))

    }

}


SavePngCommand.prototype.toString = function cmdToString() {
    return `SavePngCommand: {tabId=${this.chromeTab.id}, chromeTabId=${this.chromeTabId}}`;
};
